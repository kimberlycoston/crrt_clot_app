"""
Utility functions for model loading and prediction
"""
import joblib
import numpy as np
import pandas as pd
import shap
from typing import Dict, Tuple
from config import FULL_FEATURES, TOP10_FEATURES, DERIVED_FEATURES, CHANGE_DERIVED, MODEL_PATHS


def compute_derived_features(data: Dict[str, float]) -> Dict[str, float]:
    """
    Compute derived features from base features
    
    Args:
        data: Dictionary of feature values
        
    Returns:
        Dictionary with derived features added
    """
    d = data.copy()
    
    # Safe division helper
    safe = lambda x: x if x != 0 else 1
    
    # Core derived features
    d['bun_creatinine_ratio'] = d.get('bun', 0) / safe(d.get('creatinine', 1))
    d['platelet_ptt_interaction'] = d.get('platelet', 0) * d.get('ptt', 0)
    d['hct_bloodflow_interaction'] = d.get('hematocrit', 0) * d.get('blood_flow', 0)
    d['wbc_rbc_ratio'] = d.get('wbc', 0) / safe(d.get('rbc', 1))
    d['platelet_wbc_ratio'] = d.get('platelet', 0) / safe(d.get('wbc', 1))
    d['flow_pressure_ratio'] = d.get('blood_flow', 0) / safe(d.get('return_pressure', 1))
    d['ptt_squared'] = d.get('ptt', 0) ** 2
    d['platelets_squared'] = d.get('platelet', 0) ** 2
    
    # Change-rate derived features
    d['platelet_change_rate'] = d.get('platelet_change', 0) / safe(d.get('platelet', 1))
    d['ptt_change_rate'] = d.get('ptt_change', 0) / safe(d.get('ptt', 1))
    d['creatinine_change_rate'] = d.get('creatinine_change', 0) / safe(d.get('creatinine', 1))
    d['hematocrit_change_rate'] = d.get('hematocrit_change', 0) / safe(d.get('hematocrit', 1))
    
    return d


def get_risk_level(probability: float) -> str:
    """
    Categorize risk level based on probability
    
    Args:
        probability: Predicted probability (0-1)
        
    Returns:
        Risk level string: 'low', 'moderate', or 'high'
    """
    if probability < 0.3:
        return "low"
    elif probability < 0.7:
        return "moderate"
    else:
        return "high"


class ModelBundle:
    """
    Container for all models and SHAP explainers
    Loads models once and keeps them in memory
    """
    
    def __init__(self):
        """Initialize and load all models"""
        print("Loading models...")
        self.xgb_full = joblib.load(MODEL_PATHS["xgb_full"])
        self.xgb_top10 = joblib.load(MODEL_PATHS["xgb_top10"])
        self.scaler = joblib.load(MODEL_PATHS["scaler"])
        
        print("Creating SHAP explainers...")
        self.shap_full = shap.TreeExplainer(self.xgb_full)
        self.shap_top10 = shap.TreeExplainer(self.xgb_top10)
        
        print("Models loaded successfully!")
    
    def predict_full(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """
        Make prediction using full 57-feature model
        
        Args:
            features_dict: Dictionary of all 57 features
            
        Returns:
            Tuple of (probability, shap_values_dict)
        """
        # Ensure all features present
        features_dict = compute_derived_features(features_dict)
        
        # Create DataFrame with correct column order
        df = pd.DataFrame([features_dict], columns=FULL_FEATURES)
        
        # Handle missing values
        df = df.fillna(0)
        
        # Scale features
        scaled = self.scaler.transform(df)
        
        # Predict
        prob = float(self.xgb_full.predict_proba(scaled)[0, 1])
        
        # Get SHAP values
        shap_vals = self.shap_full.shap_values(scaled)[0]
        shap_dict = dict(zip(FULL_FEATURES, shap_vals))
        
        return prob, shap_dict
    
    def predict_top10(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """
        Make prediction using top-10 feature model
        
        Args:
            features_dict: Dictionary of top 10 features
            
        Returns:
            Tuple of (probability, shap_values_dict)
        """
        # Create full feature stub
        full_stub = {feat: 0.0 for feat in FULL_FEATURES}
        
        # Fill in top 10 features
        for feat in TOP10_FEATURES:
            if feat in features_dict:
                full_stub[feat] = features_dict[feat]
        
        # Compute derived features
        full_stub = compute_derived_features(full_stub)
        
        # Create DataFrame
        df_full = pd.DataFrame([full_stub], columns=FULL_FEATURES)
        
        # Scale
        scaled_full = self.scaler.transform(df_full)
        scaled_full_df = pd.DataFrame(scaled_full, columns=FULL_FEATURES)
        
        # Extract top 10
        scaled_top10 = scaled_full_df[TOP10_FEATURES].values
        
        # Predict
        prob = float(self.xgb_top10.predict_proba(scaled_top10)[0, 1])
        
        # Get SHAP values
        shap_vals = self.shap_top10.shap_values(scaled_top10)[0]
        shap_dict = dict(zip(TOP10_FEATURES, shap_vals))
        
        return prob, shap_dict


# Global model instance (loaded once at startup)
model_bundle: ModelBundle = None


def get_model_bundle() -> ModelBundle:
    """Get or create the global model bundle"""
    global model_bundle
    if model_bundle is None:
        model_bundle = ModelBundle()
    return model_bundle