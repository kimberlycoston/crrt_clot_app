"""
Diagnostic script to check if everything is set up correctly
Run from project root: python diagnose.py
"""
import sys
from pathlib import Path
import subprocess

def check_file_exists(path, description):
    """Check if a file exists"""
    if Path(path).exists():
        print(f"✅ {description}")
        return True
    else:
        print(f"❌ {description} - NOT FOUND")
        return False

def check_directory_exists(path, description):
    """Check if a directory exists"""
    if Path(path).exists() and Path(path).is_dir():
        print(f"✅ {description}")
        return True
    else:
        print(f"❌ {description} - NOT FOUND")
        return False

def check_python_package(package, description):
    """Check if a Python package is installed"""
    try:
        __import__(package)
        print(f"✅ {description}")
        return True
    except ImportError:
        print(f"❌ {description} - NOT INSTALLED")
        return False

def check_port_in_use(port):
    """Check if a port is in use"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def main():
    print("🔍 CRRT App Diagnostic Tool")
    print("=" * 60)
    
    issues = []
    
    # Check backend structure
    print("\n📂 Backend File Structure:")
    if not check_directory_exists("backend", "Backend directory"):
        issues.append("Backend directory missing")
    if not check_directory_exists("backend/models", "Models directory"):
        issues.append("Models directory missing - Run: mkdir backend/models")
    if not check_directory_exists("backend/routes", "Routes directory"):
        issues.append("Routes directory missing")
    
    # Check model files
    print("\n🤖 Model Files:")
    if not check_file_exists("backend/models/xgb_full_57.pkl", "Full XGBoost model"):
        issues.append("Full model missing - Run: python create_placeholder_models.py")
    if not check_file_exists("backend/models/xgb_top10.pkl", "Top-10 XGBoost model"):
        issues.append("Top-10 model missing - Run: python create_placeholder_models.py")
    if not check_file_exists("backend/models/scaler_full.pkl", "Feature scaler"):
        issues.append("Scaler missing - Run: python create_placeholder_models.py")
    
    # Check backend Python files
    print("\n🐍 Backend Python Files:")
    check_file_exists("backend/main.py", "main.py")
    check_file_exists("backend/config.py", "config.py")
    check_file_exists("backend/schemas.py", "schemas.py")
    check_file_exists("backend/utils.py", "utils.py")
    check_file_exists("backend/routes/predict.py", "routes/predict.py")
    
    # Check Python dependencies
    print("\n📦 Python Dependencies:")
    if not check_python_package("fastapi", "FastAPI"):
        issues.append("FastAPI not installed - Run: pip install fastapi")
    if not check_python_package("uvicorn", "Uvicorn"):
        issues.append("Uvicorn not installed - Run: pip install uvicorn")
    if not check_python_package("pandas", "Pandas"):
        issues.append("Pandas not installed - Run: pip install pandas")
    if not check_python_package("numpy", "NumPy"):
        issues.append("NumPy not installed - Run: pip install numpy")
    if not check_python_package("sklearn", "Scikit-learn"):
        issues.append("Scikit-learn not installed - Run: pip install scikit-learn")
    if not check_python_package("xgboost", "XGBoost"):
        issues.append("XGBoost not installed - Run: pip install xgboost")
    if not check_python_package("shap", "SHAP"):
        issues.append("SHAP not installed - Run: pip install shap")
    if not check_python_package("joblib", "Joblib"):
        issues.append("Joblib not installed - Run: pip install joblib")
    
    # Check frontend structure
    print("\n📂 Frontend File Structure:")
    if not check_directory_exists("frontend", "Frontend directory"):
        issues.append("Frontend directory missing")
    check_file_exists("frontend/package.json", "package.json")
    check_file_exists("frontend/vite.config.js", "vite.config.js")
    check_file_exists("frontend/apiClient.js", "apiClient.js (correct API client)")
    check_file_exists("frontend/app.jsx", "app.jsx")
    check_file_exists("frontend/top10page.jsx", "top10page.jsx")
    check_file_exists("frontend/demopage.jsx", "demopage.jsx")
    
    # Check if node_modules exists
    print("\n📦 Frontend Dependencies:")
    if check_directory_exists("frontend/node_modules", "node_modules directory"):
        print("   Dependencies appear to be installed")
    else:
        print("❌ node_modules not found")
        issues.append("Frontend dependencies not installed - Run: cd frontend && npm install")
    
    # Check if servers are running
    print("\n🌐 Server Status:")
    if check_port_in_use(8000):
        print("✅ Backend server appears to be running on port 8000")
    else:
        print("❌ Backend server not running on port 8000")
        issues.append("Backend server not running - Run: cd backend && python main.py")
    
    if check_port_in_use(5173):
        print("✅ Frontend server appears to be running on port 5173")
    else:
        print("❌ Frontend server not running on port 5173")
        issues.append("Frontend server not running - Run: cd frontend && npm run dev")
    
    # Summary
    print("\n" + "=" * 60)
    if len(issues) == 0:
        print("✅ Everything looks good! Your app should be working.")
        print("\n🌐 Access your app at: http://localhost:5173")
        print("📋 Backend API docs at: http://localhost:8000/docs")
    else:
        print(f"❌ Found {len(issues)} issue(s):")
        print()
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
        print("\n📖 See SETUP_GUIDE.md for detailed instructions")
    
    print("=" * 60)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error running diagnostic: {e}")
        sys.exit(1)