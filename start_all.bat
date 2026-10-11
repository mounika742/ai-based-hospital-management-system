@echo off
echo ===============================================================
echo Launching MediPulse AI Hospital Management System (Full Stack)
echo ===============================================================
echo Starting Flask Backend API on http://127.0.0.1:5000 ...
start "MediPulse Hospital Backend API" cmd /k "cd backend && python run.py"
timeout /t 2 >nul
echo Starting Vite Frontend on http://localhost:5173 ...
start "MediPulse Hospital Frontend" cmd /k "cd frontend && npm run dev"
echo Both servers started! Open http://localhost:5173 in your browser.
pause
