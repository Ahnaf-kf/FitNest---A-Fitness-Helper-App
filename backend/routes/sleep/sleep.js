const express = require('express');
const router = express.Router();
const Sleep = require('../../models/sleep');
const Profile = require('../../models/profile');

// Helper function to deduplicate entries by day (local time)
function deduplicateByDay(entries) {
    const map = new Map();
    for (const entry of entries) {
        const date = new Date(entry.date);
        date.setHours(0, 0, 0, 0);
        const key = date.toISOString().split('T')[0];
        // Always keep the latest entry for the day
        if (!map.has(key) || new Date(entry.date) > new Date(map.get(key).date)) {
            map.set(key, entry);
        }
    }
    return Array.from(map.values());
}

router.get('/weekly', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        //console.log('User ID:', user_id);
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

        //console.log('Date range:', { sevenDaysAgo, today });

        const sleepData = await Sleep.find({
            userId: user_id,
            date: {
                $gte: sevenDaysAgo,
                $lte: today
            }
        }).sort({ date: 1 });

        const uniqueSleepData = deduplicateByDay(sleepData).map(entry => {
            const date = new Date(entry.date);
            date.setHours(0, 0, 0, 0);
            // Format as MM/DD
            const mmdd = `${date.getMonth() + 1}/${date.getDate()}`;
            return {
                ...entry.toObject(),
                mmdd,
                ymd: date.toISOString().split('T')[0]
            };
        });

        // console.log('Found sleep entries:', uniqueSleepData.map(entry => ({
        //     date: entry.date,
        //     hours: entry.hours
        // })));

        res.json(uniqueSleepData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sleep data', error: error.message });
    }
});

// Add new sleep entry
router.post('/', async (req, res) => {
    try {
        const { user_id, date, hours, notes, quality } = req.body;
        
        //console.log('Received sleep entry request:', { user_id, date, hours, notes, quality });
        
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        if (!date || !hours) {
            return res.status(400).json({ message: 'Date and hours are required' });
        }

        // Normalize the date to local midnight
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        //console.log('Normalized date:', startOfDay);

        // Find and update or create new entry for the day (ignore time)
        const sleepEntry = await Sleep.findOneAndUpdate(
            { 
                userId: user_id,
                date: { $gte: startOfDay, $lt: endOfDay }
            },
            { 
                userId: user_id,
                date: startOfDay,
                hours: Number(hours),
                notes: notes || '',
                quality: quality || 3
            },
            { 
                new: true, 
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        //console.log('Created/Updated sleep entry:', sleepEntry);
        res.status(201).json(sleepEntry);
    } catch (error) {
        console.error('Error in sleep entry:', error);
        res.status(500).json({ 
            message: 'Error adding sleep entry', 
            error: error.message,
            details: error.stack 
        });
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
        const latestSleep = await Sleep.findOne({ userId: user_id })
            .sort({ date: -1 });

        //console.log('Latest sleep:', latestSleep);

        if (!latestSleep) {
            // If no sleep entry exists, create a new one with today's date
            const newSleep = new Sleep({
                userId: user_id,
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
        console.error('Error saving sleep notes:', error);
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

        const latestSleep = await Sleep.findOne({ userId: user_id })
            .sort({ date: -1 });

        res.json({ notes: latestSleep?.notes || '' });
    } catch (error) {
        console.error('Error fetching sleep notes:', error);
        res.status(500).json({ message: 'Error fetching sleep notes', error: error.message });
    }
});


// Get sleep statistics
router.get('/stats', async (req, res) => {
    try {
        const user_id = req.query.user_id;
        if (!user_id) {
            return res.status(401).json({ message: 'User ID is required' });
        }

        // Get date 30 days ago at local midnight
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // console.log('Date range:', { thirtyDaysAgo });

        const sleepData = await Sleep.find({
            userId: user_id,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: 1 });

        const uniqueSleepData = deduplicateByDay(sleepData);
        //console.log('Found sleep entries:', uniqueSleepData.length);

        // Get user's sleep goal from profile
        const profile = await Profile.findOne({ user_id: user_id });
        const sleepGoal = profile?.metrics?.sleep_hours ?? 8;

        // Calculate average sleep only if there are entries
        const avgSleep = uniqueSleepData.length > 0 
            ? uniqueSleepData.reduce((acc, curr) => acc + curr.hours, 0) / uniqueSleepData.length 
            : 0;

        const sleepStreak = calculateSleepStreak(uniqueSleepData);

        //console.log('Calculated stats:', { avgSleep, sleepStreak, totalEntries: uniqueSleepData.length });

        res.json({
            averageSleep: avgSleep,
            sleepStreak,
            totalEntries: uniqueSleepData.length,
            sleepGoal
        });
    } catch (error) {
        console.error('Error fetching sleep statistics:', error);
        res.status(500).json({ message: 'Error fetching sleep statistics', error: error.message });
    }
});

// Helper function to calculate sleep streak
function calculateSleepStreak(sleepData) {
    if (!sleepData.length) return 0;

    const uniqueSleepData = deduplicateByDay(sleepData);
    const dates = uniqueSleepData.map(entry => {
        const date = new Date(entry.date);
        date.setHours(0, 0, 0, 0);
        return date;
    }).sort((a, b) => a - b);

    if (dates.length === 0) return 0;

    // Get today's date at local midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if we have an entry for today
    const hasToday = dates.some(date => 
        date.getTime() === today.getTime()
    );

    if (!hasToday) return 0;

    let streak = 1;
    let currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - 1);

    while (true) {
        const hasEntry = dates.some(date => 
            date.getTime() === currentDate.getTime()
        );

        if (!hasEntry) break;

        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

module.exports = router; 