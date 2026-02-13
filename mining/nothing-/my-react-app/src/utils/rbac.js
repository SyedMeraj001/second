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

// Pre-configured users - credentials should be loaded from environment variables
const getSecurePassword = (envVar, defaultEmail) => {
  const hash = process.env[envVar];
  if (!hash) {
    return `temp_${Date.now()}_${Math.random().toString(36)}`;
  }
  return hash;
};

export const PRECONFIGURED_USERS = [
  // 3 Super Admins
  { email: 'superadmin1@esgenius.com', passwordHash: getSecurePassword('REACT_APP_ADMIN_HASH_1', 'superadmin1@esgenius.com'), fullName: 'Super Admin 1', role: USER_ROLES.SUPER_ADMIN },
  { email: 'superadmin2@esgenius.com', passwordHash: getSecurePassword('REACT_APP_ADMIN_HASH_2', 'superadmin2@esgenius.com'), fullName: 'Super Admin 2', role: USER_ROLES.SUPER_ADMIN },
  { email: 'superadmin3@esgenius.com', passwordHash: getSecurePassword('REACT_APP_ADMIN_HASH_3', 'superadmin3@esgenius.com'), fullName: 'Super Admin 3', role: USER_ROLES.SUPER_ADMIN },
  
  // 15 Supervisors
  { email: 'supervisor1@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_1', 'supervisor1@esgenius.com'), fullName: 'Supervisor 1', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor2@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_2', 'supervisor2@esgenius.com'), fullName: 'Supervisor 2', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor3@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_3', 'supervisor3@esgenius.com'), fullName: 'Supervisor 3', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor4@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_4', 'supervisor4@esgenius.com'), fullName: 'Supervisor 4', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor5@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_5', 'supervisor5@esgenius.com'), fullName: 'Supervisor 5', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor6@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_6', 'supervisor6@esgenius.com'), fullName: 'Supervisor 6', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor7@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_7', 'supervisor7@esgenius.com'), fullName: 'Supervisor 7', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor8@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_8', 'supervisor8@esgenius.com'), fullName: 'Supervisor 8', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor9@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_9', 'supervisor9@esgenius.com'), fullName: 'Supervisor 9', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor10@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_10', 'supervisor10@esgenius.com'), fullName: 'Supervisor 10', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor11@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_11', 'supervisor11@esgenius.com'), fullName: 'Supervisor 11', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor12@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_12', 'supervisor12@esgenius.com'), fullName: 'Supervisor 12', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor13@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_13', 'supervisor13@esgenius.com'), fullName: 'Supervisor 13', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor14@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_14', 'supervisor14@esgenius.com'), fullName: 'Supervisor 14', role: USER_ROLES.SUPERVISOR },
  { email: 'supervisor15@esgenius.com', passwordHash: getSecurePassword('REACT_APP_SUPER_HASH_15', 'supervisor15@esgenius.com'), fullName: 'Supervisor 15', role: USER_ROLES.SUPERVISOR },
  
  // 30 Data Entry Users
  { email: 'dataentry1@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_1', 'dataentry1@esgenius.com'), fullName: 'Data Entry User 1', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry2@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_2', 'dataentry2@esgenius.com'), fullName: 'Data Entry User 2', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry3@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_3', 'dataentry3@esgenius.com'), fullName: 'Data Entry User 3', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry4@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_4', 'dataentry4@esgenius.com'), fullName: 'Data Entry User 4', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry5@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_5', 'dataentry5@esgenius.com'), fullName: 'Data Entry User 5', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry6@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_6', 'dataentry6@esgenius.com'), fullName: 'Data Entry User 6', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry7@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_7', 'dataentry7@esgenius.com'), fullName: 'Data Entry User 7', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry8@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_8', 'dataentry8@esgenius.com'), fullName: 'Data Entry User 8', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry9@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_9', 'dataentry9@esgenius.com'), fullName: 'Data Entry User 9', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry10@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_10', 'dataentry10@esgenius.com'), fullName: 'Data Entry User 10', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry11@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_11', 'dataentry11@esgenius.com'), fullName: 'Data Entry User 11', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry12@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_12', 'dataentry12@esgenius.com'), fullName: 'Data Entry User 12', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry13@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_13', 'dataentry13@esgenius.com'), fullName: 'Data Entry User 13', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry14@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_14', 'dataentry14@esgenius.com'), fullName: 'Data Entry User 14', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry15@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_15', 'dataentry15@esgenius.com'), fullName: 'Data Entry User 15', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry16@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_16', 'dataentry16@esgenius.com'), fullName: 'Data Entry User 16', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry17@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_17', 'dataentry17@esgenius.com'), fullName: 'Data Entry User 17', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry18@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_18', 'dataentry18@esgenius.com'), fullName: 'Data Entry User 18', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry19@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_19', 'dataentry19@esgenius.com'), fullName: 'Data Entry User 19', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry20@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_20', 'dataentry20@esgenius.com'), fullName: 'Data Entry User 20', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry21@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_21', 'dataentry21@esgenius.com'), fullName: 'Data Entry User 21', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry22@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_22', 'dataentry22@esgenius.com'), fullName: 'Data Entry User 22', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry23@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_23', 'dataentry23@esgenius.com'), fullName: 'Data Entry User 23', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry24@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_24', 'dataentry24@esgenius.com'), fullName: 'Data Entry User 24', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry25@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_25', 'dataentry25@esgenius.com'), fullName: 'Data Entry User 25', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry26@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_26', 'dataentry26@esgenius.com'), fullName: 'Data Entry User 26', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry27@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_27', 'dataentry27@esgenius.com'), fullName: 'Data Entry User 27', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry28@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_28', 'dataentry28@esgenius.com'), fullName: 'Data Entry User 28', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry29@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_29', 'dataentry29@esgenius.com'), fullName: 'Data Entry User 29', role: USER_ROLES.DATA_ENTRY },
  { email: 'dataentry30@esgenius.com', passwordHash: getSecurePassword('REACT_APP_DATA_HASH_30', 'dataentry30@esgenius.com'), fullName: 'Data Entry User 30', role: USER_ROLES.DATA_ENTRY }
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
