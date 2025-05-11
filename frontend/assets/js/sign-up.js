// Handle Sign Up functionality
document.getElementById("signup-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const dateOfBirth = document.getElementById("dob").value;

  try {
    const response = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName, email, password, dateOfBirth })
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("user_id", data.user._id); // Store user ID in local storage
      alert('Account created successfully! Redirecting to profile setup...');
      window.location.href = '/profilesetup'; // Redirect to profile setup
    } else {
      alert(data.message); // Show error message if signup fails
    }
  } catch (error) {
    alert('Error occurred while signing up!');
  }
});
