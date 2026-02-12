# Authentication Setup Guide

## Security Fix: Removed Hardcoded Credentials

The hardcoded admin credentials (`admin@esg.com` / `admin123`) have been removed for security compliance (CWE-798, CWE-259).

## Initial Admin Setup

### Option 1: Browser Console Setup (Development)

1. Open your application in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Copy and paste the content from `src/utils/setupAdmin.js`
5. Run: `setupAdmin()`
6. Enter your desired admin email and password when prompted

### Option 2: Manual Setup (Development)

1. Open Developer Tools (F12)
2. Go to Application → Local Storage
3. Find or create the `approvedUsers` key
4. Add the following JSON (replace with your credentials):

```json
[
  {
    "id": 1,
    "fullName": "System Administrator",
    "email": "your-admin@example.com",
    "password": "your-secure-password",
    "status": "approved",
    "role": "admin"
  }
]
```

### Option 3: Production Setup

For production environments:

1. Implement a secure backend authentication API
2. Use environment variables for initial admin credentials
3. Hash passwords using bcrypt or similar
4. Implement JWT or session-based authentication
5. Never store plain-text passwords

## User Registration Flow

1. Users register through the signup form
2. New accounts are stored in `pendingUsers` with status "pending"
3. Admin approves users (moves them to `approvedUsers` with status "approved")
4. Approved users can then log in

## Security Recommendations

- ✅ No hardcoded credentials in source code
- ✅ Passwords should be hashed (implement in production)
- ✅ Use HTTPS in production
- ✅ Implement rate limiting for login attempts
- ✅ Add password strength requirements
- ✅ Implement password reset functionality
- ✅ Use secure session management

## Migration from Old System

If you were using the old hardcoded credentials:

1. Run the admin setup process above
2. Create a new admin account with secure credentials
3. Update any documentation or scripts that referenced the old credentials
4. Inform team members of the new authentication process
