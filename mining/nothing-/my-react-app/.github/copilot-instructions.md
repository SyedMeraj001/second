# ESG Platform - AI Coding Agent Instructions

## System Architecture

This is a **React + Node.js ESG (Environmental, Social, Governance) reporting platform** with **mining-specific features** and enterprise security requirements.

### Tech Stack
- **Frontend**: React 18, React Router v6, Chart.js, Recharts, Tailwind CSS
- **Backend**: Express.js (Node.js ES modules), Sequelize ORM, SQLite
- **Key Libraries**: axios, jsPDF, xlsx, i18next, React Icons
- **Security**: Helmet, CORS, CSRF protection, bcrypt, JWT tokens

### Core Components
- **Frontend** (`src/`): React SPAs with lazy loading, role-based UI rendering
- **Backend** (`esg-backend/`): RESTful APIs with Sequelize models for 15 ESG data types
- **Database**: SQLite with Sequelize migrations

---

## Architecture & Data Flow

### User Authentication & RBAC
The system uses **localStorage-based role hierarchy** (defined in `src/utils/rbac.js`):
- **Data Entry** (30 users): `VIEW_DATA`, `UPDATE_DATA`
- **Supervisor** (15 users): Full CRUD on data, reports, analytics, NO authorization
- **Super Admin** (3 users): All permissions including user management

**Key Files**: `src/Login.jsx`, `src/utils/rbac.js`, `esg-backend/middleware/authMiddleware.js`

### API Request Flow
1. Frontend calls `APIService.request()` or `moduleAPI.request()` (in `src/services/`)
2. **SSRF/Path Traversal Protection**: All endpoints must start with `/` and are sanitized
3. **CSRF Protection**: Backend requires `X-CSRF-Token` header for state-changing ops
4. Backend authenticates via JWT tokens, validates user role permissions
5. Sequelize models handle DB operations; errors return in `{ success: false, error: '...' }` format

**Port Convention**: 
- Frontend: 3000 (React dev server)
- Backend: 5000 (main server), 3001-3003 (phase-specific servers)

---

## Critical Workflows

### Starting the System
```bash
# In esg-backend directory
npm install
npm start  # or: npm run dev (with nodemon)

# Frontend (separate terminal)
npm start  # React app
```

After backend startup, health check: `http://localhost:5000/health`

### Testing
Backend has **multiple test scripts** for different features:
- `npm run test:all` - All phases
- `npm run test:security` - Security features  
- `npm run test:mobile` - Mobile UI
- Each test uses axios and CSRF token management

### Building
```bash
npm run build  # Creates optimized React bundle in build/
```

---

## Project-Specific Conventions

### 1. API Service Pattern
All API calls go through `APIService.request()` with endpoint validation:
```javascript
// Validates endpoint starts with / and sanitizes path traversal
static async request(endpoint, options = {}) { ... }
```
This prevents SSRF attacks - **never bypass this**.

### 2. Component Structure  
- **Lazy-loaded components** in `src/components/LazyComponents.js` for performance
- **Protected routes** via `ProtectedRoute.jsx` - wraps components requiring authentication
- **PermissionGuard.jsx** - wraps UI elements requiring specific permissions (use `hasPermission()` from rbac.js)

### 3. Data Models (15 ESG types in backend)
Route pattern: `/api/esg/:model/:companyId` (GET list), `/api/esg/:model` (POST create)
Models include: WasteData, AirQualityData, BiodiversityData, HumanRightsData, WorkforceData, SafetyIncidents, etc.

All models use Sequelize with consistent controller pattern:
```javascript
ESGController.findAll(modelName, companyId, queryParams)
ESGController.create(modelName, data)
ESGController.update(modelName, id, data)
```

### 4. Error Handling
**Backend consistently returns**:
```json
{ "success": false, "error": "message" }  // Failures
{ "success": true, "data": {...} }        // Success
```

**Frontend gracefully handles offline** - `APIService` returns mock data if backend unreachable.

### 5. RBAC Implementation
**Permission checks** (not role names):
```javascript
import { hasPermission, PERMISSIONS, USER_ROLES } from '../utils/rbac';
hasPermission(userRole, PERMISSIONS.MANAGE_USERS) // returns boolean
```
Permissions are role-independent; roles map to permission arrays.

### 6. Mining-Specific Features
Codebase includes mining-focused compliance (GRI 11 tailings management, biodiversity, water stewardship) in:
- `src/MiningESGModule.js`
- `esg-backend/routes/miningRoutes.js`  
- Framework compliance templates for GRI, BRSR

---

## Known Issues & Security Concerns

### ⚠️ Critical Issues (from PROJECT_ANALYSIS_REPORT.md)
1. **Hardcoded Credentials**: Removed from source but verify no plaintext passwords in localStorage
2. **CSRF**: Backend has `csurf` middleware but ensure all state-changing frontend calls include `X-CSRF-Token`
3. **Missing Auth Validation**: Some routes may not check `authenticateToken` - verify in middleware

### ✅ Recent Fixes
- Removed hardcoded admin credentials (use `src/utils/setupAdmin.js` for development setup)
- CSRF protection added to `/api/esg`, `/api/kpi`, `/api/reports`, `/api/iot` routes
- SSRF protection in API service endpoint validation

---

## Key Files Reference

| Purpose | File(s) |
|---------|---------|
| RBAC System | `src/utils/rbac.js`, `esg-backend/middleware/authMiddleware.js` |
| API Layer | `src/services/apiService.js`, `src/services/moduleAPI.js`, `esg-backend/routes/*.js` |
| Database | `esg-backend/models/index.js` (Sequelize config), `esg-backend/controllers/ESGController.js` |
| Component Protection | `src/components/ProtectedRoute.jsx`, `src/components/PermissionGuard.jsx` |
| Data Models | `esg-backend/models/` (WasteData, AirQualityData, etc.) |
| Testing | `esg-backend/test-*.js` files (use for understanding API contract) |

---

## Common Tasks

### Add a New API Endpoint
1. Create route in `esg-backend/routes/esgRoutes.js` (or framework-specific route)
2. Implement controller method in `esg-backend/controllers/ESGController.js`
3. Add Sequelize model if new data type in `esg-backend/models/`
4. Call via `APIService.request('/endpoint')` in frontend

### Add a New Component
1. Create in `src/components/` or `/src/modules/`
2. If requires auth: wrap with `<ProtectedRoute>` in `App.js`
3. If requires permission: use `<PermissionGuard>` wrapper around UI
4. If heavy/lazy-loaded: add to `src/components/LazyComponents.js`

### Run Backend Tests
```bash
cd esg-backend
npm run test:all          # Comprehensive phase testing
npm run test:security     # Security-specific tests
```

---

## Environment & Dependencies

- **Node.js**: ES modules enabled (`"type": "module"` in package.json)
- **Database**: SQLite (file: `esg-backend/database.sqlite`)
- **Frontend Build**: `react-scripts` (Create React App)
- **IMPORTANT**: If backend not running, frontend fallback shows mock KPI data

---

## Questions Before Implementing Changes?

- Is this change UI (React), API (Express), or data model (Sequelize)?
- Does it require new permissions? Update ROLE_PERMISSIONS in `rbac.js`
- Is it a state-changing operation? Must use CSRF token in request headers
- Does it affect mining compliance? Check mining-specific modules
