document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
        alert("User not signed in. Please log in.");
        window.location.href = '/';
        return;
    }

    // Fetch Meal Plan Data for the current day
    fetch(`/api/diet/${userId}`)
        .then(res => res.json())
        .then(data => {
            console.log(data);  // Log the response to the console

            const mealPlan = data.diet.meal_plans;

            if (!mealPlan) {
                alert("Meal plan data is missing.");
                return;
            }

            const today = new Date().getDay();  // Get the day of the week (0 for Sunday, 1 for Monday, etc.)

            // Check if mealPlan for today exists
            if (mealPlan.breakfast && mealPlan.lunch && mealPlan.dinner) {
                document.getElementById('breakfast').textContent = mealPlan.breakfast[today]?.meal + " - " + mealPlan.breakfast[today]?.calories + " kcal";
                document.getElementById('lunch').textContent = mealPlan.lunch[today]?.meal + " - " + mealPlan.lunch[today]?.calories + " kcal";
                document.getElementById('dinner').textContent = mealPlan.dinner[today]?.meal + " - " + mealPlan.dinner[today]?.calories + " kcal";
            } else {
                console.error('Missing meal data for today');
                alert("Error: Missing meal data for today.");
            }
        })
        .catch(err => {
            console.error("Error fetching meal plan:", err);
            alert("An error occurred while fetching the meal plan.");
        });

    // Add event listener for "Meals Completed" button
    document.getElementById('mealsCompleted').addEventListener('click', () => {
        fetch(`/api/diet/${userId}`)
            .then(res => res.json())
            .then(data => {
                const mealPlan = data.diet.meal_plans;
                const today = new Date().getDay();

                // Check for missing data
                if (!mealPlan || !mealPlan.breakfast[today] || !mealPlan.lunch[today] || !mealPlan.dinner[today]) {
                    console.error("Incomplete meal data for today");
                    alert("Error: Incomplete meal data for today.");
                    return;
                }

                // Calculate total calories for the day
                const totalCalories = mealPlan.breakfast[today].calories + 
                                      mealPlan.lunch[today].calories + 
                                      mealPlan.dinner[today].calories;

                // Update the calories for the day in the backend
                fetch(`/api/diet/add-calories/${userId}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ calories: totalCalories })
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('totalCalories').textContent = `Total Calories Consumed: ${totalCalories} kcal`;
                    alert('Calories added successfully!');
                })
                .catch(err => {
                    console.error("Error adding calories:", err);
                    alert("An error occurred while updating calories.");
                });
            });
    });
});
