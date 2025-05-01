const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  week_number: { type: Number, default: 1 },  // Track the week number for progressive overload
  workout_plan: [{
    day: { type: String, enum: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'] },
    workout_type: { type: String, enum: ['push', 'pull', 'legs', 'arms', 'rest'], required: true },
    exercises: [{
      name: { type: String, required: true },
      category: { type: String, enum: ['compound', 'accessory', 'bodyweight'], required: true },
      sets: { type: Number, required: true },
      reps: { type: Number, required: true }
    }]
  }],
  progress: {
    completed_sets: { type: Number },
    feedback_notes: { type: String }
  },
  date_created: { type: Date, default: Date.now }
});

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;
