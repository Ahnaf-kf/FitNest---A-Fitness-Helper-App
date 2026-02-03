const mongoose = require('mongoose');

const customMealSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foods: [
    {
      name: String,
      grams: Number,
      calories: Number
    }
  ],
  note: String,
  totalCalories: Number,
  date: { type: Date, default: Date.now }
});

const CustomMeal = mongoose.model('CustomMeal', customMealSchema);

module.exports = CustomMeal; 