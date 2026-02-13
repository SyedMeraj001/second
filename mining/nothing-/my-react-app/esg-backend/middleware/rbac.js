const ROLES = {
  ADMIN: 'admin',
  VERIFIER: 'verifier', 
  APPROVER: 'approver',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  // Data permissions
  CREATE_DATA: 'create_data',
  READ_DATA: 'read_data',
  UPDATE_DATA: 'update_data',
  DELETE_DATA: 'delete_data',
  
  // Approval permissions
  APPROVE_SITE: 'approve_site',
  APPROVE_BUSINESS_UNIT: 'approve_business_unit',
  APPROVE_GROUP_ESG: 'approve_group_esg',
  APPROVE_EXECUTIVE: 'approve_executive',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_COMPANIES: 'manage_companies',
  VIEW_AUDIT_TRAIL: 'view_audit_trail',
  
  // Verification permissions
  VERIFY_DATA: 'verify_data',
  UPLOAD_EVIDENCE: 'upload_evidence',
  
  // Taxonomy permissions
  ADD_DATA: 'add_data',
  EDIT_DATA: 'edit_data',
  WRITE_DATA: 'write_data'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.VERIFIER]: [
    PERMISSIONS.READ_DATA,
    PERMISSIONS.VERIFY_DATA,
    PERMISSIONS.UPLOAD_EVIDENCE,
    PERMISSIONS.VIEW_AUDIT_TRAIL
  ],
  [ROLES.APPROVER]: [
    PERMISSIONS.READ_DATA,
    PERMISSIONS.APPROVE_SITE,
    PERMISSIONS.APPROVE_BUSINESS_UNIT,
    PERMISSIONS.APPROVE_GROUP_ESG,
    PERMISSIONS.APPROVE_EXECUTIVE
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.READ_DATA
  ]
};

class RBACService {
  static hasPermission(userRole, permission) {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  static canAccessCompany(user, companyId) {
    if (user.role === ROLES.ADMIN) return true;
    
    // Check site access
    const siteAccess = user.site_access ? JSON.parse(user.site_access) : [];
    return siteAccess.includes(companyId) || siteAccess.includes('all');
  }

  static getApprovalLevel(userRole) {
    switch (userRole) {
      case ROLES.ADMIN: return 4; // Executive level
      case ROLES.APPROVER: return 3; // Group ESG level
      case ROLES.VERIFIER: return 2; // Business unit level
      default: return 1; // Site level
    }
  }
}

// Middleware for permission checking
const requirePermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!RBACService.hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware for company access checking
const requireCompanyAccess = (req, res, next) => {
  const user = req.user;
  const companyId = req.params.companyId || req.body.companyId;
  
  if (!RBACService.canAccessCompany(user, companyId)) {
    return res.status(403).json({ error: 'Access denied to this company' });
  }
  
  next();
};

export { ROLES, PERMISSIONS, RBACService, requirePermission, requireCompanyAccess };