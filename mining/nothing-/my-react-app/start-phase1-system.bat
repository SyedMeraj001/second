@echo off
echo ========================================
echo ESG Platform - Phase 1 Enhanced System
echo ========================================
echo.

echo Initializing enhanced database...
cd esg-backend
call npm run init:db

echo.
echo Starting Phase 1 enhanced backend server...
start "ESG Backend Phase 1" cmd /k "npm run dev:phase1"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Testing Phase 1 features...
call npm run test:phase1

echo.
echo ========================================
echo Phase 1 System Ready!
echo ========================================
echo Backend: http://localhost:3002
echo Health Check: http://localhost:3002/health
echo.
echo Phase 1 Features:
echo - Enhanced Database Schema with RBAC
echo - Data Validation Engine
echo - Audit Trail System  
echo - Multi-level Approval Workflows
echo - Role-based Access Control
echo.
echo Sample Users Created:
echo - admin@esgenius.com (admin)
echo - verifier@esgenius.com (verifier)
echo - approver@esgenius.com (approver)
echo - viewer@esgenius.com (viewer)
echo ========================================

pause