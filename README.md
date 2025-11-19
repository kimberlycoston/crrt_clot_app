# CRRT Clot Risk Prediction Application

A professional FastAPI + React application for predicting CRRT circuit clot formation risk using machine learning.

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with async support
- **ML Models**: XGBoost (57-feature and 10-feature models)
- **Explainability**: SHAP values for interpretable predictions
- **API Documentation**: Auto-generated Swagger UI at `/docs`

### Frontend (React + Vite)
- **Framework**: React 18 with Vite for fast development
- **Styling**: Tailwind CSS for modern, professional UI
- **Visualizations**: 
  - Risk gauge for intuitive risk display
  - SHAP charts using Recharts
- **Pages**:
  - Quick Input (Top 10 features) - for bedside use
  - Full Model (57 features) - Epic-style simulation

## 📋 Prerequisites

- Python 3.9+ 
- Node.js 18+
- npm or yarn

## 🚀 Setup Instructions

### 1. Clone and Navigate
```bash
cd crrt_clot_app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Place your model files in backend/models/:
# - xgb_full_57.pkl
# - xgb_top10.pkl
# - scaler_full.pkl
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

The frontend will be available at: http://localhost:5173

## 📚 API Endpoints

### Predictions

#### POST `/api/predict/full`
Full 57-feature model prediction with SHAP values

**Request:**
```json
{
  "features": {
    "blood_flow": 200,
    "citrate": 200,
    // ... all 57 features
  }
}
```

**Response:**
```json
{
  "probability": 0.234,
  "risk_level": "low",
  "percentage": 23.4,
  "shap_values": { ... },
  "top_contributors": { ... }
}
```

#### POST `/api/predict/top10`
Quick 10-feature model prediction

**Request:**
```json
{
  "features": {
    "blood_flow": 200,
    "citrate": 200,
    "heparin_dose": 800,
    // ... 10 features total
  }
}
```

#### POST `/api/predict/full/quick`
Fast prediction without SHAP (full model)

#### POST `/api/predict/top10/quick`
Fast prediction without SHAP (top-10 model)

### Health Check

#### GET `/health`
Returns server health status and model loading state

## 🎨 Features

### Quick Input Page (Top 10)
- Streamlined interface with 10 critical features
- Default values pre-filled for rapid input
- Real-time validation
- Designed for bedside clinical use

### Full Model Page (57 Features)
- Epic-style integration simulation
- 5 hypothetical patient scenarios:
  - Low risk (stable)
  - Moderate risk (mild inflammation)
  - High risk (rising pressures)
  - Very high risk (critical state)
  - Bleeding risk (over-anticoagulated)
- Comprehensive SHAP explanations
- AI-generated clinical narratives

### Visualizations
- **Risk Gauge**: Color-coded gauge (green/yellow/red)
- **SHAP Charts**: Bar charts showing feature contributions
  - Red bars = increases clot risk
  - Blue bars = decreases clot risk
- **Clinical Interpretations**: Auto-generated explanations

## 🔒 Security Notes

For production deployment:
1. Add authentication/authorization
2. Use HTTPS
3. Implement rate limiting
4. Add input validation
5. Set up proper CORS policies
6. Use environment variables for configuration

## 🧪 Testing the API

You can test the API using the interactive Swagger UI:

1. Open http://localhost:8000/docs
2. Try the `/health` endpoint first
3. Use the "Try it out" button on prediction endpoints
4. View example requests and responses

Or use curl:

```bash
curl -X POST "http://localhost:8000/api/predict/top10" \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "blood_flow": 200,
      "citrate": 200,
      "heparin_dose": 800,
      "phosphate": 3.5,
      "fibrinogen": 350,
      "effluent_pressure": 75,
      "filter_pressure": 125,
      "prefilter_replacement_rate": 500,
      "creatinine": 2.5,
      "replacement_rate": 700
    }
  }'
```

## 📦 Building for Production

### Backend
```bash
cd backend
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`. Serve with any static file server.

## 🐛 Troubleshooting

### Backend Issues
- **Models not loading**: Ensure `.pkl` files are in `backend/models/`
- **Port already in use**: Change port in uvicorn command
- **Import errors**: Verify all dependencies installed

### Frontend Issues
- **API connection failed**: Check backend is running on port 8000
- **Blank page**: Check browser console for errors
- **npm install fails**: Try deleting `node_modules` and `package-lock.json`, then reinstall

## 📝 Development Notes

### Adding New Features
1. Update `FULL_FEATURES` in `backend/config.py`
2. Retrain models with new features
3. Update frontend input forms
4. Update patient data structures

### Customizing UI
- Colors: Edit `frontend/tailwind.config.js`
- Styles: Modify `frontend/src/index.css`
- Components: Edit files in `frontend/src/components/`

## 🙏 Credits

Built with:
- FastAPI
- React + Vite
- Tailwind CSS
- XGBoost
- SHAP
- Recharts
- react-gauge-chart

## 📄 License

For educational and research purposes.