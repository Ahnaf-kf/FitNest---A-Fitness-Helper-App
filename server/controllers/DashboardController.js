const Dashboard = require('../models/Dashboard');

// GET: Retrieve last 7 days of fitness data (including today)
exports.getLast7DaysData = async (req, res) => {
  try {
    // Set today's date at midnight
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the date 6 days ago (to cover 7 days including today)
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 6);

    // Find entries between pastDate and today (inclusive), sorted by date ascending
    const data = await Dashboard.find({
      date: { $gte: pastDate, $lte: today }
    }).sort({ date: 1 });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching calorie data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST: Update today’s calories (increment the current value)
exports.updateTodayCalories = async (req, res) => {
  try {
    const { calories } = req.body;
    if (typeof calories !== 'number') {
      return res.status(400).json({ message: 'Invalid calories value' });
    }
    
    // Set today's date to midnight for consistent comparison
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create today's entry
    let entry = await Dashboard.findOne({ date: today });
    if (!entry) {
      // If no entry exists, create one with 0 calories initially
      entry = new Dashboard({ date: today, calories: 0 });
    }
    
    // Increment the calories by the value received from the frontend
    entry.calories += calories;
    await entry.save();
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating today\'s calories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Optional: POST: Create a new entry for today (if it doesn't exist)
exports.createTodayEntry = async (req, res) => {
  try {
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let entry = await TrackCal_burnt.findOne({ date: today });
    if (entry) {
      return res.json({ message: 'Entry already exists for today', entry });
    }
    
    entry = new Dashboard({ date: today, calories: 0 });
    await entry.save();
    
    res.json(entry);
  } catch (error) {
    console.error('Error creating today\'s entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
