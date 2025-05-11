const mongoose = require('mongoose');

const sleepSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    notes: {
        type: String,
        default: ''
    },
    quality: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    }
}, {
    timestamps: true
});

// Create compound index for user_id and date to ensure unique sleep entries per day
sleepSchema.index({ user_id: 1, date: 1 }, { unique: true });

const Sleep = mongoose.model('Sleep', sleepSchema);

module.exports = Sleep;
