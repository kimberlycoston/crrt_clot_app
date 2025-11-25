"""
Utility functions for model loading and prediction
"""
import joblib
import numpy as np
import pandas as pd
import shap
from typing import Dict, Tuple
from config import FULL_FEATURES, TOP10_FEATURES, TOP20_FEATURES, DERIVED_FEATURES, MODEL_PATHS


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
    d['filtration_fraction'] = d.get('ultrafiltrate_output', 0) / safe(d.get('blood_flow', 1))
    d['effluent_bloodflow_ratio'] = d.get('effluent_pressure', 0) / safe(d.get('blood_flow', 1))
    
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
        
        # Get feature names from models
        self.scaler_features = list(self.scaler.feature_names_in_)
        self.top20_model_features = list(self.xgb_top10.feature_names_in_)
        
        # Features that are in the model but NOT in the scaler (pass through unscaled)
        self.unscaled_features = [f for f in self.top20_model_features if f not in self.scaler_features]
        print(f"Features to pass unscaled: {self.unscaled_features}")
        
        print("Creating SHAP explainers...")
        self.shap_full = shap.TreeExplainer(self.xgb_full)
        self.shap_top10 = shap.TreeExplainer(self.xgb_top10)
        
        print("Models loaded successfully!")
    
    def predict_top20(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """
        Make prediction using top-20 feature model
        
        Args:
            features_dict: Dictionary of top 20 features
            
        Returns:
            Tuple of (probability, shap_values_dict)
        """
        # Store the raw unscaled values for citrate and heparin_dose
        unscaled_values = {}
        for feat in self.unscaled_features:
            val = features_dict.get(feat, 0.0)
            unscaled_values[feat] = val if val is not None else 0.0
        
        # Create full feature stub for scaling
        full_stub = {feat: 0.0 for feat in FULL_FEATURES}
        
        # Fill in features from input
        for feat, val in features_dict.items():
            if feat in full_stub:
                full_stub[feat] = val if val is not None else 0.0
        
        # Compute derived features
        full_stub = compute_derived_features(full_stub)
        
        # Create DataFrame for scaling (only features the scaler knows)
        df_for_scaling = pd.DataFrame([{f: full_stub.get(f, 0.0) for f in self.scaler_features}], columns=self.scaler_features)
        
        # Scale
        scaled_array = self.scaler.transform(df_for_scaling)
        scaled_dict = dict(zip(self.scaler_features, scaled_array[0]))
        
        # Build final input in the exact order the model expects
        model_input = []
        for feat in self.top20_model_features:
            if feat in self.unscaled_features:
                # Use unscaled value directly (citrate, heparin_dose)
                model_input.append(unscaled_values.get(feat, 0.0))
            elif feat in scaled_dict:
                # Use scaled value
                model_input.append(scaled_dict[feat])
            else:
                # Feature not found - use 0
                print(f"Warning: Feature {feat} not found, using 0")
                model_input.append(0.0)
        
        model_input = np.array(model_input).reshape(1, -1)
        
        # Predict
        prob = float(self.xgb_top10.predict_proba(model_input)[0, 1])
        
        # Get SHAP values
        try:
            shap_vals = self.shap_top10.shap_values(model_input)[0]
            shap_dict = dict(zip(self.top20_model_features, shap_vals))
        except Exception as e:
            print(f"SHAP error: {e}")
            shap_dict = {feat: 0.0 for feat in self.top20_model_features}
        
        return prob, shap_dict
    
    def predict_full(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """
        Make prediction using full 57-feature model
        
        Args:
            features_dict: Dictionary of all features
            
        Returns:
            Tuple of (probability, shap_values_dict)
        """
        # Store unscaled values for citrate and heparin_dose
        unscaled_values = {
            'citrate': features_dict.get('citrate', 0.0) or 0.0,
            'heparin_dose': features_dict.get('heparin_dose', 0.0) or 0.0
        }
        
        # Compute derived features
        features_dict = compute_derived_features(features_dict)
        
        # Build DataFrame with only scaler features (exclude citrate and heparin_dose)
        scaler_data = {f: features_dict.get(f, 0.0) for f in self.scaler_features}
        df_for_scaling = pd.DataFrame([scaler_data], columns=self.scaler_features)
        df_for_scaling = df_for_scaling.fillna(0)
        
        # Scale
        scaled_array = self.scaler.transform(df_for_scaling)
        scaled_dict = dict(zip(self.scaler_features, scaled_array[0]))
        
        # Build final input in FULL_FEATURES order
        model_input = []
        for feat in FULL_FEATURES:
            if feat in ['citrate', 'heparin_dose']:
                # Use unscaled value
                model_input.append(unscaled_values[feat])
            elif feat in scaled_dict:
                # Use scaled value
                model_input.append(scaled_dict[feat])
            else:
                # Derived feature or missing - get from features_dict
                model_input.append(features_dict.get(feat, 0.0) or 0.0)
        
        model_input = np.array(model_input).reshape(1, -1)
        
        # Predict
        prob = float(self.xgb_full.predict_proba(model_input)[0, 1])
        
        # Get SHAP values
        shap_vals = self.shap_full.shap_values(model_input)[0]
        shap_dict = dict(zip(FULL_FEATURES, shap_vals))
        
        return prob, shap_dict
    
    def predict_top10(self, features_dict: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """
        Make prediction using top-10 feature model
        NOTE: The xgb_top10 model actually expects 20 features, so this redirects to predict_top20
        
        Args:
            features_dict: Dictionary of features
            
        Returns:
            Tuple of (probability, shap_values_dict)
        """
        # The "top10" model actually expects 20 features, so use predict_top20
        return self.predict_top20(features_dict)


# Global model instance (loaded once at startup)
model_bundle: ModelBundle = None


def get_model_bundle() -> ModelBundle:
    """Get or create the global model bundle"""
    global model_bundle
    if model_bundle is None:
        model_bundle = ModelBundle()
    return model_bundle