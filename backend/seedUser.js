const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const User = require('./models/user');
const Profile = require('./models/profile');
const Cardio = require('./models/cardio');
const Diet = require('./models/diet');

mongoose.connect('mongodb://localhost:27017/fitmaxdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Maintenance calorie calculation
const calculateMaintenanceCalories = (weight, height, age, gender, activityLevel) => {
  let bmr;

  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  let maintenanceCalories;

  switch (activityLevel) {
    case 'sedentary':
      maintenanceCalories = bmr * 1.2;
      break;
    case 'light':
      maintenanceCalories = bmr * 1.375;
      break;
    case 'moderate':
      maintenanceCalories = bmr * 1.55;
      break;
    case 'active':
      maintenanceCalories = bmr * 1.725;
      break;
    case 'super':
      maintenanceCalories = bmr * 1.9;
      break;
    default:
      maintenanceCalories = bmr * 1.2;  // default
  }

  return maintenanceCalories;
};

// Helper function to generate food calories as a Map (Updated with all necessary food items)
const generateFoodCalories = () => {
  const foodCalories = {
    breakfast: {
      "Egg": 70,
      "Oatmeal (1 cup)": 154,
      "Banana (1 medium)": 105,
      "Avocado (1 medium)": 240,
      "Whole Wheat Toast (1 slice)": 70,
      "Greek Yogurt (1 cup, plain)": 100,
      "Smoothie (1 cup)": 150,
      "Cottage Cheese (1/2 cup)": 110,
      "Chia Seeds (1 tbsp)": 58
    },
    lunch: {
      "Chicken Breast (100g)": 165,
      "Brown Rice (1 cup cooked)": 215,
      "Sweet Potato (100g)": 86,
      "Broccoli (100g)": 35,
      "Salmon (100g)": 206,
      "Quinoa (1 cup cooked)": 222,
      "Mixed Greens Salad (1 cup)": 7,
      "Hummus (2 tbsp)": 70,
      "Avocado (1 medium)": 240
    },
    dinner: {
      "Grilled Chicken (100g)": 165,
      "Roasted Vegetables (1 cup)": 120,
      "Spaghetti (whole wheat, 1 cup cooked)": 174,
      "Tofu (100g)": 144,
      "Steak (lean, 100g)": 242,
      "Brown Rice (1 cup cooked)": 215,
      "Asparagus (100g)": 20,
      "Cauliflower (100g)": 25,
      "Lentils (1/2 cup cooked)": 115
    }
  };
  return foodCalories;
};

// Helper function to generate monthly calories (burned and gained) for 30 days
const generateMonthlyCalories = () => {
  const burnedCalories = [];
  const consumedCalories = [];

  // Generate calories for 30 days (1 month)
  for (let i = 0; i < 30; i++) {
    const date = moment().subtract(i, 'days').toDate();
    burnedCalories.push({ date: date, amount: Math.floor(Math.random() * 500) + 300 });
    consumedCalories.push({ date: date, amount: Math.floor(Math.random() * 500) + 300 });
  }

  return { burned: burnedCalories, consumed: consumedCalories };
};

// Function to populate an existing user's profile, cardio, and diet
const populateExistingUserData = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    console.log("User not found with this email.");
    return;
  }

  // Calculate Maintenance Calories based on profile data
  const { weight, height, age, gender, activityLevel } = {
    weight: 70,     // kg
    height: 175,    // cm
    age: 28,        // years
    gender: 'male', // example: 'male' or 'female'
    activityLevel: 'moderate' // example: 'sedentary', 'light', 'moderate', etc.
  };

  const maintenanceCalories = calculateMaintenanceCalories(weight, height, age, gender, activityLevel);

  // Create or Update Profile data
  const profileData = {
    user_id: user._id,
    metrics: {
      height: 175,  // cm
      weight: 70,   // kg
      bmi: 22.8,
      bmr: 1500,
      heart_rate: 75,
      sleep_hours: 7,
      maintenance_calories: maintenanceCalories,  // Adding maintenance calories here
    },
    fitness_goals: {
      goal: 'maintain fitness',
      fitness_level: 'intermediate'
    },
    progress: {
      workouts_completed: 10,
      cardio_goals_completed: 8,
      calories_burned: 5000
    },
    daily_summary: generateDailySummary(),
    birthday: new Date(1995, 5, 15),  // Example birthday: June 15, 1995
    motivational_message: 'Keep pushing your limits!',
    last_updated: new Date()
  };

  const existingProfile = await Profile.findOne({ user_id: user._id });
  if (existingProfile) {
    existingProfile.set(profileData);
    await existingProfile.save({ new: true, versionKey: false });
    console.log("Profile updated successfully.");
  } else {
    const profile = new Profile(profileData);
    await profile.save();
    console.log("Profile created successfully.");
  }

  // Create or Update Cardio data
  const cardioData = {
    user_id: user._id,
    daily_steps: generateDailySteps(),
    cardio_goals: { goal_miles: 20, type_of_activity: 'jogging' },
    cardio_timer: 30,
    heart_points: 30,
    date_created: new Date(),
    last_updated: new Date()
  };

  const existingCardio = await Cardio.findOne({ user_id: user._id });
  if (existingCardio) {
    existingCardio.set(cardioData);
    await existingCardio.save();
    console.log("Cardio data updated successfully.");
  } else {
    const cardio = new Cardio(cardioData);
    await cardio.save();
    console.log("Cardio data created successfully.");
  }

  // Create or Update Diet data
  const dietData = {
    user_id: user._id,
    meal_plans: generateMealPlans(),
    calories: generateMonthlyCalories(), // Updated to generate calories for a month
    bmr: 1500,
    custom_meals: {},
    nutrition_notes: ['Need to eat more vegetables'],
    last_updated: new Date(),
    food_calories: generateFoodCalories()  // Ensure food_calories is being correctly assigned here
  };

  const existingDiet = await Diet.findOne({ user_id: user._id });
  if (existingDiet) {
    existingDiet.set(dietData);
    await existingDiet.save();
    console.log("Diet data updated successfully.");
  } else {
    const diet = new Diet(dietData);
    await diet.save();
    console.log("Diet data created successfully.");
  }

  console.log('Data for the existing user populated successfully.');
};

