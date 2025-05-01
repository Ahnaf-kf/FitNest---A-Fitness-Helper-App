const express = require('express');
const Diet = require('../../models/diet');  // Import Diet model

const router = express.Router();

// API 1: Get Diet plan for a specific user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const diet = await Diet.findOne({ user_id });
    if (!diet) {
      return res.status(404).json({ message: 'No diet plan found for this user' });
    }
    res.status(200).json({ diet });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching diet plan', error: err });
  }
});

// API 2: Customize meals for the user (allow users to add/remove foods)
router.put('/customize/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { mealType, foods } = req.body;  // mealType can be 'breakfast', 'lunch', 'dinner', or 'snacks'

  try {
    const diet = await Diet.findOne({ user_id });
    if (!diet) {
      return res.status(404).json({ message: 'Diet plan not found for this user' });
    }

    if (!['breakfast', 'lunch', 'dinner', 'snacks'].includes(mealType)) {
      return res.status(400).json({ message: 'Invalid meal type' });
    }

    // Set the customized meals
    diet.custom_meals[mealType] = foods;

    // Recalculate calories consumed
    diet.calories.consumed = calculateTotalCalories(diet.custom_meals);

    await diet.save();
    res.status(200).json({ message: 'Meals customized successfully', diet });
  } catch (err) {
    res.status(500).json({ message: 'Error customizing meals', error: err });
  }
});

// API 3: Track calories (consumed and burned)
router.put('/track-calories/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { caloriesConsumed, caloriesBurned } = req.body;

  try {
    const diet = await Diet.findOne({ user_id });
    if (!diet) {
      return res.status(404).json({ message: 'Diet plan not found for this user' });
    }

    // Update calories
    diet.calories.consumed = caloriesConsumed;
    diet.calories.burned = caloriesBurned;

    // Recalculate net calories (consumed - burned)
    diet.calories.net = diet.calories.consumed - diet.calories.burned;

    await diet.save();
    res.status(200).json({ message: 'Calories tracked successfully', diet });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking calories', error: err });
  }
});

// API 4: Log nutrition notes (e.g., user can track their eating habits)
router.post('/nutrition-notes/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { note } = req.body;

  try {
    const diet = await Diet.findOne({ user_id });
    if (!diet) {
      return res.status(404).json({ message: 'Diet plan not found for this user' });
    }

    // Add the note to the user's nutrition notes
    diet.nutrition_notes.push(note);
    await diet.save();

    res.status(200).json({ message: 'Nutrition note logged successfully', diet });
  } catch (err) {
    res.status(500).json({ message: 'Error logging nutrition notes', error: err });
  }
});

// Helper function to calculate total calories consumed based on meals
function calculateTotalCalories(customMeals) {
  let totalCalories = 0;
  
  for (const mealType in customMeals) {
    customMeals[mealType].forEach(food => {
      totalCalories += food.calories;
    });
  }

  return totalCalories;
}

module.exports = router;
