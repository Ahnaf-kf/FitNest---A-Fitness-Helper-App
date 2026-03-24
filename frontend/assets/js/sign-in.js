document.getElementById("signin-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const submitButton = event.target.querySelector('button[type="submit"]');
  
  // Disable button to prevent multiple clicks
  submitButton.disabled = true;
  submitButton.textContent = 'Logging in...';

  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (response.ok) {
      // Store token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user._id);
      console.log(data.user._id);
      
      // Redirect based on profile completeness
      showNotification('Login successful!');
      if (data.profileIncomplete) {
        window.location.href = "/pages/profilesetup.html";
      } else {
        window.location.href = "/pages/dashboard.html";
      }
    } else {
      showNotification(data.message, 'error');
      // Re-enable button on error
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  } catch (error) {
    console.error('Signin fetch error:', error);
    showNotification('Error occurred while signing in: ' + (error.message || error), 'error');
    // Re-enable button on error
    submitButton.disabled = false;
    submitButton.textContent = 'Sign In';
  }
});

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}
