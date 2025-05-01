// server/models/MealLog.js
const mongoose = require("mongoose");

const FoodItemSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  grams:     { type: Number, required: true },
  macros: {      // populated by our API call
    calories: Number,
    protein:  Number,
    carbs:    Number,
    fat:      Number,
    fiber:    Number
  }
});

const MealLogSchema = new mongoose.Schema({
  user:     { type: mongoose.Types.ObjectId, ref: "User", required: true },
  date:     { type: Date, default: () => new Date().setHours(0,0,0,0) }, 
  name:     { type: String, required: true },
  items:    [ FoodItemSchema ],
  tags:     [ String ],
  totals: {   // sum of all macros
    calories: Number,
    protein:  Number,
    carbs:    Number,
    fat:      Number,
    fiber:    Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MealLog", MealLogSchema);
