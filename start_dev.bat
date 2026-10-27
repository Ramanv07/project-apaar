@echo off
echo ==============================================================================
echo [TrustSeat] AICTE Student Data & Quota Verification Portal
echo Problem Statement 26263 - Smart India Hackathon 2026
echo ==============================================================================

echo [1/3] Checking synthetic database...
if not exist "trustseat.db" (
    echo Database not found. Seeding synthetic dataset with planted scenarios...
    python seed\seed_data.py
)

echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "TrustSeat Backend (FastAPI)" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Launching React+Vite Frontend on http://localhost:5173 ...
start "TrustSeat Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ==============================================================================
echo TrustSeat is running!
echo - Frontend: http://localhost:5173
echo - Backend API Docs: http://127.0.0.1:8000/api/docs
echo ==============================================================================
