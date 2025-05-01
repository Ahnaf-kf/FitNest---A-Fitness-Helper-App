const express = require('express');
const router = express.Router();
const TCBController = require('../controllers/TrackCal_burntController');

// Route to get the last 7 days of fitness data
router.get('/last7days', TCBController.getLast7DaysData);

// Route to update today's calories (increment)
router.post('/update', TCBController.updateTodayCalories);

// Optional route to create a new entry for today (if needed)
router.post('/create', TCBController.createTodayEntry);

module.exports = router;
