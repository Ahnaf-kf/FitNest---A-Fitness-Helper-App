const mongoose = require('mongoose');

const burntCalDataSchema = new mongoose.Schema({
  // We store date without time information by setting hours to 0
  date: { type: Date, required: true, unique: true },
  calories: { type: Number, default: 0 }
});

module.exports = mongoose.model('TrackCal_burnt', burntCalDataSchema);