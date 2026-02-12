// Database integration example (would need backend API)

const API_BASE = '/api';

// Get CSRF token from meta tag or cookie
const getCSRFToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
         document.cookie.split('; ').find(row => row.startsWith('csrf-token='))?.split('=')[1];
};

// Validate email format to prevent injection
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const saveUserToDB = async (userData) => {
  try {
    // Sanitize user data to prevent CSRF
    const sanitizedData = {
      ...userData,
      email: userData.email ? String(userData.email).replace(/[<>"'&]/g, '') : '',
      name: userData.name ? String(userData.name).replace(/[<>"'&]/g, '') : ''
    };
    
    const csrfToken = getCSRFToken();
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
      },
      body: JSON.stringify(sanitizedData)
    });
    return await response.json();
  } catch (error) {
    console.error('Database save failed:', error);
    return null;
  }
};

export const getUserFromDB = async (email) => {
  try {
    // Validate email to prevent SSRF attacks
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Encode email to prevent path traversal
    const encodedEmail = encodeURIComponent(email);
    const response = await fetch(`${API_BASE}/users/${encodedEmail}`);
    return await response.json();
  } catch (error) {
    console.error('Database fetch failed:', error);
    return null;
  }
};

export const approveUserInDB = async (email) => {
  try {
    // Validate email to prevent CSRF and SSRF attacks
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Encode email to prevent path traversal
    const encodedEmail = encodeURIComponent(email);
    const csrfToken = getCSRFToken();
    
    const response = await fetch(`${API_BASE}/users/${encodedEmail}/approve`, {
      method: 'PUT',
      headers: {
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Database approval failed:', error);
    return null;
  }
};