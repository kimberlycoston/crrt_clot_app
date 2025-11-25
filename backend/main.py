"""
Main FastAPI application for CRRT Clot Prediction
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predict
from schemas import HealthCheck
from utils import get_model_bundle
from routes import llm


# Create FastAPI app
app = FastAPI(
    title="CRRT Clot Prediction API",
    description="API for predicting CRRT circuit clot formation risk",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router)


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    try:
        get_model_bundle()
        print("✓ Models loaded successfully on startup")
    except Exception as e:
        print(f"✗ Failed to load models on startup: {e}")
        raise


@app.get("/", response_model=HealthCheck)
async def root():
    """Root endpoint - health check"""
    try:
        models = get_model_bundle()
        return HealthCheck(
            status="healthy",
            models_loaded=True,
            message="CRRT Clot Prediction API is running"
        )
    except Exception as e:
        return HealthCheck(
            status="unhealthy",
            models_loaded=False,
            message=f"Models not loaded: {str(e)}"
        )


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    try:
        models = get_model_bundle()
        return HealthCheck(
            status="healthy",
            models_loaded=True,
            message="All systems operational"
        )
    except Exception as e:
        return HealthCheck(
            status="unhealthy",
            models_loaded=False,
            message=f"Error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )