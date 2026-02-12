@echo off
echo ==========================================
echo ESG Platform - Phase 3 Advanced Features
echo ==========================================
echo.

echo Initializing Phase 3 database with mining schema...
cd esg-backend
call npm run init:db

echo.
echo Starting Phase 3 advanced backend server...
start "ESG Backend Phase 3" cmd /k "npm run dev:phase3"

echo.
echo Waiting for backend to start...
timeout /t 8 /nobreak > nul

echo.
echo Testing Phase 3 advanced features...
call npm run test:phase3

echo.
echo ==========================================
echo Phase 3 Advanced System Ready!
echo ==========================================
echo Backend: http://localhost:3002
echo Health Check: http://localhost:3002/health
echo.
echo 📊 Advanced Analytics:
echo - TCFD Scenario Analysis
echo - Trend Forecasting  
echo - Peer Benchmarking
echo - Risk Scoring
echo - Target Tracking
echo.
echo 📈 Enhanced Reporting:
echo - Interactive Dashboards
echo - Multi-format Exports
echo - Real-time Monitoring
echo - Stakeholder Views
echo - Assurance Support
echo.
echo ⛏️  Mining-Specific Features:
echo - Tailings Management (GRI 11)
echo - Biodiversity & Land Use
echo - Community Relations
echo - Water Stewardship
echo - Mining Risk Library
echo - Industry KPIs
echo.
echo 🔗 Key API Endpoints:
echo - /api/advanced/scenario-analysis/:companyId
echo - /api/advanced/forecast/:companyId/:metric
echo - /api/advanced/benchmarking/:companyId
echo - /api/advanced/dashboard/:companyId
echo - /api/mining/tailings
echo - /api/mining/biodiversity
echo - /api/mining/community
echo - /api/mining/risk-assessment/:companyId
echo ==========================================

pause