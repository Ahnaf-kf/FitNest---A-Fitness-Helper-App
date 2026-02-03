document.getElementById("signin-form").addEventListener("submit", async function(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch('http://localhost:5000/api/auth/signin', {
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
      localStorage.setItem("user_id", data.user._id); // Store userId for dashboard data
      console.log(data.user._id); // Log userId for debugging
      // Redirect to dashboard after successful login
      window.location.href = "/dashboard";
    } else {
      alert(data.message); // Show error message if login fails
    }
  } catch (error) {
    alert('Error occurred while signing in!');
  }
});
