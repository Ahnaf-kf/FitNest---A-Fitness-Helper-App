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

// Function to process step data for chart
function processStepData(dailySteps) {
  const currentDate = new Date();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [0, 0, 0, 0, 0, 0, 0]; // Initialize for each day of week

  dailySteps.forEach(entry => {
    if (isSameWeek(entry.date, currentDate)) {
      const dayOfWeek = new Date(entry.date).getDay();
      result[dayOfWeek] += entry.steps;
    }
  });

  // Reorder to start with Monday
  return [...result.slice(1), result[0]];
}

// Fetch Profile, Cardio, Diet and Workout Data
fetch(`/api/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    const metrics = data.profile.metrics;
    const goals = data.profile.fitness_goals;
    const progress = data.profile.progress;

    // Display profile information
    document.getElementById('weight').textContent = `Weight: ${metrics.weight}kg`;
    document.getElementById('bmi').textContent = `BMI: ${metrics.bmi}`;
    document.getElementById('bmr').textContent = `BMR: ${metrics.bmr}`;
    document.getElementById('heart_rate').textContent = `Heart Rate: ${metrics.heart_rate || 'N/A'}`;
    document.getElementById('sleep').textContent = `Sleep Hours: ${metrics.sleep_hours || 'N/A'}`;

    document.getElementById('goal').textContent = `Goal: ${goals.goal}`;
    document.getElementById('level').textContent = `Fitness Level: ${goals.fitness_level}`;

    document.getElementById('workouts').textContent = `Workouts: ${progress.workouts_completed}`;
    document.getElementById('cardio').textContent = `Cardio: ${progress.cardio_goals_completed}`;
    document.getElementById('calories').textContent = `Calories Burned: ${progress.calories_burned}`;

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

    // Fetch Diet Data (Burned and Consumed Calories)
    fetch(`/api/diet/${userId}`)
      .then(res => res.json())
      .then(dietData => {
        const currentDate = new Date();
        const burned = [0, 0, 0, 0, 0, 0, 0];
        const consumed = [0, 0, 0, 0, 0, 0, 0];

        if (dietData.calories) {
          dietData.calories.burned.forEach(entry => {
            if (isSameWeek(entry.date, currentDate)) {
              const day = new Date(entry.date).getDay();
              burned[day] += entry.amount;
            }
          });

          dietData.calories.consumed.forEach(entry => {
            if (isSameWeek(entry.date, currentDate)) {
              const day = new Date(entry.date).getDay();
              consumed[day] += entry.amount;
            }
          });
        }

        const reorderedBurned = [...burned.slice(1), burned[0]];
        const reorderedConsumed = [...consumed.slice(1), consumed[0]];

        renderCaloriesCharts(reorderedBurned, reorderedConsumed);
      })
      .catch(err => {
        console.error("Failed to load diet data:", err);
        renderCaloriesCharts([0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]);
      });
  })
  .catch(err => {
    console.error("Failed to load profile data:", err);
    alert("Could not load profile data. Please try again later.");
  });

function renderCaloriesCharts(burnedCalories, consumedCalories) {
  const burned = burnedCalories.length === 7 ? burnedCalories : [0, 0, 0, 0, 0, 0, 0];
  const consumed = consumedCalories.length === 7 ? consumedCalories : [0, 0, 0, 0, 0, 0, 0];

  new Chart(document.getElementById("burnChart"), {
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

  new Chart(document.getElementById("gainChart"), {
    type: 'line',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Gained Calories',
        data: consumed,
        borderColor: '#66ccff',
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

// Fetch and update the Today's Workout button status
fetch(`/api/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    const dailySummary = data.profile.daily_summary;
    const today = new Date().toISOString().split('T')[0];
    const todaySummary = dailySummary.find(summary => summary.date === today);

    const todaysWorkoutLink = document.getElementById("todaysWorkoutLink");
    if (todaySummary && todaySummary.workout_completed) {
      todaysWorkoutLink.textContent = "Today's Workout - Completed";
      todaysWorkoutLink.style.color = "green";
    }
  })
  .catch(err => {
    console.error("Error fetching profile data:", err);
  });
