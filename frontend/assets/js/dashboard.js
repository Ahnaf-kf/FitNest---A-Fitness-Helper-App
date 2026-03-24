const userId = localStorage.getItem("user_id");

if (!userId) {
  alert("User not signed in. Please log in.");
  window.location.href = '/';
}

// Helper function to check if dates are in same week
function isSameWeek(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  d1 = new Date(d1);
  d2 = new Date(d2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  const diffDays = Math.round(Math.abs((d1 - d2) / oneDay));
  if (diffDays >= 7) return false;
  const sunday1 = new Date(d1);
  sunday1.setDate(d1.getDate() - d1.getDay());
  const sunday2 = new Date(d2);
  sunday2.setDate(d2.getDate() - d2.getDay());
  return sunday1.getTime() === sunday2.getTime();
}

// Function to refresh calorie charts
async function refreshCalorieCharts() {
  try {
    // Fetch data individually to handle missing data gracefully
    let dietData = { calories: { burned: [], consumed: [] } };
    let profileData = { profile: { daily_summary: [] } };
    let cardioData = { cardio: { daily_steps: [] } };

    try {
      const dietResponse = await fetch(`/api/diet/${userId}`);
      if (dietResponse.ok) {
        dietData = await dietResponse.json();
      }
    } catch (err) {
      console.log("Diet data not available:", err);
    }

    try {
      const profileResponse = await fetch(`/api/profile/${userId}`);
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
      }
    } catch (err) {
      console.log("Profile data not available:", err);
    }

    try {
      const cardioResponse = await fetch(`/api/cardio/${userId}`);
      if (cardioResponse.ok) {
        cardioData = await cardioResponse.json();
      }
    } catch (err) {
      console.log("Cardio data not available:", err);
    }

    const currentDate = new Date();
    const burned = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun, 1=Mon, ..., 6=Sat
    const consumed = [0, 0, 0, 0, 0, 0, 0]; // 0=Sun, 1=Mon, ..., 6=Sat

    // Get BMR from profile
    const bmr = profileData.profile?.metrics?.bmr || 2000;

    // Add BMR to all days (baseline calories burned)
    for (let i = 0; i < 7; i++) {
      burned[i] = bmr;
    }

    // Add calories from diet data (burned) - additional activity calories
    if (dietData.calories && dietData.calories.burned) {
      dietData.calories.burned.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (isSameWeek(entryDate, currentDate)) {
          const day = entryDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          // Add additional burned calories beyond BMR
          burned[day] += (entry.amount || 0) - bmr;
        }
      });
    }

    // Add calories from cardio steps (0.04 calories per step)
    if (cardioData.cardio && cardioData.cardio.daily_steps) {
      cardioData.cardio.daily_steps.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (isSameWeek(entryDate, currentDate)) {
          const day = entryDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          const caloriesFromSteps = (entry.steps || 0) * 0.04;
          burned[day] += caloriesFromSteps;
        }
      });
    }

    // Add calories from diet data (consumed)
    if (dietData.calories && dietData.calories.consumed) {
      dietData.calories.consumed.forEach(entry => {
        const entryDate = new Date(entry.date);
        if (isSameWeek(entryDate, currentDate)) {
          const day = entryDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          consumed[day] += entry.amount || 0;
        }
      });
    }

    // Add calories from profile daily_summary (custom meals)
    if (profileData.profile && profileData.profile.daily_summary) {
      console.log("Profile daily_summary:", profileData.profile.daily_summary);
      profileData.profile.daily_summary.forEach(entry => {
        console.log("Processing entry:", entry, "date:", entry.date, "calories_gained:", entry.calories_gained);
        const entryDate = new Date(entry.date);
        const currentDate = new Date();
        console.log("Entry date:", entryDate, "Current date:", currentDate);
        console.log("Is same week:", isSameWeek(entryDate, currentDate));
        if (isSameWeek(entryDate, currentDate)) {
          const day = entryDate.getDay();
          console.log("Adding", entry.calories_gained, "calories to day", day);
          consumed[day] += entry.calories_gained || 0;
        }
      });
    }

    // Reorder to start with Monday (1) and end with Sunday (0)
    const reorderedBurned = [burned[1], burned[2], burned[3], burned[4], burned[5], burned[6], burned[0]];
    const reorderedConsumed = [consumed[1], consumed[2], consumed[3], consumed[4], consumed[5], consumed[6], consumed[0]];

    // Destroy existing charts if they exist
    if (window.burnChart) {
      window.burnChart.destroy();
    }
    if (window.gainChart) {
      window.gainChart.destroy();
    }

    renderCaloriesCharts(reorderedBurned, reorderedConsumed);
  } catch (err) {
    console.error("Failed to refresh calorie charts:", err);
    // Fallback to empty charts
    renderCaloriesCharts([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
  }
}
function processStepData(dailySteps) {
  const currentDate = new Date();
  const result = [0, 0, 0, 0, 0, 0, 0]; // Initialize for each day of week (0=Sun, 1=Mon, ..., 6=Sat)

  dailySteps.forEach(entry => {
    if (isSameWeek(entry.date, currentDate)) {
      const dayOfWeek = new Date(entry.date).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      result[dayOfWeek] += entry.steps;
    }
  });

  // Reorder to start with Monday (1) and end with Sunday (0)
  return [result[1], result[2], result[3], result[4], result[5], result[6], result[0]];
}

//function to calculate total calories burnt
async function getTotalCaloriesBurnt(userId) {
    try {
        const response = await fetch(`/api/diet/${userId}`);
        const data = await response.json();
        if (data.calories && data.calories.burned) {
            return data.calories.burned.reduce((total, entry) => total + (entry.amount || 0), 0);
        }
        return 0;
    } catch (err) {
        console.error("Error fetching calories data:", err);
        return 0;
    }
}

//function to calculate total steps
async function getTotalSteps(userId) {
    try {
        const response = await fetch(`/api/cardio/${userId}`);
        const data = await response.json();
        if (data.cardio && data.cardio.daily_steps) {
            return data.cardio.daily_steps.reduce((total, entry) => total + (entry.steps || 0), 0);
        }
        return 0;
    } catch (err) {
        console.error("Error fetching steps data:", err);
        return 0;
    }
}


//function to get heart points
async function getHeartPoints(userId) {
    try {
        const response = await fetch(`/api/cardio/${userId}`);
        const data = await response.json();
        return data.cardio?.heart_points || 0;
    } catch (err) {
        console.error("Error fetching heart points:", err);
        return 0;
    }
}


// Fetch Profile, Cardio, Diet and Workout Data
fetch(`/api/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    //const profile = data.profile;
    const metrics = data.profile.metrics;
    const goals = data.profile.fitness_goals;
    //const progress = data.profile.progress;

    //document.getElementById('userName').textContent = profile.name || 'User';


    // Display profile information
    document.getElementById('weight').textContent = `Weight: ${metrics.weight}kg`;
    document.getElementById('bmi').textContent = `BMI: ${metrics.bmi}`;
    document.getElementById('bmr').textContent = `BMR: ${metrics.bmr}`;
    document.getElementById('heart_rate').textContent = `Heart Rate: ${metrics.heart_rate || 'N/A'}`;
    document.getElementById('sleep').textContent = `Sleep Hours: ${metrics.sleep_hours || 'N/A'}`;

    document.getElementById('goal').textContent = `Goal: ${goals.goal}`;
    document.getElementById('level').textContent = `Fitness Level: ${goals.fitness_level}`;

    Promise.all([
        getTotalCaloriesBurnt(userId),
        getTotalSteps(userId),
        getHeartPoints(userId)
    ]).then(([caloriesBurnt, totalSteps, heartPoints]) => {
        document.getElementById('totalCaloriesBurnt').textContent = `Calories Burnt: ${Math.round(caloriesBurnt)}`;
        document.getElementById('totalStepsCompleted').textContent = `Steps Completed: ${totalSteps}`;
        document.getElementById('heartPoints').textContent = `Heart Points: ${heartPoints}`;
    });

    // Fetch Cardio Data (Daily Steps)
    fetch(`/api/cardio/${userId}`)
      .then(res => res.json())
      .then(cardioData => {
        if (!cardioData.cardio) {
          return { cardio: { daily_steps: [] } };
        }
        return cardioData;
      })
      .then(cardioData => {
        const processedSteps = processStepData(cardioData.cardio.daily_steps);
        renderStepChart(processedSteps);
      })
      .catch(err => {
        console.error("Failed to load cardio data:", err);
        renderStepChart([0, 0, 0, 0, 0, 0, 0]);
      });
  })
  .catch(err => {
    console.error("Failed to load profile data:", err);
    alert("Could not load profile data. Please try again later.");
  });

// Fetch Diet Data (Burned and Consumed Calories) and Profile Data (for additional consumed calories) - runs independently
refreshCalorieCharts().catch(err => {
  console.error("Failed to load calorie data:", err);
  renderCaloriesCharts([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
});

function renderCaloriesCharts(burnedCalories, consumedCalories) {
  const burned = burnedCalories.length === 7 ? burnedCalories : [0, 0, 0, 0, 0, 0, 0];
  const consumed = consumedCalories.length === 7 ? consumedCalories : [0, 0, 0, 0, 0, 0, 0];

  window.burnChart = new Chart(document.getElementById("burnChart"), {
    type: 'line',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Burnt Calories',
        data: burned,
        borderColor: '#aa66ff',
        fill: false
      }]
    },
    options: { responsive: true }
  });

  window.gainChart = new Chart(document.getElementById("gainChart"), {
    type: 'line',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Consumed Calories',
        data: consumed,
        borderColor: '#2196f3',
        fill: false
      }]
    },
    options: { responsive: true }
  });
}

function renderStepChart(steps) {
  const chartData = steps.length === 7 ? steps : [0, 0, 0, 0, 0, 0, 0];

  new Chart(document.getElementById("stepChart"), {
    type: 'bar',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Steps',
        data: chartData,
        backgroundColor: '#ffaa00'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Add event listeners to refresh charts when user returns to the page
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // Page became visible again, refresh the calorie charts
    refreshCalorieCharts().catch(err => {
      console.error("Failed to refresh charts on visibility change:", err);
    });
  }
});

window.addEventListener('focus', function() {
  // Page gained focus, refresh the calorie charts
  refreshCalorieCharts().catch(err => {
    console.error("Failed to refresh charts on focus:", err);
  });
});

// Also refresh on page load in case user navigates directly
window.addEventListener('load', function() {
  // Refresh charts immediately when page loads
  refreshCalorieCharts().catch(err => {
    console.error("Failed to refresh charts on load:", err);
  });
});
