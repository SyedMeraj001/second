# Active User Tracking Implementation

## Overview
Real-time user activity tracking in the User Management module shows which users are currently active in the application.

## How It Works

### 1. Session Heartbeat
- Every time a user interacts with the app, their session timestamp is updated
- Updates occur in `isAuthenticated()` and `getCurrentUser()` functions
- Session data stored in `localStorage` under `activeSessions` key

### 2. Activity Detection
- Users are considered "Active" if their last activity was within 60 seconds
- Users are marked "Offline" if no activity for more than 60 seconds
- Status updates every 5 seconds in User Management

### 3. Session Cleanup
- When users logout, their session is removed from `activeSessions`
- Automatic cleanup happens in the logout handler

## Implementation Details

### Files Modified

**1. `src/utils/rbac.js`**
- Added session tracking to `getCurrentUser()`
- Added session tracking to `isAuthenticated()`
- Updates `activeSessions` object with current timestamp

**2. `src/components/UserManagement.jsx`**
- Added `activeUsers` state to track active user emails
- Added `updateActiveUsers()` function to check session timestamps
- Updates every 5 seconds via `setInterval`
- Changed status display from "Active/Inactive" to "Active/Offline"

**3. `src/components/ProfessionalHeader.js`**
- Added session cleanup on logout
- Removes user from `activeSessions` when logging out

## Data Structure

```javascript
// localStorage: activeSessions
{
  "user1@esgenius.com": 1704123456789,  // timestamp
  "user2@esgenius.com": 1704123457890,
  "user3@esgenius.com": 1704123458901
}
```

## Status Indicators

- 🟢 **Active** - User has activity within last 60 seconds (green badge)
- ⚫ **Offline** - No activity for more than 60 seconds (gray badge)

## Benefits

1. **Real-time Monitoring** - Admins can see who's currently using the system
2. **Session Management** - Track active sessions for security
3. **User Activity** - Understand system usage patterns
4. **Automatic Updates** - No manual refresh needed

## Configuration

To adjust the activity timeout, modify the value in `UserManagement.jsx`:

```javascript
// Current: 60 seconds (60000 ms)
if (now - lastActive < 60000) {
  active.add(email);
}
```

To change update frequency:

```javascript
// Current: 5 seconds (5000 ms)
const interval = setInterval(updateActiveUsers, 5000);
```
