const mongoose = require('mongoose');

const dietSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meal_plans: { type: Object, required: true },
  calories: {
    consumed: [{ date: Date, amount: Number }],
    burned: [{ date: Date, amount: Number }]
  },
  bmr: { type: Number, required: true },
  custom_meals: { type: Object },
  nutrition_notes: { type: [String] },
  food_calories: {
    breakfast: {
      "Egg": { type: Number, default: 78 },
      "Oatmeal (1 cup)": { type: Number, default: 154 },
      "Banana (1 medium)": { type: Number, default: 105 },
      "Avocado (1 medium)": { type: Number, default: 240 },
      "Whole Wheat Toast (1 slice)": { type: Number, default: 70 },
      "Greek Yogurt (1 cup, plain)": { type: Number, default: 100 },
      "Smoothie (1 cup)": { type: Number, default: 200 },
      "Cottage Cheese (1/2 cup)": { type: Number, default: 120 },
      "Chia Seeds (1 tbsp)": { type: Number, default: 60 }
    },
    lunch: {
      "Chicken Breast (100g)": { type: Number, default: 165 },
      "Brown Rice (1 cup cooked)": { type: Number, default: 215 },
      "Sweet Potato (100g)": { type: Number, default: 94 },
      "Broccoli (100g)": { type: Number, default: 35 },
      "Salmon (100g)": { type: Number, default: 206 },
      "Quinoa (1 cup cooked)": { type: Number, default: 222 },
      "Mixed Greens Salad (1 cup)": { type: Number, default: 50 },
      "Hummus (2 tbsp)": { type: Number, default: 70 },
      "Avocado (1 medium)": { type: Number, default: 240 }
    },
    dinner: {
      "Grilled Chicken (100g)": { type: Number, default: 165 },
      "Roasted Vegetables (1 cup)": { type: Number, default: 120 },
      "Spaghetti (whole wheat, 1 cup cooked)": { type: Number, default: 174 },
      "Tofu (100g)": { type: Number, default: 144 },
      "Steak (lean, 100g)": { type: Number, default: 271 },
      "Brown Rice (1 cup cooked)": { type: Number, default: 215 },
      "Asparagus (100g)": { type: Number, default: 20 },
      "Cauliflower (100g)": { type: Number, default: 25 },
      "Lentils (1/2 cup cooked)": { type: Number, default: 115 }
    }
  },
  last_updated: { type: Date, required: true }
});

// Create the Diet model
const Diet = mongoose.model('Diet', dietSchema);

module.exports = Diet;  // Ensure the Diet model is being correctly exported
