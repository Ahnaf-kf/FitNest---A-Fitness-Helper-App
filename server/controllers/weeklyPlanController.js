const WeeklyPlan = require("../models/WeeklyPlan");
const Meal       = require("../models/Meal");

exports.getOrCreateWeeklyPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const now    = new Date();
    const year   = now.getFullYear();
    const week   = Math.ceil((((now - new Date(year,0,1)) / 86400000) + new Date(year,0,1).getDay() + 1) / 7);

    // Try to fetch existing plan
    let plan = await WeeklyPlan.findOne({ user: userId, year, week }).populate("meals.meal");
    if (plan) return res.status(200).json(plan);

    // Otherwise generate a new one
    const allMeals = await Meal.find({});  // later filter by restrictions
    const slots    = ["breakfast","lunch","dinner","snack"];
    const days     = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const meals    = [];

    days.forEach(day => {
      slots.forEach(slot => {
        const pick = allMeals[Math.floor(Math.random() * allMeals.length)];
        meals.push({ dayOfWeek: day, slot, meal: pick._id });
      });
    });

    plan = new WeeklyPlan({ user: userId, year, week, meals });
    await plan.save();
    plan = await WeeklyPlan.populate(plan, { path: "meals.meal" });
    console.log(plan);

    res.status(201).json(plan);
  } catch (err) {
    console.error("weeklyPlan error:", err);
    res.status(500).json({ message: "Error generating weekly plan" });
  }
};

// after your existing getOrCreateWeeklyPlan
exports.updateWeeklyPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const { meals } = req.body; // expect array of { dayOfWeek, slot, meal }
    const now  = new Date();
    const year = now.getFullYear();
    const week = Math.ceil((((now - new Date(year,0,1))/86400000)+ new Date(year,0,1).getDay()+1)/7);

    let plan = await WeeklyPlan.findOne({ user: userId, year, week });
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    plan.meals = meals;
    await plan.save();
    plan = await WeeklyPlan.populate(plan, { path: "meals.meal" });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating weekly plan" });
  }
};

exports.shuffleWeeklyPlan = async (req, res) => {
  try {
    const userId = req.userId;
    const now    = new Date();
    const year   = now.getFullYear();
    const week   = Math.ceil((((now - new Date(year,0,1))/86400000)+ new Date(year,0,1).getDay()+1)/7);

    const allMeals = await Meal.find({});
    const slots    = ["breakfast","lunch","dinner","snack"];
    const days     = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const newMeals = [];

    days.forEach(day => {
      slots.forEach(slot => {
        const pick = allMeals[Math.floor(Math.random()*allMeals.length)];
        newMeals.push({ dayOfWeek: day, slot, meal: pick._id });
      });
    });

    let plan = await WeeklyPlan.findOneAndUpdate(
      { user: userId, year, week },
      { meals: newMeals },
      { new: true }
    ).populate("meals.meal");
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error shuffling weekly plan" });
  }
};
