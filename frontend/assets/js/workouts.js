document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
        alert('User not signed in. Please log in.');
        window.location.href = '/';
        return;
    }

    // Try to load existing workout plan first
    fetchWorkoutPlan(userId);

    // Set up event listeners
    document.getElementById('generateWorkout').addEventListener('click', function() {
        const fitnessLevel = document.getElementById('fitnessLevel').value;
        generateWorkoutPlan(userId, fitnessLevel);
    });

    // Add week navigation buttons
    document.getElementById('prevWeek').addEventListener('click', () => navigateWeek(userId, -1));
    document.getElementById('nextWeek').addEventListener('click', () => navigateWeek(userId, 1));
});

function fetchWorkoutPlan(userId, week_number) {
    let url = `/api/workouts/${userId}`;
    if (week_number) {
        url += `?week_number=${week_number}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('No workout plan found');
            return response.json();
        })
        .then(data => {
            if (data.workout) {
                displayWorkoutPlan(data.workout);
                // Set the fitness level dropdown to match the current plan
                const fitnessLevel = determineFitnessLevelFromPlan(data.workout);
                if (fitnessLevel) {
                    document.getElementById('fitnessLevel').value = fitnessLevel;
                }
                // Update week display
                document.getElementById('currentWeek').textContent = `Week ${data.workout.week_number}`;
            }
        })
        .catch(error => {
            console.log('No existing workout plan found, will generate new one when requested');
        });
}

function navigateWeek(userId, direction) {
    const currentWeekElement = document.getElementById('currentWeek');
    let currentWeek = parseInt(currentWeekElement.textContent.replace('Week ', '')) || 1;
    const newWeek = currentWeek + direction;
    
    if (newWeek < 1) return; // Don't go below week 1
    
    fetchWorkoutPlan(userId, newWeek);
}

function determineFitnessLevelFromPlan(workout) {
    if (!workout.workout_plan || workout.workout_plan.length === 0) return null;
    
    const firstExerciseWithSets = workout.workout_plan.find(day => 
        day.exercises && day.exercises.length > 0
    )?.exercises[0];
    
    if (!firstExerciseWithSets) return null;
    
    if (firstExerciseWithSets.sets === 3 && firstExerciseWithSets.reps === 10) return 'beginner';
    if (firstExerciseWithSets.sets === 4 && firstExerciseWithSets.reps === 12) return 'intermediate';
    if (firstExerciseWithSets.sets === 5 && firstExerciseWithSets.reps === 15) return 'advanced';
    
    return null;
}

function generateWorkoutPlan(userId, fitnessLevel) {
    fetch(`/api/workouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            fitness_level: fitnessLevel
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message);
            displayWorkoutPlan(data.workout);
            document.getElementById('currentWeek').textContent = `Week ${data.workout.week_number}`;
        } else {
            showNotification(data.message || 'Error generating workout', 'error');
        }
    })
    .catch(error => {
        console.error('Error generating workout:', error);
        showNotification('Could not generate workout plan. Please try again later.', 'error');
    });
}

function displayWorkoutPlan(workout) {
    const workoutDetails = document.getElementById('workoutDetails');
    workoutDetails.innerHTML = ''; // Clear any previous content

    const workoutPlan = workout.workout_plan;
    workoutPlan.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-plan');
        dayDiv.innerHTML = `<h4>${day.day} - ${day.workout_type.toUpperCase()}</h4>`;

        // Add day notes section
        const dayNotesDiv = document.createElement('div');
        dayNotesDiv.classList.add('day-notes');
        dayNotesDiv.innerHTML = `
            <h5>Day Notes</h5>
            <textarea placeholder="Add notes about your workout day..." data-day="${day.day}">${day.day_notes || ''}</textarea>
            <button class="save-day-notes" data-day="${day.day}">Save Notes</button>
        `;
        dayDiv.appendChild(dayNotesDiv);

        // Add exercises
        day.exercises.forEach(exercise => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.classList.add('exercise');
            exerciseDiv.innerHTML = `
                <p><strong>${exercise.name}</strong> - ${exercise.sets} sets of ${exercise.reps} reps</p>
                <textarea class="exercise-notes" 
                          placeholder="Add notes about this exercise..."
                          data-day="${day.day}"
                          data-exercise="${exercise.name}">${exercise.notes || ''}</textarea>
                <label>
                    <input type="checkbox" ${exercise.completed ? 'checked' : ''} 
                           data-day="${day.day}"
                           data-exercise="${exercise.name}">
                    Mark as completed
                </label>
            `;
            dayDiv.appendChild(exerciseDiv);
        });

        workoutDetails.appendChild(dayDiv);
    });

    // Show the save all button
    document.getElementById('saveAllNotes').style.display = 'block';

    // Add event listeners for saving notes
    setupNoteSaving();
}

function setupNoteSaving() {
    document.getElementById('saveAllNotes').addEventListener('click', saveAllNotes);
    document.querySelectorAll('.save-day-notes').forEach(button => {
        button.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            saveDayNotes(day);
        });
    });
}

function saveDayNotes(day) {
    const userId = localStorage.getItem('user_id');
    const textarea = document.querySelector(`.day-notes textarea[data-day="${day}"]`);
    const dayNotes = textarea.value;

    const exerciseNotes = {};
    document.querySelectorAll(`.exercise-notes[data-day="${day}"]`).forEach(textarea => {
        const exerciseName = textarea.getAttribute('data-exercise');
        const completed = document.querySelector(`input[data-day="${day}"][data-exercise="${exerciseName}"]`).checked;
        exerciseNotes[exerciseName] = {
            notes: textarea.value,
            completed: completed
        };
    });

    saveNotesToServer(userId, day, dayNotes, exerciseNotes);
}

function saveAllNotes() {
    const userId = localStorage.getItem('user_id');
    const workoutDays = Array.from(document.querySelectorAll('.day-plan')).map(dayDiv => {
        return dayDiv.querySelector('h4').textContent.split(' - ')[0];
    });

    workoutDays.forEach(day => {
        saveDayNotes(day);
    });
}

function saveNotesToServer(userId, day, dayNotes, exerciseNotes) {
    fetch(`/api/workouts/update-notes/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            day: day,
            day_notes: dayNotes,
            exercise_notes: exerciseNotes,
            mark_completed: false
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Notes saved successfully!');
        } else {
            showNotification('Failed to save notes: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving notes:', error);
        showNotification('Error saving notes. Please try again.', 'error');
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}