@echo off
echo Starting ESG System with Database Integration...
echo.

echo 1. Installing backend dependencies...
cd esg-backend
call npm install
echo.

echo 2. Starting backend server on port 5000...
start "ESG Backend" cmd /k "npm start"
echo Backend server starting...
timeout /t 3 /nobreak >nul
echo.

echo 3. Starting frontend on port 3000...
cd ..
start "ESG Frontend" cmd /k "npm start"
echo Frontend server starting...
echo.

echo 4. Waiting for servers to initialize...
timeout /t 5 /nobreak >nul
echo.

echo 5. Testing API connections...
node test-api-connections.js
echo.

echo ✅ ESG System Started Successfully!
echo.
echo 📊 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 📈 KPI Endpoint: http://localhost:5000/api/kpi/1
echo.
echo Press any key to open the application...
pause >nul
start http://localhost:3000

echo System is running. Close this window to stop all services.
pause