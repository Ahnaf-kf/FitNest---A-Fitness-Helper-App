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
        statusDiv.style.color = 'inherit';
    
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

            // Calculate total calories for today
            const today = new Date().getDay() - 1; // Adjust for 0-based index
            const todayMeal = currentMealPlan.breakfast[today] || { totalCalories: 0 };
            const totalCaloriesToday = todayMeal.totalCalories + 
                                     (currentMealPlan.lunch[today]?.totalCalories || 0) + 
                                     (currentMealPlan.dinner[today]?.totalCalories || 0);
    
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
        document.getElementById('mealPlanStatus').textContent = 'Error: Invalid meal plan data';
        document.getElementById('mealPlanStatus').style.color = 'red';
        return;
    }

    try {
        days.forEach((day, i) => {
            // Safely get meal data with defaults
            const breakfast = mealPlan.breakfast[i] || { items: [], totalCalories: 0 };
            const lunch = mealPlan.lunch[i] || { items: [], totalCalories: 0 };
            const dinner = mealPlan.dinner[i] || { items: [], totalCalories: 0 };

            // Ensure items is an array before mapping
            const breakfastItems = Array.isArray(breakfast.items) 
                ? breakfast.items.map(item => 
                    `<div class="meal-item">${item.name || 'Unknown'} <span class="calories">(${item.calories || 0})</span></div>`
                ).join('')
                : 'Not specified';

            const lunchItems = Array.isArray(lunch.items) 
                ? lunch.items.map(item => 
                    `<div class="meal-item">${item.name || 'Unknown'} <span class="calories">(${item.calories || 0})</span></div>`
                ).join('')
                : 'Not specified';

            const dinnerItems = Array.isArray(dinner.items) 
                ? dinner.items.map(item => 
                    `<div class="meal-item">${item.name || 'Unknown'} <span class="calories">(${item.calories || 0})</span></div>`
                ).join('')
                : 'Not specified';

            const totalCal = (breakfast.totalCalories || 0) + 
                            (lunch.totalCalories || 0) + 
                            (dinner.totalCalories || 0);

            tbody.innerHTML += `
                <tr>
                    <td>${day}</td>
                    <td class="meal-items">${breakfastItems}</td>
                    <td class="meal-items">${lunchItems}</td>
                    <td class="meal-items">${dinnerItems}</td>
                    <td class="total-calories">${totalCal}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error displaying meal plan:', error);
        document.getElementById('mealPlanStatus').textContent = 'Error displaying meal plan';
        document.getElementById('mealPlanStatus').style.color = 'red';
    }
}
    document.getElementById('mealsCompletedToday').addEventListener('click', () => {
        const today = new Date().getDay() - 1; // Adjust for 0-based index
        
        if (!currentMealPlan) {
            alert('Meal plan data is not available.');
            return;
        }

        const breakfast = currentMealPlan.breakfast[today] || { totalCalories: 0 };
        const lunch = currentMealPlan.lunch[today] || { totalCalories: 0 };
        const dinner = currentMealPlan.dinner[today] || { totalCalories: 0 };
        
        const totalCaloriesToday = breakfast.totalCalories + lunch.totalCalories + dinner.totalCalories;

        fetch(`/api/diet/${userId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                calories: {
                    consumed: totalCaloriesToday,
                    burned: Math.round(totalCaloriesToday * 0.8)
                }
            })
        })
        .then(response => {
            if (response.ok) {
                document.getElementById('totalCaloriesToday').textContent = 
                    `Total Calories Consumed Today: ${totalCaloriesToday} kcal`;
                alert('Calories updated successfully!');
            } else {
                throw new Error('Failed to update calories');
            }
        })
        .catch(err => {
            console.error("Error adding calories:", err);
            alert("An error occurred while updating calories.");
        });
    });

    // Sticky Note Functions
function makeStickyNoteDraggable() {
    const stickyNote = document.getElementById('stickyNote');
    let isDragging = false;
    let offsetX, offsetY;

    // Load saved position and size
    const savedNote = JSON.parse(localStorage.getItem('stickyNoteSettings')) || {};
    if (savedNote) {
        if (savedNote.left) stickyNote.style.left = savedNote.left;
        if (savedNote.top) stickyNote.style.top = savedNote.top;
        if (savedNote.width) stickyNote.style.width = savedNote.width;
        if (savedNote.height) stickyNote.style.height = savedNote.height;
        if (savedNote.visible !== undefined) {
            stickyNote.classList.toggle('active', savedNote.visible);
            document.getElementById('restoreStickyBtn').textContent = 
                savedNote.visible ? '📝 Hide Notes' : '📝 Show Notes';
        }
    } else {
        // Default position
        stickyNote.style.left = 'calc(100% - 350px)';
        stickyNote.style.top = '100px';
    }

    // Handle mouse down on sticky header
    const stickyHeader = stickyNote.querySelector('.sticky-header');
    stickyHeader.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('close-btn')) return;
        
        isDragging = true;
        const rect = stickyNote.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        stickyNote.style.cursor = 'grabbing';
        e.preventDefault();
    });

    // Handle mouse move for dragging
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate new position relative to viewport
        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;
        
        // Ensure note stays within viewport bounds
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const noteWidth = stickyNote.offsetWidth;
        const noteHeight = stickyNote.offsetHeight;
        
        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - noteWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - noteHeight));
        
        stickyNote.style.left = `${newLeft}px`;
        stickyNote.style.top = `${newTop}px`;
    });

    // Handle mouse up to stop dragging
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            stickyNote.style.cursor = 'move';
            saveStickyNotePosition();
        }
    });

    // Handle resize to save new dimensions
    const resizeObserver = new ResizeObserver(() => {
        saveStickyNotePosition();
    });
    resizeObserver.observe(stickyNote);

    // Close button functionality
    const closeBtn = stickyNote.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        stickyNote.classList.remove('active');
        document.getElementById('restoreStickyBtn').textContent = '📝 Show Notes';
        saveStickyNotePosition();
    });

    // Restore button functionality
    document.getElementById('restoreStickyBtn').addEventListener('click', () => {
        const isVisible = stickyNote.classList.toggle('active');
        document.getElementById('restoreStickyBtn').textContent = 
            isVisible ? '📝 Hide Notes' : '📝 Show Notes';
        saveStickyNotePosition();
    });

    // Handle window resize to keep note in view
    window.addEventListener('resize', () => {
        const rect = stickyNote.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (rect.right > viewportWidth) {
            stickyNote.style.left = `${viewportWidth - rect.width}px`;
        }
        if (rect.bottom > viewportHeight) {
            stickyNote.style.top = `${viewportHeight - rect.height}px`;
        }
    });
}

function saveStickyNotePosition() {
    const stickyNote = document.getElementById('stickyNote');
    if (!stickyNote) return;
    
    const rect = stickyNote.getBoundingClientRect();
    const settings = {
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: stickyNote.style.width,
        height: stickyNote.style.height,
        visible: stickyNote.classList.contains('active')
    };
    localStorage.setItem('stickyNoteSettings', JSON.stringify(settings));
}

    async function loadNutritionNotes() {
        try {
            const response = await fetch(`/api/diet/${userId}`);
            if (response.ok) {
                const data = await response.json();
                const notes = data.nutrition_notes || (data.diet && data.diet.nutrition_notes);
                if (notes && notes.length > 0) {
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
            
            // Load nutrition notes and initialize sticky note
            await loadNutritionNotes();
            makeStickyNoteDraggable();
            
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