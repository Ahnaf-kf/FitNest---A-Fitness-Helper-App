const express = require('express');
const Profile = require('../models/profile');  // Import Profile model
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
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    // Check if today is the user's birthday
    const today = moment().format('MM-DD');
    const birthday = moment(profile.birthday).format('MM-DD');
    if (today === birthday) {
      profile.motivational_message = `Happy Birthday, ${profile.fitness_goals.goal}! Keep achieving your goals! 🎉`;
    }

    res.status(200).json({ profile });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err });
  }
});

// API 3: Track progress (workouts, cardio, calories burned)
router.put('/track-progress/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { workouts_completed, cardio_goals_completed, calories_burned } = req.body;

  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    profile.progress.workouts_completed += workouts_completed;
    profile.progress.cardio_goals_completed += cardio_goals_completed;
    profile.progress.calories_burned += calories_burned;

    await profile.save();
    res.status(200).json({ message: 'Progress tracked successfully', profile });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking progress', error: err });
  }
});

// API 4: Edit/Update Fitness Goals (Fitness Level, Goal)
router.put('/update-goals/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { fitness_level, goal } = req.body;

  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    profile.fitness_goals.fitness_level = fitness_level;
    profile.fitness_goals.goal = goal;

    await profile.save();
    res.status(200).json({ message: 'Fitness goals updated successfully', profile });
  } catch (err) {
    res.status(500).json({ message: 'Error updating fitness goals', error: err });
  }
});

// API 5: Get Progress Graph (Workouts, Cardio Goals, Calories Burned)
router.get('/progress-graph/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found for this user' });
    }

    const progressData = {
      workouts_completed: profile.progress.workouts_completed,
      cardio_goals_completed: profile.progress.cardio_goals_completed,
      calories_burned: profile.progress.calories_burned
    };

    res.status(200).json({ progressData });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching progress graph data', error: err });
  }
});

module.exports = router;
