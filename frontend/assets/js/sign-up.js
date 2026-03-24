// Handle Sign Up functionality
document.getElementById("signup-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const dateOfBirth = document.getElementById("dob").value;

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName, email, password, dateOfBirth })
    });

    const data = await response.json();
    if (response.ok) {
      // Persist signup details for profile setup and auto-login
      localStorage.setItem("user_id", data.user._id);
      localStorage.setItem("signup_email", email);
      localStorage.setItem("signup_password", password);
      localStorage.setItem("signup_dob", dateOfBirth);

      showNotification('Account created successfully!');
      window.location.href = '/pages/profilesetup.html';
    } else {
      showNotification(data.message || 'Error signing up user', 'error'); // Show error message if signup fails
    }
  } catch (error) {
    console.error('Signup fetch error:', error);
    showNotification('Error occurred while signing up: ' + (error.message || error), 'error');
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
