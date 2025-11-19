"""
Configuration for CRRT Clot Prediction API
"""

# Feature lists
FULL_FEATURES = [
    'access_pressure', 'blood_flow', 'citrate', 'current_goal', 'dialysate_rate', 
    'effluent_pressure', 'filter_pressure', 'heparin_dose', 'hourly_patient_fluid_removal', 
    'prefilter_replacement_rate', 'postfilter_replacement_rate', 'replacement_rate', 
    'return_pressure', 'ultrafiltrate_output', 'hematocrit', 'hemoglobin', 'platelet', 
    'rbc', 'wbc', 'fibrinogen', 'inr', 'pt', 'ptt', 'aniongap', 'bicarbonate', 'bun', 
    'calcium', 'chloride', 'creatinine', 'glucose', 'sodium', 'potassium', 'lactate', 
    'ph', 'pco2', 'magnesium', 'phosphate', 'ldh', 'high_pressure', 'bun_creatinine_ratio', 
    'platelet_ptt_interaction', 'hct_bloodflow_interaction', 'wbc_rbc_ratio', 
    'platelet_wbc_ratio', 'flow_pressure_ratio', 'ptt_squared', 'platelets_squared', 
    'hour_of_day', 'day_of_week', 'is_weekend', 'is_night_shift', 'platelet_change', 
    'platelet_change_rate', 'ptt_change', 'ptt_change_rate', 'creatinine_change', 
    'creatinine_change_rate', 'hematocrit_change', 'hematocrit_change_rate'
]

TOP10_FEATURES = [
    'blood_flow', 'citrate', 'heparin_dose', 'phosphate', 'fibrinogen', 
    'effluent_pressure', 'filter_pressure', 'prefilter_replacement_rate', 
    'creatinine', 'replacement_rate'
]

DERIVED_FEATURES = [
    'bun_creatinine_ratio',
    'platelet_ptt_interaction',
    'hct_bloodflow_interaction',
    'wbc_rbc_ratio',
    'platelet_wbc_ratio',
    'flow_pressure_ratio',
    'ptt_squared',
    'platelets_squared',
]

CHANGE_DERIVED = [
    'platelet_change_rate',
    'ptt_change_rate',
    'creatinine_change_rate',
    'hematocrit_change_rate'
]

# Brand colors
COLORS = {
    "blue": "#4C64DE",
    "orange": "#F9AE37",
    "red": "#FF4631"
}

# Model paths
from pathlib import Path

# Get the backend directory (where this file is located)
BACKEND_DIR = Path(__file__).parent
MODELS_DIR = BACKEND_DIR / "models"

MODEL_PATHS = {
    "xgb_full": str(MODELS_DIR / "xgb_full_57.pkl"),
    "xgb_top10": str(MODELS_DIR / "xgb_top10.pkl"),
    "scaler": str(MODELS_DIR / "scaler_full.pkl")
}