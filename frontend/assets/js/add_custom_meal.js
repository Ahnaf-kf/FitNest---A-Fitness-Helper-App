// Nutritionix credentials
const NUTRITIONIX_APP_ID = 'f6078e87';
const NUTRITIONIX_APP_KEY = 'bf64d4bdd47d133d4818859abf9cf252';

const foodInputsDiv = document.getElementById('foodInputs');
const addFoodBtn = document.getElementById('addFoodBtn');
const customMealForm = document.getElementById('customMealForm');
const mealListDiv = document.getElementById('mealList');

const userId = localStorage.getItem('user_id');
let meals = [];

addFoodBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'form-row';
    row.innerHTML = `
        <input type="text" name="foodName" placeholder="Food name" required>
        <input type="number" name="foodGrams" placeholder="Amount (grams)" min="1" required>
        <button type="button" class="btn removeFoodBtn" style="background:var(--danger);padding:0 1rem;">&times;</button>
    `;
    foodInputsDiv.appendChild(row);
    row.querySelector('.removeFoodBtn').onclick = () => row.remove();
});

async function getCalories(food, grams) {
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
    const data = await res.json();
    if (data.foods && data.foods.length > 0) {
        return data.foods[0].nf_calories || 0;
    }
    return 0;
}

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
        Array.from(foodInputsDiv.querySelectorAll('.form-row')).slice(1).forEach(row => row.remove());
    } catch (err) {
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
        mealListDiv.innerHTML = '<div style="color:var(--danger);">Could not load meals.</div>';
    }
}

function renderMeals() {
    mealListDiv.innerHTML = '';
    meals.forEach((meal, idx) => {
        const mealDiv = document.createElement('div');
        mealDiv.className = 'meal-card';
        mealDiv.innerHTML = `
            <h3>Meal ${idx + 1}</h3>
            <div class="food-list">
                ${meal.foods.map(f => `<div class="food-item">${f.name} (${f.grams}g) <span>${f.calories} kcal</span></div>`).join('')}
            </div>
            <div class="total-calories">Total: ${meal.totalCalories} kcal</div>
            ${meal.note ? `<div style="margin-top:0.5rem;"><b>Note:</b> ${meal.note}</div>` : ''}
        `;
        mealListDiv.appendChild(mealDiv);
    });
}

fetchAndRenderMeals(); 