@echo off
echo 🚀 Starting ESG Platform with Advanced Features...
echo.

echo 📊 Initializing Advanced Database Features...
cd esg-backend
node init-advanced-features.js
echo.

echo 🖥️  Starting Backend Server...
start "ESG Backend" cmd /k "npm start"
timeout /t 3 /nobreak > nul

echo ⚛️  Starting Frontend Application...
cd ..
start "ESG Frontend" cmd /k "npm start"

echo.
echo ✅ ESG Platform Started Successfully!
echo.
echo 🎯 New Features Available:
echo    🔥 Risk Heatmap - Click red button on right side
echo    ⚙️ Custom Taxonomy - Click purple button on right side
echo.
echo 🌐 Access URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3002
echo.
echo 📋 Login Credentials:
echo    Email: admin@esgenius.com
echo    Password: admin123
echo.
pause