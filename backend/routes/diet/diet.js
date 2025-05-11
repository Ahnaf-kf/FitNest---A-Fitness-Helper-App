const express = require('express');
const Diet = require('../../models/diet');
const Profile = require('../../models/profile');

const router = express.Router();

// Helper function to shuffle array
function shuffleArray(array) {
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
        breakfast: [],
        lunch: [],
        dinner: [],
        totalCalories: 0
    };

    let targetCalories;
    if (userGoal === 'gain') {
        targetCalories = maintenanceCalories + 500;
    } else if (userGoal === 'lose') {
        targetCalories = maintenanceCalories - 500;
    } else {
        targetCalories = maintenanceCalories;
    }

    for (let i = 0; i < 7; i++) {
        const breakfastIndex = i % selectedMeals.breakfast.length;
        const breakfastItem = {
            meal: selectedMeals.breakfast[breakfastIndex].name,
            calories: selectedMeals.breakfast[breakfastIndex].calories
        };
        mealPlan.breakfast.push(breakfastItem);

        const lunchIndex = i % selectedMeals.lunch.length;
        const lunchItem = {
            meal: selectedMeals.lunch[lunchIndex].name,
            calories: selectedMeals.lunch[lunchIndex].calories
        };
        mealPlan.lunch.push(lunchItem);

        const dinnerIndex = i % selectedMeals.dinner.length;
        const dinnerItem = {
            meal: selectedMeals.dinner[dinnerIndex].name,
            calories: selectedMeals.dinner[dinnerIndex].calories
        };
        mealPlan.dinner.push(dinnerItem);
    }

    const dailyCalories = mealPlan.breakfast.reduce((sum, item) => sum + item.calories, 0) +
                         mealPlan.lunch.reduce((sum, item) => sum + item.calories, 0) +
                         mealPlan.dinner.reduce((sum, item) => sum + item.calories, 0);

    if (dailyCalories > 0) {
        const adjustmentFactor = targetCalories / (dailyCalories / 7);
        mealPlan.breakfast.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
        mealPlan.lunch.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
        mealPlan.dinner.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
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
            diet.nutrition_notes = nutrition_notes;
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

        const dietGoal = (profile.goals && profile.goals.diet_goal) ? profile.goals.diet_goal : 'maintain';
        const bmrValue = diet.bmr || 2000;

        const mealPlan = generateMealPlan(
            dietGoal,
            bmrValue,
            { 
                breakfast: breakfast || [],
                lunch: lunch || [],
                dinner: dinner || [] 
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
        if (!diet) {
            return res.status(404).json({ message: 'Diet plan not found for this user' });
        }

        let shuffledMealPlan = JSON.parse(JSON.stringify(diet.meal_plans));

        if (type === "today") {
            const todayIndex = new Date().getDay() - 1;
            const swapIndex = Math.floor(Math.random() * 7);
            
            [shuffledMealPlan.breakfast[todayIndex], shuffledMealPlan.breakfast[swapIndex]] = 
            [shuffledMealPlan.breakfast[swapIndex], shuffledMealPlan.breakfast[todayIndex]];

            [shuffledMealPlan.lunch[todayIndex], shuffledMealPlan.lunch[swapIndex]] = 
            [shuffledMealPlan.lunch[swapIndex], shuffledMealPlan.lunch[todayIndex]];

            [shuffledMealPlan.dinner[todayIndex], shuffledMealPlan.dinner[swapIndex]] = 
            [shuffledMealPlan.dinner[swapIndex], shuffledMealPlan.dinner[todayIndex]];
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
                bmr: profile.metrics.bmr || 2000,
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
            breakfast: Object.entries(diet.food_calories.breakfast).map(([name, calories]) => ({
                name,
                calories
            })),
            lunch: Object.entries(diet.food_calories.lunch).map(([name, calories]) => ({
                name,
                calories
            })),
            dinner: Object.entries(diet.food_calories.dinner).map(([name, calories]) => ({
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