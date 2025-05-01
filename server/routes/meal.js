// server/routes/weeklyPlan.js (or better: server/routes/meal.js)
const express = require("express"),
      auth    = require("../middleware/auth"),
      mealCtl = require("../controllers/mealController");
const router = express.Router();

router.get("/meals", auth, mealCtl.getAllMeals);

// ... existing /plan, /plan POST and /plan/shuffle routes ...

module.exports = router;
