"""
API routes for predictions
"""
from fastapi import APIRouter, HTTPException
from schemas import FeatureInput, PredictionResponse, ShapResponse
from utils import get_model_bundle, get_risk_level

router = APIRouter(prefix="/api/predict", tags=["predictions"])


@router.post("/full", response_model=ShapResponse)
async def predict_full_model(input_data: FeatureInput):
    """
    Make prediction using the full 57-feature model with SHAP explanation
    
    Args:
        input_data: Feature input containing all 57 features
        
    Returns:
        Prediction probability, risk level, and SHAP values
    """
    try:
        models = get_model_bundle()
        prob, shap_values = models.predict_full(input_data.features)
        
        # Get top contributors (sorted by absolute SHAP value)
        sorted_shap = sorted(
            shap_values.items(), 
            key=lambda x: abs(x[1]), 
            reverse=True
        )[:10]
        top_contributors = dict(sorted_shap)
        
        return ShapResponse(
            probability=prob,
            risk_level=get_risk_level(prob),
            percentage=prob * 100,
            shap_values=shap_values,
            top_contributors=top_contributors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/top10", response_model=ShapResponse)
async def predict_top10_model(input_data: FeatureInput):
    """
    Make prediction using the top-10 feature model with SHAP explanation
    
    Args:
        input_data: Feature input containing top 10 features
        
    Returns:
        Prediction probability, risk level, and SHAP values
    """
    try:
        models = get_model_bundle()
        prob, shap_values = models.predict_top10(input_data.features)
        
        # Get top contributors
        sorted_shap = sorted(
            shap_values.items(), 
            key=lambda x: abs(x[1]), 
            reverse=True
        )
        top_contributors = dict(sorted_shap)
        
        return ShapResponse(
            probability=prob,
            risk_level=get_risk_level(prob),
            percentage=prob * 100,
            shap_values=shap_values,
            top_contributors=top_contributors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/full/quick", response_model=PredictionResponse)
async def predict_full_quick(input_data: FeatureInput):
    """
    Quick prediction with full model (no SHAP values)
    Faster for when you just need the risk score
    """
    try:
        models = get_model_bundle()
        prob, _ = models.predict_full(input_data.features)
        
        return PredictionResponse(
            probability=prob,
            risk_level=get_risk_level(prob),
            percentage=prob * 100
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@router.post("/top10/quick", response_model=PredictionResponse)
async def predict_top10_quick(input_data: FeatureInput):
    """
    Quick prediction with top-10 model (no SHAP values)
    Faster for when you just need the risk score
    """
    try:
        models = get_model_bundle()
        prob, _ = models.predict_top10(input_data.features)
        
        return PredictionResponse(
            probability=prob,
            risk_level=get_risk_level(prob),
            percentage=prob * 100
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

