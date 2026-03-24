// Nutritionix credentials
const NUTRITIONIX_APP_ID = 'f6078e87';
const NUTRITIONIX_APP_KEY = 'bf64d4bdd47d133d4818859abf9cf252';

const foodInputsDiv = document.getElementById('foodInputs');
const addFoodBtn = document.getElementById('addFoodBtn');
const customMealForm = document.getElementById('customMealForm');
const mealListDiv = document.getElementById('mealList');

const userId = localStorage.getItem('user_id');
let meals = [];
let addedMealsToday = new Set(); // Track which meals have been added today

// Helper function to get today's date string
function getTodayString() {
    return new Date().toDateString();
}

// Helper function to load added meals from localStorage
function loadAddedMeals() {
    const today = getTodayString();
    const stored = localStorage.getItem(`addedMeals_${userId}_${today}`);
    if (stored) {
        addedMealsToday = new Set(JSON.parse(stored));
    } else {
        addedMealsToday = new Set();
    }
}

// Helper function to save added meals to localStorage
function saveAddedMeals() {
    const today = getTodayString();
    localStorage.setItem(`addedMeals_${userId}_${today}`, JSON.stringify([...addedMealsToday]));
}

// Helper function to check if meal was added today
function isMealAddedToday(mealId) {
    return addedMealsToday.has(mealId);
}

// Helper function to mark meal as added today
function markMealAsAdded(mealId) {
    addedMealsToday.add(mealId);
    saveAddedMeals();
}

// Helper function to clear old added meals data
function clearOldAddedMeals() {
    const today = getTodayString();
    // Remove old entries (keep only today's)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('addedMeals_') && !key.includes(today)) {
            localStorage.removeItem(key);
        }
    });
}

addFoodBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML = `
        <div class="food-input-wrapper">
            <input type="text" name="foodName" placeholder="Food name" required>
            <div class="food-suggestions-dropdown" style="display:none;"></div>
        </div>
        <input type="number" name="foodGrams" placeholder="Amount (grams)" min="1" required>
        <button type="button" class="btn removeFoodBtn" style="background:var(--danger);padding:0 1rem;">&times;</button>
    `;
    foodInputsDiv.appendChild(row);
    const foodNameInput = row.querySelector('input[name="foodName"]');
    const suggestionsContainer = row.querySelector('.food-suggestions-dropdown');
    attachFoodAutocomplete(foodNameInput, suggestionsContainer);
    row.querySelector('.removeFoodBtn').onclick = () => row.remove();
});

// Simple fallback calorie database for common foods (calories per 100g)
const fallbackCalories = {
    'apple': 52,
    'banana': 89,
    'orange': 47,
    'rice': 130,
    'chicken': 165,
    'beef': 250,
    'fish': 120,
    'bread': 265,
    'pasta': 157,
    'potato': 77,
    'tomato': 18,
    'lettuce': 5,
    'carrot': 25,
    'milk': 61,
    'cheese': 402,
    'egg': 78,
    'butter': 717,
    'sugar': 387,
    'salt': 0,
    'water': 0,
    'oats': 379,
    'yogurt': 61,
    'nuts': 607,
    'almonds': 579,
    'walnuts': 654,
    'peanut': 567,
    'broccoli': 34,
    'spinach': 23,
    'cucumber': 15,
    'onion': 40,
    'garlic': 149,
    'ginger': 80,
    'pepper': 31,
    'mushroom': 22,
    'avocado': 160,
    'strawberry': 32,
    'blueberry': 57,
    'grape': 69,
    'lemon': 29,
    'lime': 30,
    'coconut': 354,
    'olive oil': 884,
    'honey': 304,
    'flour': 361,
    'sugar': 387,
    'cocoa': 228,
    'coffee': 1,
    'tea': 1
};

function getFallbackCalories(foodName, grams) {
    const food = foodName.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    // Try exact match first
    if (fallbackCalories[food]) {
        return Math.round((fallbackCalories[food] * grams) / 100);
    }

    // Try partial matches
    for (const [key, value] of Object.entries(fallbackCalories)) {
        if (food.includes(key) || key.includes(food)) {
            const score = Math.min(key.length, food.length) / Math.max(key.length, food.length);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = value;
            }
        }
    }

    if (bestMatch) {
        return Math.round((bestMatch * grams) / 100);
    }

    // Default fallback based on food type estimation
    if (food.includes('vegetable') || food.includes('salad') || food.includes('leafy')) {
        return Math.round(grams * 0.3); // ~30 calories per 100g for vegetables
    } else if (food.includes('fruit')) {
        return Math.round(grams * 0.5); // ~50 calories per 100g for fruits
    } else if (food.includes('meat') || food.includes('chicken') || food.includes('beef') || food.includes('fish')) {
        return Math.round(grams * 1.5); // ~150 calories per 100g for proteins
    } else if (food.includes('rice') || food.includes('pasta') || food.includes('bread') || food.includes('grain')) {
        return Math.round(grams * 1.3); // ~130 calories per 100g for carbs
    } else {
        return Math.round(grams * 2); // Default 2 calories per gram
    }
}

