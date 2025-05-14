const express = require('express');
const CustomMeal = require('../../models/custom_meal');

const router = express.Router();

// Add a custom meal
router.post('/', async (req, res) => {
    try {
        const { user_id, foods, note, totalCalories } = req.body;
        if (!user_id || !Array.isArray(foods) || foods.length === 0) {
            return res.status(400).json({ message: 'user_id and at least one food are required' });
        }
        const meal = new CustomMeal({
            user_id,
            foods,
            note,
            totalCalories
        });
        await meal.save();
        res.status(201).json({ message: 'Meal added', meal });
    } catch (error) {
        res.status(500).json({ message: 'Error adding meal', error: error.message });
    }
});

// Get all custom meals for a user
router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const meals = await CustomMeal.find({ user_id }).sort({ date: -1 });
        res.json(meals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching meals', error: error.message });
    }
});

module.exports = router; 