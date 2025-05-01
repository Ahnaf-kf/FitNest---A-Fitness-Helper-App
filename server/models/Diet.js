const mongoose = require('mongoose');

// Define the schema for the Diet model
const dietSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meal_plans: { type: Object, required: true },
  calories: {
    consumed: { type: [Number], required: true },  // Array of numbers for daily consumed calories
    burned: { type: [Number], required: true }     // Array of numbers for daily burned calories
  },
  bmr: { type: Number, required: true },
  custom_meals: { type: Object },
  nutrition_notes: { type: [String] },
  last_updated: { type: Date, required: true }
});

// Create the Diet model
const Diet = mongoose.model('Diet', dietSchema);

module.exports = Diet;  // Ensure the Diet model is being correctly exported
