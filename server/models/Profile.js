// backend/models/profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // User metrics (height, weight, BMI, BMR, etc.)
  metrics: {
    height: { type: Number, required: true },  // cm
    weight: { type: Number, required: true },  // kg
    bmi: { type: Number, required: true },
    bmr: { type: Number, required: true },  // Basal Metabolic Rate
    heart_rate: { type: Number },
    sleep_hours: { type: Number }  // Hours of sleep per day
  },
  // Fitness goals (Lose weight, Gain muscle, Maintain fitness)
  fitness_goals: {
    goal: { type: String, enum: ['gain muscle', 'lose weight', 'maintain fitness'], required: true },
    fitness_level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true }
  },
  // Progress tracking
  progress: {
    workouts_completed: { type: Number, default: 0 },
    cardio_goals_completed: { type: Number, default: 0 },
    calories_burned: { type: Number, default: 0 }
  },
  // Daily summary data across weeks
  daily_summary: [
    {
      date: { type: Date, required: true },
      calories_burned: { type: Number, default: 0 },
      calories_gained: { type: Number, default: 0 },
      steps: { type: Number, default: 0 }
    }
  ],
  // Birthday and motivational message
  birthday: { type: Date },
  motivational_message: { type: String, default: 'Keep pushing your limits!' },
  last_updated: { type: Date, default: Date.now },
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
