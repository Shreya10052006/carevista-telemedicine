# ============================================
# CareVista - One-Command Setup Script
# ============================================
# Run this script in PowerShell to set up the entire project
# Usage: .\setup.ps1

Write-Host ""
Write-Host "🏥 CareVista - Telemedicine Platform Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Python
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "  ✅ Python: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Setup Frontend
Write-Host "🌐 Setting up Frontend..." -ForegroundColor Yellow
Set-Location frontend

# Copy .env.example if .env.local doesn't exist
if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "  📄 Created .env.local from .env.example" -ForegroundColor Green
        Write-Host "  ⚠️  Please edit frontend/.env.local with your Firebase credentials" -ForegroundColor Yellow
    }
}

# Install dependencies
Write-Host "  📦 Installing npm dependencies..." -ForegroundColor Gray
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

Set-Location ..

# Setup Backend
Write-Host ""
Write-Host "⚡ Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "  🐍 Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

# Activate virtual environment and install dependencies
Write-Host "  📦 Installing Python dependencies..." -ForegroundColor Gray
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Copy .env.example if .env doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  📄 Created .env from .env.example" -ForegroundColor Green
        Write-Host "  ⚠️  Please edit backend/.env with your API keys" -ForegroundColor Yellow
    }
}

Set-Location ..

# Success message
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Edit frontend/.env.local with Firebase credentials" -ForegroundColor White
Write-Host "  2. Edit backend/.env with API keys (Groq, Gemini)" -ForegroundColor White
Write-Host "  3. Run the application:" -ForegroundColor White
Write-Host ""
Write-Host "     # Terminal 1 - Backend" -ForegroundColor Gray
Write-Host "     cd backend" -ForegroundColor Yellow
Write-Host "     .\venv\Scripts\Activate.ps1" -ForegroundColor Yellow
Write-Host "     python -m uvicorn app.main:app --reload" -ForegroundColor Yellow
Write-Host ""
Write-Host "     # Terminal 2 - Frontend" -ForegroundColor Gray
Write-Host "     cd frontend" -ForegroundColor Yellow
Write-Host "     npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Demo Mode Credentials (no Firebase needed):" -ForegroundColor Cyan
Write-Host "   Patient: +91 98765 43210 / OTP: 123456" -ForegroundColor White
Write-Host "   Doctor: demo.doctor@carevista.health / demo123" -ForegroundColor White
Write-Host "   Health Worker: hw_priya / demo123" -ForegroundColor White
Write-Host ""
