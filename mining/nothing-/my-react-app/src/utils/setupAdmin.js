// Admin Setup Script
// Run this once to create the initial admin account
// Usage: Open browser console and run this script, or create a setup page

const setupAdmin = () => {
  const adminEmail = prompt('Enter admin email:');
  const adminPassword = prompt('Enter admin password:');
  
  if (!adminEmail || !adminPassword) {
    console.error('Email and password are required');
    return;
  }

  const adminUser = {
    id: Date.now(),
    fullName: 'System Administrator',
    email: adminEmail.trim(),
    password: adminPassword, // In production, this should be hashed
    status: 'approved',
    role: 'admin'
  };

  const approvedUsers = JSON.parse(localStorage.getItem('approvedUsers') || '[]');
  
  // Check if admin already exists
  const existingAdmin = approvedUsers.find(user => user.email === adminEmail.trim());
  if (existingAdmin) {
    console.warn('Admin user already exists');
    return;
  }

  approvedUsers.push(adminUser);
  localStorage.setItem('approvedUsers', JSON.stringify(approvedUsers));
  
  console.log('Admin account created successfully!');
  console.log('Email:', adminEmail);
  console.log('Please store your credentials securely.');
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupAdmin };
}

// Instructions
console.log('To setup admin account, run: setupAdmin()');
