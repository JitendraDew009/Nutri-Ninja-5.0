# Nutri Ninja - Automated Build Setup Script (Windows PowerShell)
# Run this script in the project root directory
# Usage: .\build-setup.ps1
# Note: You may need to enable script execution: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🥷 Nutri Ninja Build Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js v18+" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm -v
    Write-Host "✓ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup Frontend
Write-Host "[2/5] Setting up Frontend..." -ForegroundColor Yellow
Push-Location frontend
Write-Host "Installing frontend dependencies..."
npm install
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Pop-Location
Write-Host ""

# Setup Backend
Write-Host "[3/5] Setting up Backend Python environment..." -ForegroundColor Yellow
Push-Location backend

# Check if venv already exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..."
& ".\venv\Scripts\Activate.ps1"
Write-Host "✓ Virtual environment activated" -ForegroundColor Green
Write-Host ""

# Install Python dependencies
Write-Host "[4/5] Installing Backend dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Pop-Location
Write-Host ""

# Summary
Write-Host "[5/5] Build setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Backend (in PowerShell):"
Write-Host "   cd backend"
Write-Host "   .\venv\Scripts\Activate.ps1"
Write-Host "   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Write-Host ""
Write-Host "2. In another PowerShell, start Frontend:"
Write-Host "   cd frontend"
Write-Host "   npm run web"
Write-Host ""
Write-Host "3. Access the application:"
Write-Host "   - Backend API: http://localhost:8000"
Write-Host "   - API Docs: http://localhost:8000/docs"
Write-Host "   - Frontend Web: http://localhost:8081"
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Build setup completed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
