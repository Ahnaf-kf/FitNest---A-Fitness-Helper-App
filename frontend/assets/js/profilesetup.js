function calculateMetrics(weight, height, activityLevel) {
  const heightInMeters = height / 100;  // Convert height from cm to meters
  const bmi = Math.round(weight / (heightInMeters * heightInMeters));
  const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5;  // Example for male (replace with gender-based formula if needed)
  let maintenanceCalories = bmr * activityLevel;  // Use activity level for BMR multiplier

  return { bmi, bmr, maintenanceCalories };
}


// Autofill user_id from localStorage when page loads
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      document.getElementById("user_id").value = userId;
    } else {
      alert("User ID not found! Please sign up again.");
      window.location.href = "../../pages/signup"; // Redirect if no user_id
    }
  });
  
  // Handle Profile Form Submit
  document.getElementById('profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const { bmi, bmr, maintenanceCalories } = calculateMetrics(document.getElementById('weight').value, document.getElementById('height').value, 10);
  
    const data = {
      user_id: document.getElementById('user_id').value,
      metrics: {
        height: +document.getElementById('height').value,
        weight: +document.getElementById('weight').value,
        bmi: +bmi.toFixed(2),
        bmr: +bmr.toFixed(2),
        maintenance_calories: +document.getElementById('maintenance_calories').value,
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
      const response = await fetch('http://localhost:5000/api/profile', {   // Make sure your API endpoint matches
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert(result.message || 'Profile created successfully!');
        localStorage.removeItem("user_id"); // Clear stored ID after successful profile setup
        // Redirect after successful setup (optional)
        window.location.href = '/dashboard';
      } else {
        alert(result.message || 'Failed to create profile.');
      }
    } catch (error) {
      alert('Error submitting profile: ' + error.message);
    }
  });
  