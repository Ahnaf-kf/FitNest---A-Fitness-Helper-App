const express = require('express');
const Cardio = require('../../models/cardio');
const router = express.Router();

// Helper function to check if dates are in same week
function isSameWeek(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(d1);
  const secondDate = new Date(d2);
  
  // Reset time components to avoid timezone issues
  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
  
  // Check if dates are in the same week
  if (diffDays >= 7) return false;
  
  // Find Sunday of the week for each date
  const sunday1 = new Date(firstDate);
  sunday1.setDate(firstDate.getDate() - firstDate.getDay());
  
  const sunday2 = new Date(secondDate);
  sunday2.setDate(secondDate.getDate() - secondDate.getDay());
  
  return sunday1.getTime() === sunday2.getTime();
}

// Helper function to create new cardio document with all required fields
function createNewCardioDocument(user_id, initialData = {}) {
  return new Cardio({
    user_id,
    daily_steps: initialData.daily_steps || [{ date: new Date(), steps: 0 }],
    cardio_goals: {
      goal_miles: initialData.goal_miles || 3,
      type_of_activity: initialData.type_of_activity || 'walking',
      weekly_goal: initialData.weekly_goal || 70000,
      current_week_steps: initialData.current_week_steps || 0,
      last_week_reset: initialData.last_week_reset || new Date()
    },
    cardio_timer: initialData.cardio_timer || 0,
    heart_points: initialData.heart_points || 0,
    weekly_rewards: {
      streak_count: initialData.streak_count || 0,
      last_reward_claimed: initialData.last_reward_claimed || null
    },
    date_created: new Date(),
    last_updated: new Date()
  });
}

// Updated track-steps endpoint with better input handling
router.put('/track-steps/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { daily_steps } = req.body;

  try {
    let cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      cardio = createNewCardioDocument(user_id);
    }

    // Reset weekly counter if new week
    if (!cardio.cardio_goals.last_week_reset || 
        !isSameWeek(new Date(), cardio.cardio_goals.last_week_reset)) {
      cardio.cardio_goals.current_week_steps = 0;
      cardio.cardio_goals.last_week_reset = new Date();
    }

    // Convert input to proper format with type safety
    let stepsToAdd = 0;
    if (typeof daily_steps === 'number') {
      stepsToAdd = Number(daily_steps) || 0;
    } else if (Array.isArray(daily_steps)) {
      stepsToAdd = daily_steps.reduce((sum, step) => sum + (Number(step) || 0, 0));
    } else if (daily_steps && typeof daily_steps === 'object' && 'steps' in daily_steps) {
      stepsToAdd = Number(daily_steps.steps) || 0;
    }

    // Add steps with current date
    cardio.daily_steps.push({ 
      date: new Date(), 
      steps: stepsToAdd 
    });
    
    // Ensure numeric addition
    cardio.cardio_goals.current_week_steps = Number(cardio.cardio_goals.current_week_steps || 0) + stepsToAdd;
    cardio.last_updated = new Date();

    await cardio.save();

    
    const Diet = require('../../models/diet');
    const caloriesBurned = stepsToAdd * 0.04;
    const today = new Date().toISOString().split('T')[0];
    
    let diet = await Diet.findOne({ user_id });
    if (!diet) {
      diet = new Diet({ user_id });
    }

    const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === today);
    if (existingBurnedEntry) {
      existingBurnedEntry.amount += caloriesBurned;
    } else {
      diet.calories.burned.push({
        date: today,
        amount: caloriesBurned
      });
    }

    diet.last_updated = new Date();
    await diet.save();

    res.status(200).json({ 
      message: 'Steps tracked successfully',
      stepsAdded: stepsToAdd,
      cardio 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error tracking steps', 
      error: err.message,
      receivedBody: req.body
    });
  }
});
// Updated set-goals endpoint with better validation
router.put('/set-goals/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { goal_miles, type_of_activity } = req.body;

  // Enhanced validation
  if (goal_miles === undefined || goal_miles === null || !type_of_activity) {
    return res.status(400).json({ 
      message: 'Missing required fields: goal_miles (number) and type_of_activity (string)',
      received: req.body
    });
  }

  try {
    let cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      // Create new cardio document with the provided goals
      cardio = createNewCardioDocument(user_id, {
        goal_miles: Number(goal_miles),
        type_of_activity
      });
    } else {
      // Update existing goals with type safety
      cardio.cardio_goals.goal_miles = Number(goal_miles);
      cardio.cardio_goals.type_of_activity = type_of_activity;
    }

    // Clean any invalid daily_steps entries
    cardio.daily_steps = cardio.daily_steps
      .map(entry => ({
        date: entry.date,
        steps: Number(entry.steps) || 0
      }))
      .filter(entry => !isNaN(entry.steps));

    cardio.last_updated = new Date();
    await cardio.save();
    
    res.status(200).json({ 
      message: 'Cardio goals set successfully', 
      cardio 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Error setting cardio goals', 
      error: err.message,
      receivedBody: req.body
    });
  }
});

// Rest of the endpoints remain unchanged
router.put('/track-timer/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { cardio_timer } = req.body;

  try {
    let cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      cardio = createNewCardioDocument(user_id);
    }

    cardio.cardio_timer = (cardio.cardio_timer || 0) + cardio_timer;
    cardio.heart_points = Math.floor(cardio.cardio_timer / 10);
    cardio.last_updated = new Date();

    await cardio.save();
    res.status(200).json({ message: 'Cardio timer tracked successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking cardio timer', error: err });
  }
});

router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    let cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      cardio = createNewCardioDocument(user_id);
      await cardio.save();
    }

    res.status(200).json({ cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cardio details', error: err });
  }
});

router.get('/weekly-progress/:user_id', async (req, res) => {
  try {
    let cardio = await Cardio.findOne({ user_id: req.params.user_id });
    if (!cardio) {
      cardio = createNewCardioDocument(req.params.user_id);
      await cardio.save();
    }

    const progress = {
      currentSteps: cardio.cardio_goals.current_week_steps,
      weeklyGoal: cardio.cardio_goals.weekly_goal || 70000,
      progressPercent: Math.min(
        (cardio.cardio_goals.current_week_steps / (cardio.cardio_goals.weekly_goal || 70000)) * 100, 
        100
      ),
      streak: cardio.weekly_rewards.streak_count || 0,
      daysRemaining: 7 - (new Date().getDay() || 7)
    };

    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching progress', error: err });
  }
});

router.post('/claim-reward/:user_id', async (req, res) => {
  try {
    let cardio = await Cardio.findOne({ user_id: req.params.user_id });
    if (!cardio) {
      cardio = createNewCardioDocument(req.params.user_id);
      await cardio.save();
    }

    if (cardio.cardio_goals.current_week_steps < (cardio.cardio_goals.weekly_goal || 70000)) {
      return res.status(400).json({ message: 'Weekly goal not reached' });
    }

    const lastClaimed = cardio.weekly_rewards.last_reward_claimed;
    if (lastClaimed && isSameWeek(new Date(), lastClaimed)) {
      return res.status(400).json({ message: 'Reward already claimed this week' });
    }

    cardio.weekly_rewards.streak_count = (cardio.weekly_rewards.streak_count || 0) + 1;
    cardio.weekly_rewards.last_reward_claimed = new Date();
    cardio.heart_points = (cardio.heart_points || 0) + 10;
    cardio.last_updated = new Date();
    
    await cardio.save();

    res.status(200).json({ 
      message: 'Reward claimed!', 
      streak: cardio.weekly_rewards.streak_count,
      heartPoints: cardio.heart_points 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error claiming reward', error: err });
  }
});

module.exports = router;