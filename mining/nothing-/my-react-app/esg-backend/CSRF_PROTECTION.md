# CSRF Protection Implementation

## Security Fix: CWE-352, CWE-1275

Cross-Site Request Forgery (CSRF) protection has been implemented to prevent unauthorized state-changing operations.

## Implementation Details

### Backend (server.js)

1. **CSRF Middleware**: Added `csurf` package with cookie-based tokens
2. **Protected Routes**: All state-changing API routes require CSRF tokens
3. **Token Endpoint**: `/api/csrf-token` provides tokens to authenticated clients

### Protected Routes

- `/api/esg` - ESG data operations
- `/api/kpi` - KPI management
- `/api/reports` - Report generation
- `/api/iot` - IoT device management
- `/api/framework-compliance` - Compliance operations

### Excluded Routes

- `/api/auth` - Authentication endpoints (use other protection mechanisms)
- `/health` - Read-only health check endpoint

## Client Implementation

### 1. Fetch CSRF Token

```javascript
const response = await fetch('/api/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await response.json();
```

### 2. Include Token in Requests

```javascript
await fetch('/api/esg/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify(data)
});
```

## Database Initialization Script

The `initDatabase.js` script is NOT a web endpoint and does not require CSRF protection because:

1. It's a command-line script run locally by administrators
2. It's never exposed as a web endpoint
3. It should only be executed via `npm run init:db` or direct node execution
4. CSRF protection applies to HTTP endpoints, not CLI scripts

## Installation

```bash
cd esg-backend
npm install
```

This will install the required dependencies:
- `csurf@^1.11.0` - CSRF protection middleware
- `cookie-parser@^1.4.6` - Cookie parsing for CSRF tokens

## Testing

1. Start the server:
```bash
npm start
```

2. Test CSRF protection:
```bash
# This should fail without CSRF token
curl -X POST http://localhost:5000/api/esg/data \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# This should succeed with CSRF token
# (First get token, then include in request)
```

## Security Notes

- CSRF tokens are stored in cookies with `httpOnly` flag
- Tokens are validated on every state-changing request
- SameSite cookie attribute provides additional protection
- Rate limiting is applied to prevent token harvesting
- Helmet middleware adds additional security headers

## Production Considerations

1. Ensure cookies are sent over HTTPS only (`secure: true`)
2. Configure proper CORS origins
3. Implement session management
4. Monitor for CSRF attack attempts
5. Regularly update dependencies