// Helper function to generate daily summary for 30 days
const generateDailySummary = () => {
  const dailySummary = [];
  for (let i = 0; i < 30; i++) { // 30 days (1 month)
    const date = moment().subtract(i, 'days').toDate();
    dailySummary.push({
      date: date,
      calories_burned: 200 + Math.floor(Math.random() * 300),
      calories_gained: 500 + Math.floor(Math.random() * 200),
      steps: 5000 + Math.floor(Math.random() * 5000)
    });
  }
  return dailySummary;
};

// Helper function to generate daily steps data (array of numbers)
const generateDailySteps = () => {
  const steps = [];
  for (let i = 0; i < 30; i++) { // 30 days (1 month)
    steps.push(5000 + Math.floor(Math.random() * 5000));
  }
  return steps;
};

// Helper function to generate meal plans (updated)
const generateMealPlans = () => {
  const meals = {
    breakfast: [
      { name: 'Oats', calories: 150 },
      { name: 'Egg', calories: 70 },
      { name: 'Greek Yogurt', calories: 100 }
    ],
    lunch: [
      { name: 'Grilled Chicken Salad', calories: 350 },
      { name: 'Brown Rice', calories: 215 },
      { name: 'Steamed Fish with Veggies', calories: 400 }
    ],
    dinner: [
      { name: 'Steamed Fish with Veggies', calories: 400 },
      { name: 'Grilled Chicken', calories: 165 },
      { name: 'Tofu Stir Fry', calories: 250 }
    ]
  };
  return meals;
};

// Run the script to populate data for an existing user
populateExistingUserData("johndoe@ex.com").catch((err) => console.log('Error:', err));
