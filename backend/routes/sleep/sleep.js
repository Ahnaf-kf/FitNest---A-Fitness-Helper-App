const express = require('express');
const router = express.Router();
const Sleep = require('../../models/sleep');
const Profile = require('../../models/profile');

// Get sleep data for the last 7 days
router.get('/weekly', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get date 7 days ago at midnight
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today

        console.log('Date range:', { sevenDaysAgo, today }); // Debug log

        const sleepData = await Sleep.find({
            user_id: user_id,
            date: {
                $gte: sevenDaysAgo,
                $lte: today
            }
        }).sort({ date: 1 });

        // Debug log
        console.log('Found sleep entries:', sleepData.map(entry => ({
            date: entry.date,
            hours: entry.hours
        })));

        res.json(sleepData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
    }
});

// Add new sleep entry
router.post('/', async (req, res) => {
    try {
        const { user_id, date, hours, notes, quality } = req.body;
        
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        // Normalize the date to midnight
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Check if entry already exists for this date
        const existingEntry = await Sleep.findOne({
            user_id: user_id,
            date: {
                $gte: normalizedDate,
                $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingEntry) {
            return res.status(400).json({ message: 'Sleep entry already exists for this date' });
        }

        const sleepEntry = new Sleep({
            user_id: user_id,
            date: normalizedDate,
            hours,
            notes,
            quality
        });

        await sleepEntry.save();
        res.status(201).json(sleepEntry);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Sleep entry already exists for this date' });
        } else {
            res.status(500).json({ message: 'Error adding sleep entry', error: error.message });
        }
    }
});

// Save sleep notes
router.post('/notes', async (req, res) => {
    try {
        const { user_id, notes } = req.body;
        
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        // Find the most recent sleep entry for this user
        const latestSleep = await Sleep.findOne({ user_id: user_id })
            .sort({ date: -1 });

        if (!latestSleep) {
            // If no sleep entry exists, create a new one with today's date
            const newSleep = new Sleep({
                user_id: user_id,
                date: new Date(),
                hours: 0,
                notes,
                quality: 3
            });
            await newSleep.save();
            return res.status(201).json(newSleep);
        }

        // Update the notes of the most recent entry
        latestSleep.notes = notes;
        await latestSleep.save();
        
        res.json(latestSleep);
    } catch (error) {
        res.status(500).json({ message: 'Error saving sleep notes', error: error.message });
    }
});

// Get sleep notes
router.get('/notes', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        const latestSleep = await Sleep.findOne({ user_id: user_id })
            .sort({ date: -1 });

        res.json({ notes: latestSleep?.notes || '' });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sleep notes', error: error.message });
    }
});

// Update sleep entry
router.put('/:id', async (req, res) => {
    try {
        const { user_id, hours, notes, quality } = req.body;
        
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        const sleepEntry = await Sleep.findOneAndUpdate(
            { _id: req.params.id, user_id: user_id },
            { hours, notes, quality },
            { new: true }
        );

        if (!sleepEntry) {
            return res.status(404).json({ message: 'Sleep entry not found' });
        }

        res.json(sleepEntry);
    } catch (error) {
        res.status(500).json({ message: 'Error updating sleep entry', error: error.message });
    }
});

// Delete sleep entry
router.delete('/:id', async (req, res) => {
    try {
        const { user_id } = req.query;
        
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        const sleepEntry = await Sleep.findOneAndDelete({
            _id: req.params.id,
            user_id: user_id
        });

        if (!sleepEntry) {
            return res.status(404).json({ message: 'Sleep entry not found' });
        }

        res.json({ message: 'Sleep entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting sleep entry', error: error.message });
    }
});

// Get sleep statistics
router.get('/stats', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sleepData = await Sleep.find({
            user_id: user_id,
            date: { $gte: thirtyDaysAgo }
        });

        // Get user's sleep goal from profile
        const profile = await Profile.findOne({ user_id: user_id });
        const sleepGoal = profile?.metrics?.sleep_hours || 8; // Default to 8 hours if not set

        const avgSleep = sleepData.reduce((acc, curr) => acc + curr.hours, 0) / sleepData.length || 0;
        const sleepStreak = calculateSleepStreak(sleepData);

        res.json({
            averageSleep: avgSleep,
            sleepStreak,
            totalEntries: sleepData.length,
            sleepGoal
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sleep statistics', error: error.message });
    }
});

// Helper function to calculate sleep streak
function calculateSleepStreak(sleepData) {
    if (!sleepData.length) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = today;

    while (true) {
        const entry = sleepData.find(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() === currentDate.getTime();
        });

        if (!entry) break;

        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

module.exports = router; 