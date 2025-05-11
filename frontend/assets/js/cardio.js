function getUserIdFromSession() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        alert('User not signed in. Please log in.');
        window.location.href = '/';
        return null;
    }
    return userId;
}

function isSameDay(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function updateAllDisplays(userId) {
    updateWeeklyProgress(userId);
    updateHeartPointsDisplay(userId);
}

function updateWeeklyProgress(userId) {
    axios.get(`/api/cardio/weekly-progress/${userId}`)
      .then(response => {
        const progress = response.data;
        document.getElementById('weeklyProgressFill').style.width = `${progress.progressPercent}%`;
        document.getElementById('weeklySteps').textContent = progress.currentSteps.toLocaleString();
        document.getElementById('weeklyGoal').textContent = progress.weeklyGoal.toLocaleString();
        document.getElementById('streakCount').textContent = progress.streak;
        
        const claimBtn = document.getElementById('claimRewardBtn');
        claimBtn.disabled = progress.progressPercent < 100;
        
        if (progress.progressPercent >= 100) {
          document.getElementById('weeklyProgressFill').style.backgroundColor = 'var(--success)';
          claimBtn.classList.add('btn-success');
        } else {
          document.getElementById('weeklyProgressFill').style.backgroundColor = 'var(--accent)';
          claimBtn.classList.remove('btn-success');
        }
      })
      .catch(error => {
        console.error('Error fetching weekly progress', error);
      });
}

function updateHeartPointsDisplay(userId) {
    axios.get(`/api/cardio/${userId}`)
      .then(response => {
        document.getElementById('heartPoints').textContent = response.data.cardio.heart_points;
      })
      .catch(error => {
        console.error('Error fetching heart points', error);
      });
}

document.addEventListener('DOMContentLoaded', function() {
    const userId = getUserIdFromSession();
    if (!userId) return;

    let stepsTaken = 0;
    let manualSteps = 0;
    let timerInterval;
    let totalTime = 0;

    // Initialize displays with current data
    axios.get(`/api/cardio/${userId}`)
      .then(response => {
        const cardio = response.data.cardio;
        // Initialize steps display
        if (cardio.daily_steps && cardio.daily_steps.length > 0) {
            const todaySteps = cardio.daily_steps
                .filter(entry => isSameDay(new Date(entry.date), new Date()))
                .reduce((sum, entry) => sum + entry.steps, 0);
            stepsTaken = todaySteps;
            document.getElementById('stepsCount').textContent = stepsTaken + manualSteps;
        }
        // Initialize heart points
        document.getElementById('heartPoints').textContent = cardio.heart_points || 0;
        
        // Then update weekly progress
        updateWeeklyProgress(userId);
      })
      .catch(error => {
        console.error('Error initializing data:', error);
        updateWeeklyProgress(userId);
      });

    // Set Goal Functionality
    document.getElementById('setGoalButton').addEventListener('click', function() {
        const goalMiles = document.getElementById('mileGoal').value;
        if (goalMiles && goalMiles > 0) {
            axios.put(`/api/cardio/set-goals/${userId}`, {
                goal_miles: parseFloat(goalMiles),
                type_of_activity: 'walking'
            })
            .then(() => {
                alert('Goal set successfully!');
                updateAllDisplays(userId); // Update all displays after setting goal
            })
            .catch(error => {
                console.error('Error setting goal:', error);
                alert('Error setting goal. Please try again.');
            });
        } else {
            alert('Please enter a valid mile goal.');
        }
    });

    // Timer functionality
    document.getElementById('startWalkingButton').addEventListener('click', function() {
        this.style.display = 'none';
        document.getElementById('stopWalkingButton').style.display = 'inline-block';
        
        // Reset timer when starting
        totalTime = 0;
        document.getElementById('timerDisplay').textContent = '0m 0s';
        
        timerInterval = setInterval(() => {
            totalTime++;
            // Update timer display
            document.getElementById('timerDisplay').textContent = 
                `${Math.floor(totalTime/60)}m ${totalTime%60}s`;
        }, 1000);
    });

    document.getElementById('stopWalkingButton').addEventListener('click', function() {
        clearInterval(timerInterval);
        this.style.display = 'none';
        document.getElementById('startWalkingButton').style.display = 'inline-block';
        
        // Calculate estimated steps based on time (approx 100 steps per minute)
        const estimatedSteps = Math.floor(totalTime * 100 / 60);
        stepsTaken = estimatedSteps;
        document.getElementById('stepsCount').textContent = stepsTaken + manualSteps;
        
        const totalSteps = stepsTaken + manualSteps;
        if (totalSteps > 0) {
            axios.put(`/api/cardio/track-steps/${userId}`, {
                daily_steps: totalSteps
            })
            .then(() => {
                console.log('Steps saved');
                updateAllDisplays(userId); // Update all displays after saving steps
            })
            .catch(error => {
                console.error('Error saving steps:', error);
            });

            // Track time for heart points (convert seconds to minutes)
            if (totalTime > 0) {
                axios.put(`/api/cardio/track-timer/${userId}`, {
                    cardio_timer: Math.floor(totalTime / 60)
                })
                .then(() => {
                    updateAllDisplays(userId); // Update all displays after saving time
                })
                .catch(error => {
                    console.error('Error updating timer:', error);
                });
            }
        }
    });
    
    // Manual steps
    document.getElementById('addManualStepsButton').addEventListener('click', function() {
        const manualStepsInput = prompt("Enter the steps you walked today:");
        const steps = parseInt(manualStepsInput);
        if (!isNaN(steps) && steps > 0) {
            manualSteps += steps;
            document.getElementById('stepsCount').textContent = stepsTaken + manualSteps;
            alert(`Added ${steps} manual steps. Don't forget to save!`);
        } else {
            alert('Please enter a valid number of steps.');
        }
    });

    // Save button
    document.getElementById('saveButton').addEventListener('click', function() {
        const totalSteps = stepsTaken + manualSteps;
        if (totalSteps > 0) {
            axios.put(`/api/cardio/track-steps/${userId}`, {
                daily_steps: totalSteps
            })
            .then(() => {
                alert('Progress saved successfully!');
                updateAllDisplays(userId); // Update all displays after saving
            })
            .catch(error => {
                console.error('Error saving progress:', error);
                alert('Error saving progress. Please try again.');
            });
        } else {
            alert('No steps to save. Start activity or add manual steps first.');
        }
    });

    // Reset button
    document.getElementById('resetButton').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset today\'s data?')) {
            stepsTaken = 0;
            manualSteps = 0;
            totalTime = 0;
            document.getElementById('stepsCount').textContent = '0';
            document.getElementById('timerDisplay').textContent = '0m 0s';
            alert('Today\'s data has been reset locally. Remember to save if you want to update the server.');
        }
    });

    // Claim reward
    document.getElementById('claimRewardBtn').addEventListener('click', function() {
        axios.post(`/api/cardio/claim-reward/${userId}`)
          .then(response => {
            alert(`Reward claimed! Current streak: ${response.data.streak} weeks`);
            updateAllDisplays(userId); // Update all displays after claiming reward
          })
          .catch(error => {
            if (error.response && error.response.status === 400) {
              alert(error.response.data.message);
            } else {
              console.error('Error claiming reward:', error);
              alert('Error claiming reward. Please try again.');
            }
          });
    });
});