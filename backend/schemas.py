"""
Pydantic models for API request/response validation
"""
from typing import Dict, Optional
from pydantic import BaseModel, Field


class FeatureInput(BaseModel):
    """Input features for prediction"""
    features: Dict[str, float] = Field(
        ..., 
        description="Dictionary of feature names to values"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "features": {
                    "blood_flow": 200.0,
                    "citrate": 200.0,
                    "heparin_dose": 800.0,
                    "phosphate": 3.5,
                    "fibrinogen": 350.0,
                    "effluent_pressure": 75.0,
                    "filter_pressure": 125.0,
                    "prefilter_replacement_rate": 500.0,
                    "creatinine": 2.5,
                    "replacement_rate": 700.0
                }
            }
        }


class PredictionResponse(BaseModel):
    """Response with prediction probability"""
    probability: float = Field(
        ..., 
        ge=0.0, 
        le=1.0,
        description="Predicted probability of clot formation (0-1)"
    )
    risk_level: str = Field(
        ...,
        description="Risk level: low, moderate, or high"
    )
    percentage: float = Field(
        ...,
        description="Risk as percentage (0-100)"
    )


class ShapResponse(BaseModel):
    """Response with SHAP explanation values"""
    probability: float = Field(
        ...,
        description="Predicted probability"
    )
    risk_level: str
    percentage: float
    shap_values: Dict[str, float] = Field(
        ...,
        description="SHAP values for each feature"
    )
    top_contributors: Dict[str, float] = Field(
        ...,
        description="Top 10 features by absolute SHAP value"
    )


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    models_loaded: bool
    message: str