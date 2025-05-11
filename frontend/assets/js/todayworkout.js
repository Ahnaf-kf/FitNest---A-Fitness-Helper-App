document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("user_id");  // Get user ID from sign-in

    if (!userId) {
        alert("User not signed in. Please log in.");
        window.location.href = '/';
        return;
    }

    // Fetch today's workout plan
    fetch(`/api/workouts/${userId}`)
        .then(res => res.json())
        .then(data => {
            const workout = data.workout.workout_plan;
            const today = new Date().getDay();  // Get current day (0 = Sunday, 6 = Saturday)
            const todayWorkout = workout[today];  // Get today's workout routine

            if (todayWorkout) {
                displayWorkout(todayWorkout);
            } else {
                document.getElementById("workoutTitle").textContent = "No workout planned for today.";
            }
        })
        .catch(error => {
            console.error("Error fetching today's workout:", error);
            alert("Could not fetch today's workout. Please try again later.");
        });

    // Function to display today's workout
    function displayWorkout(workout) {
        const workoutDetails = document.getElementById('workoutPlan');
        workoutDetails.innerHTML = `<h4>${workout.day} - ${workout.workout_type.toUpperCase()}</h4>`;

        workout.exercises.forEach(exercise => {
            const exerciseDiv = document.createElement('p');
            exerciseDiv.innerHTML = `${exercise.name} - ${exercise.sets} sets of ${exercise.reps} reps`;
            workoutDetails.appendChild(exerciseDiv);
        });

        // Check if workout has already been completed today
        if (workout.completed) {
            document.getElementById("completeWorkoutButton").textContent = "Workout Completed";
            document.getElementById("completeWorkoutButton").disabled = true;
        } else {
            document.getElementById("completeWorkoutButton").addEventListener("click", function() {
                markWorkoutAsCompleted(workout);
            });
        }
    }

    // Function to mark today's workout as completed
    function markWorkoutAsCompleted(workout) {
        fetch(`/api/profile/track-progress/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                workouts_completed: 1
            })
        })
        .then(res => res.json())
        .then(data => {
            alert('Workout marked as completed!');
            document.getElementById("completeWorkoutButton").textContent = "Workout Completed";
            document.getElementById("completeWorkoutButton").disabled = true;

            // Update the profile progress in local storage or backend
            workout.completed = true;
        })
        .catch(error => {
            console.error("Error marking workout as completed:", error);
            alert("Could not mark workout as completed. Please try again later.");
        });
    }
});
