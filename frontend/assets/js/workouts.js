document.getElementById('generateWorkout').addEventListener('click', function() {
    const fitnessLevel = document.getElementById('fitnessLevel').value;
    const userId = localStorage.getItem('user_id');

    if (!userId) {
        alert('User not signed in. Please log in.');
        window.location.href = '/';
        return;
    }

    // Fetch workout plan from the API
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
        if (data.message) {
            alert(data.message);
        }

        // Display the generated workout plan
        displayWorkoutPlan(data.workout);
    })
    .catch(error => {
        console.error('Error generating workout:', error);
        alert('Could not generate workout plan. Please try again later.');
    });
});

// Function to display the generated workout plan
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
    // Save all notes button
    document.getElementById('saveAllNotes').addEventListener('click', saveAllNotes);

    // Individual day note save buttons
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

    // Get all exercise notes for this day
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
            mark_completed: false // We'll handle completion separately
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