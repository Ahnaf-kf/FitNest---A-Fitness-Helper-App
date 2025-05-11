const express = require('express');
const Diet = require('../../models/diet');
const Profile = require('../../models/profile');

const router = express.Router();

// Helper function to shuffle array
function shuffleArray(array) {
    if (!Array.isArray(array)) return [];
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to generate meal plan
function generateMealPlan(userGoal, maintenanceCalories, selectedMeals) {
    const mealPlan = {
        breakfast: Array(7).fill().map(() => ({ items: [], totalCalories: 0 })),
        lunch: Array(7).fill().map(() => ({ items: [], totalCalories: 0 })),
        dinner: Array(7).fill().map(() => ({ items: [], totalCalories: 0 })),
        totalCalories: 0
    };

    if (!selectedMeals || typeof selectedMeals !== 'object') {
        selectedMeals = { breakfast: [], lunch: [], dinner: [] };
    }

    let targetCalories;
    if (userGoal === 'gain') {
        targetCalories = maintenanceCalories + 500;
    } else if (userGoal === 'lose') {
        targetCalories = maintenanceCalories - 500;
    } else {
        targetCalories = maintenanceCalories;
    }

    // Helper function to select random items
    function selectRandomItems(items, count) {
        if (!Array.isArray(items)) return [];
        const shuffled = shuffleArray([...items]);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    for (let i = 0; i < 7; i++) {
        // Select 2-3 breakfast items
        const breakfastItems = selectRandomItems(selectedMeals.breakfast, 2 + Math.floor(Math.random() * 2));
        mealPlan.breakfast[i].items = breakfastItems.map(item => ({
            name: item.name || 'Unknown',
            calories: item.calories || 0
        }));
        mealPlan.breakfast[i].totalCalories = breakfastItems.reduce((sum, item) => sum + (item.calories || 0), 0);

        // Select 2-3 lunch items
        const lunchItems = selectRandomItems(selectedMeals.lunch, 2 + Math.floor(Math.random() * 2));
        mealPlan.lunch[i].items = lunchItems.map(item => ({
            name: item.name || 'Unknown',
            calories: item.calories || 0
        }));
        mealPlan.lunch[i].totalCalories = lunchItems.reduce((sum, item) => sum + (item.calories || 0), 0);

        // Select 2-3 dinner items
        const dinnerItems = selectRandomItems(selectedMeals.dinner, 2 + Math.floor(Math.random() * 2));
        mealPlan.dinner[i].items = dinnerItems.map(item => ({
            name: item.name || 'Unknown',
            calories: item.calories || 0
        }));
        mealPlan.dinner[i].totalCalories = dinnerItems.reduce((sum, item) => sum + (item.calories || 0), 0);
    }

    // Calculate total calories for adjustment
    const avgDailyCalories = mealPlan.breakfast.reduce((sum, day) => sum + day.totalCalories, 0) / 7 +
                           mealPlan.lunch.reduce((sum, day) => sum + day.totalCalories, 0) / 7 +
                           mealPlan.dinner.reduce((sum, day) => sum + day.totalCalories, 0) / 7;

    if (avgDailyCalories > 0) {
        const adjustmentFactor = targetCalories / avgDailyCalories;
        
        // Adjust calories for all meals
        for (let i = 0; i < 7; i++) {
            mealPlan.breakfast[i].items.forEach(item => {
                item.calories = Math.round((item.calories || 0) * adjustmentFactor);
            });
            mealPlan.breakfast[i].totalCalories = mealPlan.breakfast[i].items.reduce((sum, item) => sum + (item.calories || 0), 0);

            mealPlan.lunch[i].items.forEach(item => {
                item.calories = Math.round((item.calories || 0) * adjustmentFactor);
            });
            mealPlan.lunch[i].totalCalories = mealPlan.lunch[i].items.reduce((sum, item) => sum + (item.calories || 0), 0);

            mealPlan.dinner[i].items.forEach(item => {
                item.calories = Math.round((item.calories || 0) * adjustmentFactor);
            });
            mealPlan.dinner[i].totalCalories = mealPlan.dinner[i].items.reduce((sum, item) => sum + (item.calories || 0), 0);
        }
    }

    mealPlan.totalCalories = targetCalories;
    return mealPlan;
}

// Get diet data
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet) return res.status(404).json({ message: 'Diet plan not found' });
        
        const response = {
            ...diet._doc,
            nutrition_notes: diet.nutrition_notes || []
        };
        
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching diet', error: err });
    }
});

