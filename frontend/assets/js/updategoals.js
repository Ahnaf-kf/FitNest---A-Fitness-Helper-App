document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('update-goals-form');
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("User not signed in. Please log in.");
    window.location.href = '/';  // Redirect to sign-in page
    return;
  }

  // Pre-fill the form with current data
  fetch(`/api/profile/${userId}`)
    .then(res => res.json())
    .then(data => {
      const { weight, bmi, workoutGoal, height, bmr, maintenance_calories, heart_rate, sleep_hours } = data.profile.metrics;
      document.getElementById('weight').value = weight || '';
      document.getElementById('bmi').value = bmi || '';
      document.getElementById('height').value = height || '';
      document.getElementById('bmr').value = bmr || '';
      document.getElementById('maintenance-calories').value = maintenance_calories || '';
      document.getElementById('heart-rate').value = heart_rate || '';
      document.getElementById('sleep-hours').value = sleep_hours || '';
      setWorkoutGoal(workoutGoal || 'maintain fitness');  // Pre-set workout goal to lowercase
    })
    .catch(err => {
      console.error("Error fetching profile:", err);
    });

  // Handle button click for workout goal
  const workoutGoalBtns = document.querySelectorAll('.workout-goal-btn');
  workoutGoalBtns.forEach(button => {
    button.addEventListener('click', () => {
      setWorkoutGoal(button.dataset.goal);
    });
  });

  // Function to set workout goal in the form
  function setWorkoutGoal(goal) {
    // Ensure the goal value is in lowercase
    goal = goal.toLowerCase();

    document.querySelectorAll('.workout-goal-btn').forEach(button => {
      button.classList.remove('active');  // Remove active class from all buttons
    });
    const activeButton = Array.from(workoutGoalBtns).find(button => button.dataset.goal === goal);
    if (activeButton) {
      activeButton.classList.add('active');  // Add active class to selected button
    }
    document.getElementById('workout-goal').value = goal;  // Update hidden field with lowercase goal value
  }

  // Calculate BMI, BMR, and Maintenance Calories
  function calculateMetrics(weight, height, activityLevel) {
    const heightInMeters = height / 100;  // Convert height from cm to meters
    const bmi = weight / (heightInMeters * heightInMeters);
    const bmr = 10 * weight + 6.25 * height - 5 * 25 + 5;  // Example for male (replace with gender-based formula if needed)
    let maintenanceCalories = bmr * activityLevel;  // Use activity level for BMR multiplier

    return { bmi, bmr, maintenanceCalories };
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);  
    const workoutGoal = document.getElementById('workout-goal').value;
    const heartRate = parseFloat(document.getElementById('heart-rate').value);
    const sleepHours = parseFloat(document.getElementById('sleep-hours').value);
    const activityLevel = parseFloat(document.getElementById('activity-level').value);  // User input for activity level

    const { bmi, bmr, maintenanceCalories } = calculateMetrics(weight, height, activityLevel);

    const updatedGoals = {
      weight,
      bmi,
      bmr,
      workoutGoal: document.querySelector('.workout-goal-btn.active')?.dataset.goal || 'maintain fitness',
      maintenanceCalories,
      heart_rate: heartRate,
      sleep_hours: sleepHours
    };
    console.log("Submitting updated goals:", updatedGoals);  // Debugging the submission data

    try {
      const res = await fetch(`/api/profile/update-goals/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGoals)
      });

      const data = await res.json();
      console.log("API response:", data);  // Debugging API response

      if (data.success) {
        // Display success message directly on the page
        const successMessageElement = document.createElement('div');
        successMessageElement.classList.add('success-message');
        successMessageElement.textContent = data.message;  // Show success message from backend
        document.body.appendChild(successMessageElement);  // Append the message to the body (or any other element)
        
        // Optionally, hide the message after a few seconds
        setTimeout(() => {
          successMessageElement.style.display = 'none';
        }, 5000);

        window.location.href = '/dashboard'; // Redirect back to dashboard
      } else {
        alert('Failed to update goals. Please try again later.');
      }
    } catch (err) {
      console.error("Error updating goals:", err);
      alert("An error occurred while updating your goals.");
    }
  });
});
