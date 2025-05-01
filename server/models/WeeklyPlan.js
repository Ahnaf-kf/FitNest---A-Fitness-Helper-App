const mongoose = require("mongoose");

const WeeklyPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  year: { type: Number, required: true },
  week: { type: Number, required: true },
  meals: [{
    dayOfWeek: { type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], required: true },
    slot:      { type: String, enum: ["breakfast","lunch","dinner","snack"], required: true },
    meal:      { type: mongoose.Types.ObjectId, ref: "Meal", required: true }
  }]
});

module.exports = mongoose.model("WeeklyPlan", WeeklyPlanSchema);
