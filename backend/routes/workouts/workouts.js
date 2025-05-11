const express = require('express');
const Workout = require('../../models/workout');
const router = express.Router();

const generateWorkoutPlan = (fitness_level) => {
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

  const setsAndReps = {
    beginner: { sets: 3, reps: 10 },
    intermediate: { sets: 4, reps: 12 },
    advanced: { sets: 5, reps: 15 }
  };

  const workoutPlan = [];
  const restDays = fitness_level === 'beginner' ? 2 : 1;

  for (let i = 0; i < 7; i++) {
    const day = { 
      day: `Day ${i + 1}`, 
      exercises: [],
      completed: false,
      day_notes: '',
      date_completed: null
    };

    if (i % 2 === 0) {
      day.workout_type = 'push';
      day.exercises = [...exercises.push];
    } else if (i % 2 === 1) {
      day.workout_type = 'pull';
      day.exercises = [...exercises.pull];
    }

    if (i === 4) {
      day.workout_type = 'rest';
      day.exercises = [];
    } else if (i === 6) {
      day.workout_type = 'arms';
      day.exercises = [...exercises.arms];
    }

    day.exercises.forEach(exercise => {
      exercise.sets = setsAndReps[fitness_level].sets;
      exercise.reps = setsAndReps[fitness_level].reps;
      exercise.notes = '';
      exercise.completed = false;
    });

    workoutPlan.push(day);
  }

  return workoutPlan;
};

router.post('/', async (req, res) => {
  try {
    const { user_id, fitness_level } = req.body;
    
    if (!user_id || !fitness_level) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id and fitness_level'
      });
    }

    const workoutPlan = generateWorkoutPlan(fitness_level);
    const existingWorkout = await Workout.findOne({ user_id });

    if (existingWorkout) {
      existingWorkout.workout_plan = workoutPlan;
      existingWorkout.week_number += 1;
      existingWorkout.last_updated = Date.now();
      await existingWorkout.save();
      
      return res.status(200).json({ 
        success: true,
        message: 'Workout routine updated', 
        workout: existingWorkout 
      });
    }

    const newWorkout = new Workout({ 
      user_id, 
      workout_plan: workoutPlan 
    });
    await newWorkout.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Workout routine created', 
      workout: newWorkout 
    });
  } catch (err) {
    console.error('Error creating/updating workout:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while processing workout', 
      error: err.message 
    });
  }
});

router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const workout = await Workout.findOne({ user_id })
      .sort({ week_number: -1 })
      .limit(1);

    if (!workout) {
      return res.status(404).json({ 
        success: false,
        message: 'No workout routine found for this user' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      workout 
    });
  } catch (err) {
    console.error('Error fetching workout:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching workout', 
      error: err.message 
    });
  }
});

router.put('/update-notes/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const { day, day_notes, exercise_notes, mark_completed } = req.body;

    if (!day) {
      return res.status(400).json({
        success: false,
        message: 'Day is required'
      });
    }

    const workout = await Workout.findOne({ user_id })
      .sort({ week_number: -1 })
      .limit(1);

    if (!workout) {
      return res.status(404).json({ 
        success: false,
        message: 'Workout not found' 
      });
    }

    const dayIndex = workout.workout_plan.findIndex(d => d.day === day);
    if (dayIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Day not found in workout plan' 
      });
    }

    if (day_notes !== undefined) {
      workout.workout_plan[dayIndex].day_notes = day_notes;
    }

    if (exercise_notes) {
      workout.workout_plan[dayIndex].exercises.forEach(exercise => {
        if (exercise_notes[exercise.name]) {
          exercise.notes = exercise_notes[exercise.name].notes || '';
          exercise.completed = exercise_notes[exercise.name].completed || false;
        }
      });
    }

    if (mark_completed) {
      workout.workout_plan[dayIndex].completed = true;
      workout.workout_plan[dayIndex].date_completed = new Date();
      
      workout.progress.completed_sets += workout.workout_plan[dayIndex].exercises
        .filter(ex => ex.completed)
        .reduce((sum, ex) => sum + ex.sets, 0);
    }

    workout.last_updated = new Date();
    await workout.save();

    res.status(200).json({ 
      success: true,
      message: 'Workout updated successfully',
      workout 
    });
  } catch (err) {
    console.error('Error updating workout notes:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating workout', 
      error: err.message 
    });
  }
});

router.get('/progress/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const workout = await Workout.findOne({ user_id })
      .sort({ week_number: -1 })
      .limit(1);

    if (!workout) {
      return res.status(404).json({ 
        success: false,
        message: 'No workout found for this user' 
      });
    }

    const completedDays = workout.workout_plan.filter(day => day.completed).length;
    const totalDays = workout.workout_plan.length - workout.workout_plan.filter(day => day.workout_type === 'rest').length;
    const completionPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    res.status(200).json({
      success: true,
      progress: {
        completed_days: completedDays,
        total_days: totalDays,
        completion_percentage: completionPercentage,
        completed_sets: workout.progress.completed_sets,
        last_updated: workout.last_updated
      }
    });
  } catch (err) {
    console.error('Error fetching workout progress:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching progress', 
      error: err.message 
    });
  }
});

module.exports = router;