async function getCalories(food, grams) {
    try {
        const url = 'https://trackapi.nutritionix.com/v2/natural/nutrients';
        const body = { query: `${grams} grams ${food}` };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': NUTRITIONIX_APP_ID,
                'x-app-key': NUTRITIONIX_APP_KEY
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.log('API call failed, using fallback calories');
            return getFallbackCalories(food, grams);
        }

        const data = await res.json();

        if (data.foods && data.foods.length > 0) {
            const calories = data.foods[0].nf_calories || 0;
            return Math.round(calories);
        }

        console.log('No foods found in response, using fallback');
        return getFallbackCalories(food, grams);
    } catch (error) {
        console.log('Error in getCalories, using fallback:', error.message);
        return getFallbackCalories(food, grams);
    }
}

async function fetchFoodSuggestions(query) {
    if (!query || query.length < 2) return [];
    try {
        const url = 'https://trackapi.nutritionix.com/v2/search/instant';
        const response = await fetch(url + `?query=${encodeURIComponent(query)}&self=true&branded=false&common=true&limit=5`, {
            headers: {
                'x-app-id': NUTRITIONIX_APP_ID,
                'x-app-key': NUTRITIONIX_APP_KEY
            }
        });
        const data = await response.json();
        const suggestions = [];
        if (data.common && Array.isArray(data.common)) {
            suggestions.push(...data.common.slice(0, 5).map(item => ({
                name: item.food_name,
                type: 'common'
            })));
        }
        return suggestions;
    } catch (err) {
        console.error('Error fetching food suggestions:', err);
        return [];
    }
}

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

function showFoodSuggestions(inputElement, suggestionsContainer, suggestions) {
    if (suggestions.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    suggestionsContainer.innerHTML = suggestions.map((suggestion, idx) => `
        <div class="food-suggestion-item" data-index="${idx}">
            <div class="food-name">${suggestion.name}</div>
            <div class="food-details">${suggestion.type}</div>
        </div>
    `).join('');

    suggestionsContainer.style.display = 'block';

    Array.from(suggestionsContainer.querySelectorAll('.food-suggestion-item')).forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            const selected = suggestions[index];
            inputElement.value = selected.name;
            suggestionsContainer.style.display = 'none';
        });
    });
}

function attachFoodAutocomplete(inputElement, suggestionsContainer) {
    const debouncedSearch = debounce(async (query) => {
        const suggestions = await fetchFoodSuggestions(query);
        showFoodSuggestions(inputElement, suggestionsContainer, suggestions);
    }, 300);

    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        debouncedSearch(query);
    });

    inputElement.addEventListener('focus', () => {
        if (inputElement.value.length >= 2 && suggestionsContainer.innerHTML) {
            suggestionsContainer.style.display = 'block';
        }
    });
}

// Attach autocomplete to initial food input
document.addEventListener('DOMContentLoaded', () => {
    const initialFoodInput = foodInputsDiv.querySelector('input[name="foodName"]');
    const initialSuggestionsContainer = foodInputsDiv.querySelector('.food-suggestions-dropdown');
    if (initialFoodInput && initialSuggestionsContainer) {
        attachFoodAutocomplete(initialFoodInput, initialSuggestionsContainer);
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.food-input-wrapper')) {
        document.querySelectorAll('.food-suggestions-dropdown').forEach(container => {
            container.style.display = 'none';
        });
    }
});

customMealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) {
        alert('User not signed in. Please log in.');
        return;
    }
    const foodRows = Array.from(foodInputsDiv.querySelectorAll('.form-row'));
    const foods = [];
    for (const row of foodRows) {
        const name = row.querySelector('input[name="foodName"]').value.trim();
        const grams = parseFloat(row.querySelector('input[name="foodGrams"]').value);
        if (name && grams > 0) {
            foods.push({ name, grams });
        }
    }
    if (foods.length === 0) return;
    const note = document.getElementById('mealNote').value.trim();

    // Fetch calories for each food
    const foodsWithCalories = [];
    let totalCalories = 0;
    for (const food of foods) {
        const calories = await getCalories(food.name, food.grams);
        foodsWithCalories.push({ ...food, calories });
        totalCalories += calories;
    }

    // Save meal to backend
    try {
        const res = await fetch('/api/custom-meal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                foods: foodsWithCalories,
                note,
                totalCalories
            })
        });
        if (!res.ok) throw new Error('Failed to save meal');
        await fetchAndRenderMeals();
        customMealForm.reset();
        // Reset to single food input
        foodInputsDiv.innerHTML = `
            <div class="form-row">
                <div class="food-input-wrapper">
                    <input type="text" name="foodName" placeholder="Food name" required>
                    <div class="food-suggestions-dropdown" style="display:none;"></div>
                </div>
                <input type="number" name="foodGrams" placeholder="Amount (grams)" min="1" required>
            </div>
        `;
        // Re-attach autocomplete to the reset input
        const initialFoodInput = foodInputsDiv.querySelector('input[name="foodName"]');
        const initialSuggestionsContainer = foodInputsDiv.querySelector('.food-suggestions-dropdown');
        if (initialFoodInput && initialSuggestionsContainer) {
            attachFoodAutocomplete(initialFoodInput, initialSuggestionsContainer);
        }
    } catch (err) {
        console.error('Error saving meal:', err);
        alert('Error saving meal: ' + err.message);
    }
});

async function fetchAndRenderMeals() {
    if (!userId) return;
    try {
        const res = await fetch(`/api/custom-meal/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch meals');
        meals = await res.json();
        renderMeals();
    } catch (err) {
        console.error('Error fetching meals:', err);
        mealListDiv.innerHTML = '<div style="color:var(--danger);">Could not load meals.</div>';
    }
}

function renderMeals() {
    mealListDiv.innerHTML = '';
    meals.forEach((meal, idx) => {
        const mealId = meal._id || idx; // Use meal._id if available, fallback to index
        const isAdded = isMealAddedToday(mealId);
        const buttonText = isAdded ? 'Added ✓' : 'Add to Today\'s Calories';
        const buttonDisabled = isAdded ? 'disabled' : '';
        const buttonStyle = isAdded ? 'background: #28a745;' : '';
        
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-card';
        mealDiv.innerHTML = `
            <h3>
                Meal ${idx + 1}
                <button class="add-calories-btn" data-meal-id="${mealId}" data-calories="${meal.totalCalories}" ${buttonDisabled} style="${buttonStyle}">
                    ${buttonText}
                </button>
            </h3>
            <div class="food-list">
                ${meal.foods.map(f => `<div class="food-item">${f.name} (${f.grams}g) <span>${f.calories || 0} kcal</span></div>`).join('')}
            </div>
            <div class="total-calories">Total: ${meal.totalCalories || 0} kcal</div>
            ${meal.note ? `<div style="margin-top:0.5rem;"><b>Note:</b> ${meal.note}</div>` : ''}
        `;
        mealListDiv.appendChild(mealDiv);
    });

    // Add event listeners to the add calories buttons
    document.querySelectorAll('.add-calories-btn:not([disabled])').forEach(button => {
        button.addEventListener('click', async (e) => {
            const calories = parseInt(e.target.dataset.calories);
            const mealId = e.target.dataset.mealId;
            const button = e.target;
            
            // Disable button to prevent multiple clicks
            button.disabled = true;
            button.textContent = 'Adding...';
            
            try {
                const response = await fetch(`/api/profile/add-calories/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ calories })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    markMealAsAdded(mealId);
                    alert(`Successfully added ${calories} calories to today's consumption! Total calories consumed today: ${data.todayCalories}\n\nRedirecting to dashboard to view updated chart...`);
                    button.textContent = 'Added ✓';
                    button.style.background = '#28a745';
                    // Redirect to dashboard after successful addition
                    setTimeout(() => {
                        window.location.href = '/pages/dashboard.html';
                    }, 1500);
                } else {
                    alert('Error adding calories: ' + data.message);
                    button.disabled = false;
                    button.textContent = 'Add to Today\'s Calories';
                }
            } catch (error) {
                console.error('Error adding calories:', error);
                alert('Error adding calories. Please try again.');
                button.disabled = false;
                button.textContent = 'Add to Today\'s Calories';
            }
        });
    });
}

fetchAndRenderMeals();

// Initialize added meals tracking
clearOldAddedMeals();
loadAddedMeals(); 