// Update diet data
router.put('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { calories, nutrition_notes } = req.body;

    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet) {
            return res.status(404).json({ message: 'Diet plan not found for this user' });
        }

        const today = new Date().toISOString().split('T')[0];

        if (calories && calories.consumed !== undefined) {
            const existingConsumedEntry = diet.calories.consumed.find(entry => entry.date === today);
            if (existingConsumedEntry) {
                existingConsumedEntry.amount = calories.consumed;
            } else {
                diet.calories.consumed.push({
                    date: today,
                    amount: calories.consumed
                });
            }
        }

        if (calories && calories.burned !== undefined) {
            const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === today);
            if (existingBurnedEntry) {
                existingBurnedEntry.amount += calories.burned;
            } else {
                diet.calories.burned.push({
                    date: today,
                    amount: calories.burned
                });
            }
        }

        if (nutrition_notes !== undefined) {
            diet.nutrition_notes = Array.isArray(nutrition_notes) 
                ? nutrition_notes 
                : [nutrition_notes].filter(Boolean);
        }

        diet.last_updated = new Date();
        await diet.save();

        res.status(200).json({
            message: 'Diet plan updated successfully',
            diet: diet
        });
    } catch (err) {
        console.error('Error updating diet:', err);
        res.status(500).json({ message: 'Error updating diet', error: err });
    }
});

// Generate meal plan
router.post('/generate-meal-plan/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { breakfast, lunch, dinner } = req.body;
    
    try {
        const profile = await Profile.findOne({ user_id });
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found for this user'
            });
        }

        const diet = await Diet.findOne({ user_id });
        if (!diet) {
            return res.status(404).json({
                success: false,
                message: 'Diet plan not found for this user'
            });
        }

        const dietGoal = profile.fitness_goals?.goal === 'lose weight' ? 'lose' : 
                        profile.fitness_goals?.goal === 'gain muscle' ? 'gain' : 'maintain';
        const bmrValue = profile.metrics?.bmr || 2000;

        const mealPlan = generateMealPlan(
            dietGoal,
            bmrValue,
            { 
                breakfast: Array.isArray(breakfast) ? breakfast : [],
                lunch: Array.isArray(lunch) ? lunch : [],
                dinner: Array.isArray(dinner) ? dinner : []
            }
        );

        diet.meal_plans = mealPlan;
        diet.last_updated = new Date();
        await diet.save();
        
        res.status(200).json({
            success: true,
            message: 'Meal plan generated successfully',
            mealPlan: mealPlan
        });
    } catch (err) {
        console.error('Error generating meal plan:', err);
        res.status(500).json({
            success: false,
            message: 'Error generating meal plan',
            error: err.message
        });
    }
});

