const express = require('express');
const Cardio = require('../../models/cardio');  // Import Cardio model

const router = express.Router();

// API 1: Track daily steps (manual input)
router.put('/track-steps/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { daily_steps } = req.body;  // Manual input for daily steps

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }

    cardio.daily_steps = daily_steps;
    await cardio.save();

    res.status(200).json({ message: 'Daily steps tracked successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking daily steps', error: err });
  }
});

// API 2: Set or update cardio goals (miles and activity type)
router.put('/set-goals/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { goal_miles, type_of_activity } = req.body;

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }

    cardio.cardio_goals.goal_miles = goal_miles;
    cardio.cardio_goals.type_of_activity = type_of_activity;

    await cardio.save();

    res.status(200).json({ message: 'Cardio goals set successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error setting cardio goals', error: err });
  }
});

// API 3: Track timer for walking/running sessions (in minutes)
router.put('/track-timer/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { cardio_timer } = req.body;  // Timer in minutes

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }

    cardio.cardio_timer = cardio_timer;

    // Award heart points (1 heart point per 10 minutes of activity)
    cardio.heart_points = Math.floor(cardio_timer / 10);

    await cardio.save();

    res.status(200).json({ message: 'Cardio timer tracked successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking cardio timer', error: err });
  }
});

// API 4: Get cardio details for a specific user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }
    res.status(200).json({ cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cardio details', error: err });
  }
});

module.exports = router;
