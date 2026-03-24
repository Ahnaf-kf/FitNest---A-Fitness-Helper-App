// Session authentication utility
async function checkSession() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');

  // If no token or user_id in localStorage, session is invalid
  if (!token || !userId) {
    return { isValid: false, user: null };
  }

  try {
    // Verify token with backend with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/auth/verify?token=' + encodeURIComponent(token), {
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      return { isValid: true, user: data.user };
    } else {
      // Token expired or invalid
      clearSession();
      return { isValid: false, user: null };
    }
  } catch (error) {
    console.error('Session check error:', error);
    // If network error, assume session is valid (offline support)
    // But still keep the token for now
    return { isValid: true, user: { _id: localStorage.getItem('user_id') } };
  }
}

// Quick check - only verify localStorage without backend call
function hasValidSessionLocal() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  // Both must exist and be non-empty strings
  return !!(token && userId && token.trim() && userId.trim());
}

// Clear session data
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
}

// Redirect to sign-in if not authenticated
async function requireAuth() {
  // Quick local check first
  if (!hasValidSessionLocal()) {
    window.location.href = '/';
    return;
  }
  
  // Then verify with backend
  const session = await checkSession();
  if (!session.isValid) {
    window.location.href = '/';
  }
}

// Redirect to dashboard if already authenticated (quick check only - NO async calls!)
function redirectIfAuth() {
  if (hasValidSessionLocal()) {
    window.location.href = '/pages/dashboard.html';
  }
}