// Shuffle meal plan
router.post('/shuffle/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { type } = req.body;

    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet || !diet.meal_plans) {
            return res.status(404).json({ message: 'Diet plan not found for this user' });
        }

        let shuffledMealPlan = JSON.parse(JSON.stringify(diet.meal_plans));

        if (type === "today") {
            const todayIndex = new Date().getDay();
            if (todayIndex >= 0 && todayIndex < 7) {
                const swapIndex = Math.floor(Math.random() * 7);
                
                [shuffledMealPlan.breakfast[todayIndex], shuffledMealPlan.breakfast[swapIndex]] = 
                [shuffledMealPlan.breakfast[swapIndex], shuffledMealPlan.breakfast[todayIndex]];

                [shuffledMealPlan.lunch[todayIndex], shuffledMealPlan.lunch[swapIndex]] = 
                [shuffledMealPlan.lunch[swapIndex], shuffledMealPlan.lunch[todayIndex]];

                [shuffledMealPlan.dinner[todayIndex], shuffledMealPlan.dinner[swapIndex]] = 
                [shuffledMealPlan.dinner[swapIndex], shuffledMealPlan.dinner[todayIndex]];
            }
        } else {
            shuffledMealPlan.breakfast = shuffleArray(diet.meal_plans.breakfast);
            shuffledMealPlan.lunch = shuffleArray(diet.meal_plans.lunch);
            shuffledMealPlan.dinner = shuffleArray(diet.meal_plans.dinner);
        }

        diet.meal_plans = shuffledMealPlan;
        diet.last_updated = new Date();
        await diet.save();

        res.status(200).json({ 
            message: 'Meal plan shuffled successfully', 
            mealPlan: shuffledMealPlan 
        });
    } catch (err) {
        console.error('Error shuffling meal plan:', err);
        res.status(500).json({ message: 'Error shuffling meal plan', error: err });
    }
});

// Get food categories
router.get('/food-categories/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const profile = await Profile.findOne({ user_id });
        if (!profile) {
            return res.status(404).json({ 
                success: false,
                message: 'Profile not found for this user' 
            });
        }

        let diet = await Diet.findOne({ user_id });
        
        if (!diet) {
            diet = new Diet({
                user_id: user_id,
                meal_plans: {
                    breakfast: [],
                    lunch: [],
                    dinner: [],
                    totalCalories: 0
                },
                calories: {
                    burned: [],
                    consumed: []
                },
                bmr: profile.metrics?.bmr || 2000,
                food_calories: {
                    breakfast: {
                        "Egg": 78,
                        "Oatmeal (1 cup)": 154,
                        "Banana (1 medium)": 105,
                        "Avocado (1 medium)": 240,
                        "Whole Wheat Toast (1 slice)": 70,
                        "Greek Yogurt (1 cup, plain)": 100,
                        "Smoothie (1 cup)": 200,
                        "Cottage Cheese (1/2 cup)": 120,
                        "Chia Seeds (1 tbsp)": 60
                    },
                    lunch: {
                        "Chicken Breast (100g)": 165,
                        "Brown Rice (1 cup cooked)": 215,
                        "Sweet Potato (100g)": 94,
                        "Broccoli (100g)": 35,
                        "Salmon (100g)": 206,
                        "Quinoa (1 cup cooked)": 222,
                        "Mixed Greens Salad (1 cup)": 50,
                        "Hummus (2 tbsp)": 70,
                        "Avocado (1 medium)": 240
                    },
                    dinner: {
                        "Grilled Chicken (100g)": 165,
                        "Roasted Vegetables (1 cup)": 120,
                        "Spaghetti (whole wheat, 1 cup cooked)": 174,
                        "Tofu (100g)": 144,
                        "Steak (lean, 100g)": 271,
                        "Brown Rice (1 cup cooked)": 215,
                        "Asparagus (100g)": 20,
                        "Cauliflower (100g)": 25,
                        "Lentils (1/2 cup cooked)": 115
                    }
                },
                last_updated: new Date()
            });
            
            await diet.save();
        }

        const foodCategories = {
            breakfast: Object.entries(diet.food_calories?.breakfast || {}).map(([name, calories]) => ({
                name,
                calories
            })),
            lunch: Object.entries(diet.food_calories?.lunch || {}).map(([name, calories]) => ({
                name,
                calories
            })),
            dinner: Object.entries(diet.food_calories?.dinner || {}).map(([name, calories]) => ({
                name,
                calories
            }))
        };

        res.status(200).json({
            success: true,
            data: foodCategories
        });

    } catch (err) {
        console.error('Error in /food-categories:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error while fetching food categories',
            error: err.message 
        });
    }
});

module.exports = router;