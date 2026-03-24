function calculateMetrics(weight, height, activityLevel) {
  const heightInMeters = height / 100;
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * 25 + 5); // Example for male
  const maintenanceCalories = Math.round(bmr * activityLevel);

  return { bmi, bmr, maintenanceCalories };
}

// Autofill user_id from localStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem("user_id");
  if (userId) {
    document.getElementById("user_id").value = userId;
  } else {
    alert("User ID not found! Please sign up again.");
    window.location.href = "/pages/sign-up.html";
    return;
  }

  // Prefill birthday from signup, if available
  const signupDob = localStorage.getItem("signup_dob");
  if (signupDob) {
    const birthdayInput = document.getElementById("birthday");
    if (birthdayInput) {
      birthdayInput.value = signupDob;
    }
  }
});

// Handle Profile Form Submit
document.getElementById('profileForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  // Get activity level from the select input
  const activityLevel = parseFloat(document.getElementById('activity-level').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);

  // Calculate metrics using the activity level
  const { bmi, bmr, maintenanceCalories } = calculateMetrics(weight, height, activityLevel);

  const data = {
    user_id: document.getElementById('user_id').value,
    metrics: {
      height: height,
      weight: weight,
      bmi: bmi,
      bmr: bmr,
      maintenance_calories: maintenanceCalories,
      heart_rate: +document.getElementById('heart_rate').value || undefined,
      sleep_hours: +document.getElementById('sleep_hours').value || undefined,
    },
    fitness_goals: {
      goal: document.getElementById('goal').value,
      fitness_level: document.getElementById('fitness_level').value,
    },
    birthday: document.getElementById('birthday').value || null
  };

  try {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || 'Profile created successfully! Logging you in...');

      // Attempt automatic sign-in using the credentials from signup
      const email = localStorage.getItem("signup_email");
      const password = localStorage.getItem("signup_password");

      if (email && password) {
        try {
          const loginResponse = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok) {
            localStorage.setItem("token", loginData.token);
            localStorage.setItem("user_id", loginData.user._id);
          } else {
            alert(loginData.message || 'Auto sign-in failed. Please sign in manually.');
          }
        } catch (loginError) {
          alert('Auto sign-in failed. Please sign in manually.');
        }
      }

      // Clean up temporary signup data
      localStorage.removeItem("signup_email");
      localStorage.removeItem("signup_password");
      localStorage.removeItem("signup_dob");

      window.location.href = '/pages/dashboard.html';
    } else {
      alert(result.message || 'Failed to create profile.');
    }
  } catch (error) {
    console.error('Profile submit error:', error);
    alert('Error submitting profile: ' + (error.message || error));
  }
});