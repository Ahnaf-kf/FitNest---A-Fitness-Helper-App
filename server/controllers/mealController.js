// server/controllers/mealController.js
const Meal = require("../models/Meal");
exports.getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find({});
    res.json(meals);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching meals" });
  }
};
