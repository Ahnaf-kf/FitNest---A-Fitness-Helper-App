const mongoose = require('mongoose');

// Updated cardio schema (models/cardio.js)
const cardioSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  daily_steps: [{
    date: { type: Date, default: Date.now },
    steps: { type: Number } // Removed required: true to allow partial updates
  }],
  cardio_goals: {
    goal_miles: { type: Number, default: 3 },
    type_of_activity: { type: String, enum: ['walking', 'jogging', 'running'], default: 'walking' },
    weekly_goal: { type: Number, default: 70000 },
    current_week_steps: { type: Number, default: 0 },
    last_week_reset: { type: Date }
  },
  cardio_timer: { type: Number, default: 0 },
  heart_points: { type: Number, default: 0 },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  weekly_rewards: {
    streak_count: { type: Number, default: 0 },
    last_reward_claimed: { type: Date }
  }
});

const Cardio = mongoose.model('Cardio', cardioSchema);

module.exports = Cardio;
