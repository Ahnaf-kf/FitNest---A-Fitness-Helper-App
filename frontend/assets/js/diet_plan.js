function getUserIdFromSession() {
    const userId = localStorage.getItem('user_id');
    return userId;
}

let userId = getUserIdFromSession();

if (!userId) {
    alert('User not signed in. Please log in.');
    window.location.href = '/';
} else {
    let currentMealPlan = null;

    async function fetchProfile() {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) return null;
        return (await response.json()).profile;
    }

    async function generateMealPlan() {
        const statusDiv = document.getElementById('mealPlanStatus');
        statusDiv.textContent = 'Generating...';
    
        try {
            const foodCategoriesResponse = await fetch(`/api/diet/food-categories/${userId}`);
            const foodCategoriesData = await foodCategoriesResponse.json();
            
            if (!foodCategoriesResponse.ok || !foodCategoriesData.success) {
                throw new Error(foodCategoriesData.message || 'Failed to fetch food categories');
            }
    
            const response = await fetch(`/api/diet/generate-meal-plan/${userId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    breakfast: foodCategoriesData.data.breakfast,
                    lunch: foodCategoriesData.data.lunch,
                    dinner: foodCategoriesData.data.dinner
                })
            });
            
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to generate meal plan');
            }
    
            currentMealPlan = data.mealPlan;
            
            if (!currentMealPlan || !currentMealPlan.breakfast || !currentMealPlan.lunch || !currentMealPlan.dinner) {
                throw new Error('Invalid meal plan structure received from server');
            }
            
            displayMealPlan(currentMealPlan);
            statusDiv.textContent = 'Meal plan generated!';
    
            const totalCaloriesToday = currentMealPlan.totalCalories || 
                (currentMealPlan.breakfast.reduce((sum, meal) => sum + (meal.calories || 0), 0) +
                 currentMealPlan.lunch.reduce((sum, meal) => sum + (meal.calories || 0), 0) +
                 currentMealPlan.dinner.reduce((sum, meal) => sum + (meal.calories || 0), 0));
    
            const updateResponse = await fetch(`/api/diet/${userId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    calories: {
                        consumed: totalCaloriesToday,
                        burned: Math.round(totalCaloriesToday * 0.8)
                    }
                })
            });
    
            if (!updateResponse.ok) {
                console.warn('Failed to update calories, but meal plan was generated');
            }
    
            document.getElementById('totalCaloriesToday').textContent = 
                `Total Calories Consumed Today: ${totalCaloriesToday} kcal`;
        } catch (error) {
            console.error('Error details:', error);
            statusDiv.textContent = 'Error: ' + error.message;
            statusDiv.style.color = 'red';
        }
    }

    async function shuffleMeals(type) {
        try {
            const response = await fetch(`/api/diet/shuffle/${userId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({type})
            });

            const data = await response.json();
            currentMealPlan = data.mealPlan;
            displayMealPlan(currentMealPlan);
        } catch (error) {
            alert('Shuffle failed');
        }
    }

    function displayMealPlan(mealPlan) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const tbody = document.querySelector('#mealPlanTable tbody');
        tbody.innerHTML = '';
    
        if (!mealPlan || !mealPlan.breakfast || !mealPlan.lunch || !mealPlan.dinner) {
            console.error('Invalid meal plan structure:', mealPlan);
            return;
        }
    
        days.forEach((day, i) => {
            const breakfast = mealPlan.breakfast[i] || { meal: 'Not specified', calories: 0 };
            const lunch = mealPlan.lunch[i] || { meal: 'Not specified', calories: 0 };
            const dinner = mealPlan.dinner[i] || { meal: 'Not specified', calories: 0 };
            
            const totalCal = (breakfast.calories || 0) + 
                             (lunch.calories || 0) + 
                             (dinner.calories || 0);
    
            tbody.innerHTML += `
                <tr>
                    <td>${day}</td>
                    <td>${breakfast.meal} (${breakfast.calories})</td>
                    <td>${lunch.meal} (${lunch.calories})</td>
                    <td>${dinner.meal} (${dinner.calories})</td>
                    <td>${totalCal}</td>
                </tr>
            `;
        });
    }

    document.getElementById('mealsCompletedToday').addEventListener('click', () => {
        const today = new Date().getDay();
        
        if (!currentMealPlan) {
            alert('Meal plan data is not available.');
            return;
        }

        const totalCaloriesToday = currentMealPlan.breakfast[today].calories + 
                                    currentMealPlan.lunch[today].calories + 
                                    currentMealPlan.dinner[today].calories;

        fetch(`/api/diet/${userId}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
        .then(res => res.json())
        .then(dietData => {
            const diet = dietData.diet || { calories: { consumed: [], burned: [] } };
            const todayDate = new Date().toISOString().split('T')[0];

            const existingConsumedEntry = diet.calories.consumed.find(entry => entry.date === todayDate);
            if (existingConsumedEntry) {
                existingConsumedEntry.amount = totalCaloriesToday;
            } else {
                diet.calories.consumed.push({ date: todayDate, amount: totalCaloriesToday });
            }

            const totalBurnedCalories = totalCaloriesToday * 0.8;
            const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === todayDate);
            if (existingBurnedEntry) {
                existingBurnedEntry.amount = totalBurnedCalories;
            } else {
                diet.calories.burned.push({ date: todayDate, amount: totalBurnedCalories });
            }

            fetch(`/api/diet/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(diet)
            });

            document.getElementById('totalCaloriesToday').textContent = `Total Calories Consumed Today: ${totalCaloriesToday} kcal`;
            alert('Calories updated successfully!');
        })
        .catch(err => {
            console.error("Error adding calories:", err);
            alert("An error occurred while updating calories.");
        });
    });

    // Sticky Note Functions
   // Sticky Note Functions
async function loadNutritionNotes() {
    try {
        const response = await fetch(`/api/diet/${userId}`);
        if (response.ok) {
            const data = await response.json();
            // Check both possible locations for notes
            const notes = data.nutrition_notes || (data.diet && data.diet.nutrition_notes);
            if (notes && notes.length > 0) {
                // Handle both array and string formats
                const notesText = Array.isArray(notes) ? notes.join('\n') : notes;
                document.getElementById('nutritionNotes').value = notesText;
            }
        }
    } catch (error) {
        console.error('Error loading nutrition notes:', error);
    }
}

async function saveNutritionNotes() {
    const notesText = document.getElementById('nutritionNotes').value;
    
    try {
        const response = await fetch(`/api/diet/${userId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                nutrition_notes: notesText.split('\n').filter(line => line.trim() !== '')
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Notes saved:', result);
            alert('Notes saved successfully!');
        } else {
            throw new Error(await response.text());
        }
    } catch (error) {
        console.error('Error saving nutrition notes:', error);
        alert('Error saving notes: ' + error.message);
    }
}

    // Single DOMContentLoaded event listener
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            // Load meal plan
            const dietResponse = await fetch(`/api/diet/${userId}`);
            if (dietResponse.ok) {
                const data = await dietResponse.json();
                if (data.meal_plans) {
                    currentMealPlan = data.meal_plans;
                    displayMealPlan(currentMealPlan);
                }
            }
            
            // Load nutrition notes
            await loadNutritionNotes();
            
            // Add event listener for save button
            document.getElementById('saveNotes').addEventListener('click', saveNutritionNotes);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }

        // Event listeners for buttons
        document.getElementById('generateMealPlan').addEventListener('click', generateMealPlan);
        document.getElementById('shuffleToday').addEventListener('click', () => shuffleMeals('today'));
        document.getElementById('shuffleWeek').addEventListener('click', () => shuffleMeals('week'));
    });
}