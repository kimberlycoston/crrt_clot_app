import joblib

# Adjust path to where your model actually is
model = joblib.load('../backend/models/xgb_top10.pkl')

print("Features the model expects:")
print(model.feature_names_in_.tolist())

import joblib
scaler = joblib.load('../backend/models/scaler_full.pkl')
print("Scaler expects:")
print(scaler.feature_names_in_.tolist())