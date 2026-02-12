// Global error handler for connection issues
window.addEventListener('error', (event) => {
  // Sanitize event message to prevent CSRF attacks
  const sanitizedMessage = event.message ? String(event.message).replace(/[<>"'&]/g, '') : '';
  if (sanitizedMessage.includes('Could not establish connection')) {
    console.warn('Extension connection error suppressed:', sanitizedMessage);
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Sanitize reason message to prevent CSRF attacks
  const sanitizedReason = event.reason?.message ? String(event.reason.message).replace(/[<>"'&]/g, '') : '';
  if (sanitizedReason.includes('Could not establish connection')) {
    console.warn('Extension promise rejection suppressed:', sanitizedReason);
    event.preventDefault();
  }
});