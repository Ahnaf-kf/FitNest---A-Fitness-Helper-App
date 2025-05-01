

const mongoose = require('mongoose');

// Define the Cardio Schema
const cardioSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  daily_steps: { type: [Number], default: [] },  // Changed to array of numbers
  cardio_goals: {
    goal_miles: { type: Number, required: true },
    type_of_activity: { type: String, enum: ['walking', 'jogging', 'running'], required: true }
  },
  cardio_timer: { type: Number, default: 0 },
  heart_points: { type: Number, default: 0 },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

const Cardio = mongoose.model('Cardio', cardioSchema);

module.exports = Cardio;
