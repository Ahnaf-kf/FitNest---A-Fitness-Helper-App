const express = require('express');
const Workout = require('../../models/workout');  // Import Workout model

const router = express.Router();

// Helper function to generate workout routines based on fitness level
const generateWorkoutPlan = (fitness_level) => {
  // Define exercises for each day of the workout plan
  const exercises = {
    push: [
      { name: 'Incline Barbell Bench Press', category: 'compound' },
      { name: 'Dumbbell Bench Press', category: 'compound' },
      { name: 'Dips (Negatives if Needed)', category: 'bodyweight' },
      { name: 'Dumbbell Fly', category: 'accessory' },
      { name: 'Cable Fly', category: 'accessory' }
    ],
    pull: [
      { name: 'Deadlifts', category: 'compound' },
      { name: 'Barbell Rows', category: 'compound' },
      { name: 'T-Bar Rows', category: 'compound' },
      { name: 'Lat Pulldowns', category: 'accessory' }
    ],
    legs: [
      { name: 'Squats', category: 'compound' },
      { name: 'Leg Press', category: 'compound' },
      { name: 'Leg Extensions', category: 'accessory' },
      { name: 'Leg Curls', category: 'accessory' },
      { name: 'Seated Calf Raises', category: 'accessory' }
    ],
    arms: [
      { name: 'Dumbbell Lateral Raises', category: 'accessory' },
      { name: 'Dumbbell Rear Delt Raises', category: 'accessory' },
      { name: 'Barbell Curls', category: 'compound' },
      { name: 'Tricep Pushdowns', category: 'accessory' },
      { name: 'Forearm Curls', category: 'accessory' }
    ]
  };

  // Define sets and reps for different fitness levels
  const setsAndReps = {
    beginner: { sets: 3, reps: 10 },
    intermediate: { sets: 4, reps: 12 },
    advanced: { sets: 5, reps: 15 }
  };

  const workoutPlan = [];
  const restDays = fitness_level === 'beginner' ? 2 : 1; // Beginner has 2 rest days, others have 1

  // Generate workout plan (alternating push, pull, legs, arms with rest days)
  for (let i = 0; i < 7; i++) {
    const day = { day: `Day ${i + 1}`, exercises: [] };

    if (i % 2 === 0) {
      day.workout_type = 'push';
      day.exercises = exercises.push;
    } else if (i % 2 === 1) {
      day.workout_type = 'pull';
      day.exercises = exercises.pull;
    }

    if (i === 4) { // Rest day after legs (Day 5)
      day.workout_type = 'rest';
    } else if (i === 6) { // Arm day after rest
      day.workout_type = 'arms';
      day.exercises = exercises.arms;
    }

    // Apply sets and reps based on fitness level
    day.exercises.forEach(exercise => {
      exercise.sets = setsAndReps[fitness_level].sets;
      exercise.reps = setsAndReps[fitness_level].reps;
    });

    workoutPlan.push(day);
  }

  return workoutPlan;
};

// API: Create or update workout routine with rest days and sets/reps based on fitness level
router.post('/', async (req, res) => {
  const { user_id, fitness_level } = req.body;  // User ID and fitness level

  try {
    const workoutPlan = generateWorkoutPlan(fitness_level);  // Generate workout plan based on fitness level

    // Check if a workout already exists for the user
    const existingWorkout = await Workout.findOne({ user_id });
    if (existingWorkout) {
      existingWorkout.workout_plan = workoutPlan;
      existingWorkout.week_number += 1; // Increment the week number
      await existingWorkout.save();
      return res.status(200).json({ message: 'Workout routine updated', workout: existingWorkout });
    }

    // Create new workout plan
    const newWorkout = new Workout({ user_id, workout_plan: workoutPlan });
    await newWorkout.save();
    res.status(201).json({ message: 'Workout routine created', workout: newWorkout });
  } catch (err) {
    res.status(500).json({ message: 'Error creating/updating workout', error: err });
  }
});

// API: Get workout routine for a specific user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const workout = await Workout.findOne({ user_id });
    if (!workout) {
      return res.status(404).json({ message: 'No workout routine found for this user' });
    }
    res.status(200).json({ workout });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching workout routine', error: err });
  }
});

module.exports = router;
