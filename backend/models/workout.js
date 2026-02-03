const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week_number: { type: Number, default: 1 },
  workout_plan: [{
    day: { type: String, enum: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'] },
    workout_type: { type: String, enum: ['push', 'pull', 'legs', 'arms', 'rest'], required: true },
    completed: { type: Boolean, default: false },
    day_notes: { type: String, default: '' },
    exercises: [{
      name: { type: String, required: true },
      category: { type: String, enum: ['compound', 'accessory', 'bodyweight'], required: true },
      sets: { type: Number, required: true },
      reps: { type: Number, required: true },
      notes: { type: String, default: '' },
      completed: { type: Boolean, default: false }
    }],
    date_completed: { type: Date }
  }],
  progress: {
    completed_sets: { type: Number, default: 0 },
    feedback_notes: { type: String, default: '' }
  },
  date_created: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
});

// Add index for better query performance
workoutSchema.index({ user_id: 1, week_number: 1 });

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;