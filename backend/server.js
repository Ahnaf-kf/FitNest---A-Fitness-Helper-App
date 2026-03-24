const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

// Ensure Node uses public DNS servers that support SRV lookups (for mongodb+srv URIs)
dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.join(__dirname, 'models/fitmax.env') });

const mongoose = require('mongoose');
//const bodyParser = require('body-parser');
const cors = require('cors');

// Import routes with corrected paths
const signupRoutes = require('./routes/auth/signup');
const signinRoutes = require('./routes/auth/signin');
const verifyRoutes = require('./routes/auth/verify');
const profileRoutes = require('./routes/profile/profile');
const workoutRoutes = require('./routes/workouts/workouts');
const cardioRoutes = require('./routes/cardio/cardio');
const dietRoutes = require('./routes/diet/diet');
const sleepRoutes = require('./routes/sleep/sleep');
const customMealRoutes = require('./routes/custom_meals/custom_meal');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth/signup', signupRoutes);
app.use('/api/auth/signin', signinRoutes);
app.use('/api/auth/verify', verifyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/cardio', cardioRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/custom-meal', customMealRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Serve HTML pages
const pages = {
  '/': 'sign-in.html',
  '/sign-up': 'sign-up.html',
  '/dashboard': 'dashboard.html',
  '/profilesetup': 'profilesetup.html',
  '/diet_plan': 'diet_plan.html',
  '/mealplan': 'mealplan.html',
  //'/add_custom_meal.html': 'add_custom_meal.html',
  '/add_custom_meal': 'add_custom_meal.html',
  '/todayworkout': 'todaysworkout.html',
  '/updategoals': 'updategoals.html',
  '/workouts': 'workouts.html',
  '/cardio': 'cardio.html',
  '/logout': 'logout.html',
  '/sleep': 'sleep.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', file));
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

console.log('Mongo URI:', process.env.MONGO_URI);