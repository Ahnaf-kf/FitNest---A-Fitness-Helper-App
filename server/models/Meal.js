const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  macros: {
    calories: Number,
    protein:  Number,
    carbs:    Number,
    fat:      Number,
    fiber:    Number
  },
  tags:       [String]
});

module.exports = mongoose.model("Meal", MealSchema);
