const express = require('express');
const Profile = require('../../models/profile');  // Import Profile model
const moment = require('moment');  // To check if today is user's birthday

const router = express.Router();

// API 1: Create or Update Profile (includes user metrics and fitness goals)
router.post('/', async (req, res) => {
  const { user_id, metrics, fitness_goals } = req.body;

  try {
    const existingProfile = await Profile.findOne({ user_id });

    if (existingProfile) {
      // Update existing profile
      existingProfile.metrics = metrics;
      existingProfile.fitness_goals = fitness_goals;
      await existingProfile.save();
      return res.status(200).json({ message: 'Profile updated', profile: existingProfile });
    }

    // Create a new profile
    const newProfile = new Profile({ user_id, metrics, fitness_goals });
    await newProfile.save();
    res.status(201).json({ message: 'Profile created', profile: newProfile });
  } catch (err) {
    res.status(500).json({ message: 'Error creating/updating profile', error: err });
  }
});

// API 2: Get Profile for a specific user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    let profile = await Profile.findOne({ user_id });
    if (!profile) {
      // Create a basic profile if it doesn't exist
      profile = new Profile({
        user_id,
        metrics: {
          height: 170, // default values
          weight: 70,
          bmi: 24.2,
          bmr: 1600,
          maintenance_calories: 2000,
          heart_rate: null,
          sleep_hours: null
        },
        fitness_goals: {
          goal: 'maintain fitness',
          fitness_level: 'intermediate'
        },
        progress: {
          workouts_completed: 0,
          cardio_goals_completed: 0,
          calories_burned: 0
        },
        daily_summary: [],
        birthday: null,
        motivational_message: 'Keep pushing your limits!',
        last_updated: new Date()
      });
      await profile.save();
    }

    // Check if today is the user's birthday
    if (profile.birthday) {
      const today = moment().format('MM-DD');
      const birthday = moment(profile.birthday).format('MM-DD');
      if (today === birthday) {
        profile.motivational_message = `Happy Birthday, ${profile.fitness_goals.goal}! Keep achieving your goals! 🎉`;
      }
    }

    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err });
  }
});

// API 3: Update fitness goals (metrics, goal, calories)
router.put('/update-goals/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { weight, bmi, bmr, workoutGoal, maintenanceCalories, heart_rate, sleep_hours } = req.body;

  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    // Update the profile with new fitness goals and metrics
    if (workoutGoal) {
      profile.fitness_goals.goal = workoutGoal;
    }
    
    // Update metrics
    if (weight) profile.metrics.weight = weight;
    if (bmi) profile.metrics.bmi = bmi;
    if (bmr) profile.metrics.bmr = bmr;
    if (maintenanceCalories) profile.metrics.maintenance_calories = maintenanceCalories;
    if (heart_rate) profile.metrics.heart_rate = heart_rate;
    if (sleep_hours) profile.metrics.sleep_hours = sleep_hours;

    profile.last_updated = Date.now();
    await profile.save();

    res.status(200).json({ 
      success: true,
      message: 'Fitness goals updated successfully', 
      profile 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating fitness goals', 
      error: err.message 
    });
  }
});

// API 4: Add calories consumed for today
router.post('/add-calories/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { calories } = req.body;

  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    // Find today's entry or create one
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayEntry = profile.daily_summary.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (!todayEntry) {
      // Create new entry for today
      todayEntry = {
        date: today,
        calories_burned: 0,
        calories_gained: calories,
        steps: 0,
        workout_completed: false
      };
      profile.daily_summary.push(todayEntry);
    } else {
      // Update existing entry
      todayEntry.calories_gained += calories;
    }

    profile.last_updated = Date.now();
    await profile.save();

    res.status(200).json({ 
      success: true,
      message: 'Calories added successfully', 
      todayCalories: todayEntry.calories_gained
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: 'Error adding calories', 
      error: err.message 
    });
  }
});

module.exports = router;
