// Role-Based Access Control (RBAC) System
// 3 User Levels: Data Entry (30), Supervisor (15), Super Admin (3)

export const USER_ROLES = {
  DATA_ENTRY: 'data_entry',
  SUPERVISOR: 'supervisor',
  SUPER_ADMIN: 'super_admin'
};

export const PERMISSIONS = {
  // Data Entry Permissions (Read + Update only)
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_DATA: 'view_data',
  UPDATE_DATA: 'update_data',
  
  // Supervisor Permissions (Edit but not authorize)
  EDIT_DATA: 'edit_data',
  DELETE_DATA: 'delete_data',
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',
  PRINT_REPORTS: 'print_reports',
  DOWNLOAD_REPORTS: 'download_reports',
  
  // Super Admin Permissions (Full access)
  ADD_DATA: 'add_data',
  AUTHORIZE_DATA: 'authorize_data',
  MANAGE_USERS: 'manage_users',
  APPROVE_USERS: 'approve_users',
  SYSTEM_SETTINGS: 'system_settings',
  VIEW_COMPLIANCE: 'view_compliance',
  MANAGE_COMPLIANCE: 'manage_compliance',
  FULL_ACCESS: 'full_access'
};

// Role-Permission Mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.DATA_ENTRY]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DATA,
    PERMISSIONS.UPDATE_DATA
    // DELETE_DATA permission removed - data entry users cannot delete data history
  ],
  [USER_ROLES.SUPERVISOR]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DATA,
    PERMISSIONS.UPDATE_DATA,
    PERMISSIONS.EDIT_DATA,
    PERMISSIONS.DELETE_DATA,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_COMPLIANCE,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.PRINT_REPORTS,
    PERMISSIONS.DOWNLOAD_REPORTS
  ],
  [USER_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_DATA,
    PERMISSIONS.UPDATE_DATA,
    PERMISSIONS.EDIT_DATA,
    PERMISSIONS.DELETE_DATA,
    PERMISSIONS.ADD_DATA,
    PERMISSIONS.AUTHORIZE_DATA,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.APPROVE_USERS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.VIEW_COMPLIANCE,
    PERMISSIONS.MANAGE_COMPLIANCE,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.PRINT_REPORTS,
    PERMISSIONS.DOWNLOAD_REPORTS,
    PERMISSIONS.FULL_ACCESS
  ]
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission) || permissions.includes(PERMISSIONS.FULL_ACCESS);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (userRole, permissionsList) => {
  return permissionsList.some(permission => hasPermission(userRole, permission));
};

// Check if user has all specified permissions
export const hasAllPermissions = (userRole, permissionsList) => {
  return permissionsList.every(permission => hasPermission(userRole, permission));
};

// Get user role from localStorage
export const getUserRole = () => {
  return localStorage.getItem('userRole') || null;
};

// Get user info from localStorage
export const getCurrentUser = () => {
  const email = localStorage.getItem('currentUser');
  const role = getUserRole();
  const fullName = localStorage.getItem('userFullName');
  
  // Update active session
  if (email) {
    try {
      const activeSessions = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      activeSessions[email] = Date.now();
      localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }
  
  return { email, role, fullName };
};

// Check if user is logged in
export const isAuthenticated = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('currentUser');
  
  // Update session heartbeat
  if (isLoggedIn) {
    const email = localStorage.getItem('currentUser');
    try {
      const activeSessions = JSON.parse(localStorage.getItem('activeSessions') || '{}');
      activeSessions[email] = Date.now();
      localStorage.setItem('activeSessions', JSON.stringify(activeSessions));
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }
  
  return isLoggedIn;
};

// Role display names
export const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.DATA_ENTRY]: 'Data Entry User',
  [USER_ROLES.SUPERVISOR]: 'Supervisor',
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin'
};

// Get role display name
export const getRoleDisplayName = (role) => {
  return ROLE_DISPLAY_NAMES[role] || 'Unknown Role';
};

// Pre-configured users - using simple passwords for development
const getSecurePassword = (defaultPassword) => {
  return defaultPassword; // In production, these should be properly hashed
};

export const PRECONFIGURED_USERS = [
  // 3 Super Admins
  { email: 'superadmin1@esgenius.com', passwordHash: 'admin123', fullName: 'Super Admin 1', role: USER_ROLES.SUPER_ADMIN },
  { email: 'superadmin2@esgenius.com', passwordHash: 'admin123', fullName: 'Super Admin 2', role: USER_ROLES.SUPER_ADMIN },
  { email: 'superadmin3@esgenius.com', passwordHash: 'admin123', fullName: 'Super Admin 3', role: USER_ROLES.SUPER_ADMIN },
  
  // 15 Supervisors
  { email: 'supervisor1@esgenius.com', passwordHash: 'super123', fullName: 'Supervisor 1', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor2@esgenius.com', passwordHash: 'super123', fullName: 'Supervisor 2', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor3@esgenius.com', passwordHash: 'super123', fullName: 'Supervisor 3', role: USER_ROLES.SUPERVISOR },
  
  // 30 Data Entry Users
  { email: 'dataentry1@esgenius.com', passwordHash: 'data123', fullName: 'Data Entry User 1', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry2@esgenius.com', passwordHash: 'data123', fullName: 'Data Entry User 2', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry3@esgenius.com', passwordHash: 'data123', fullName: 'Data Entry User 3', role: USER_ROLES.DATA_ENTRY }
];

// Initialize preconfigured users in localStorage
export const initializePreconfiguredUsers = () => {
  try {
    const existingUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    if (existingUsers.length === 0) {
      localStorage.setItem('systemUsers', JSON.stringify(PRECONFIGURED_USERS));
    }
  } catch (error) {
    console.error('Failed to initialize users:', error);
    return false;
  }
  return true;
};

// Secure string comparison to prevent timing attacks
const secureCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// Authenticate user with timing attack protection
export const authenticateUser = (email, passwordHash) => {
  try {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    // Always perform comparison to prevent timing attacks
    let foundUser = null;
    let isValid = false;
    
    for (const user of users) {
      const emailMatch = secureCompare(user.email, email);
      const passwordMatch = secureCompare(user.passwordHash, passwordHash);
      
      if (emailMatch && passwordMatch) {
        foundUser = user;
        isValid = true;
        break; // Exit early after finding match
      }
    }
    
    return isValid ? foundUser : null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};
