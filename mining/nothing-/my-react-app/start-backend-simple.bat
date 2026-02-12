@echo off
echo Starting ESG Backend Server...
echo.
cd /d "%~dp0esg-backend"
echo Installing dependencies...
call npm install --silent
echo.
echo Starting server on port 5000...
node server.js
pause