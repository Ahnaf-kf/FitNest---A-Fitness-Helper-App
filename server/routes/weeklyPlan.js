const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/weeklyPlanController");

// GET or generate the current week’s plan
router.get("/plan", auth, ctrl.getOrCreateWeeklyPlan);
router.post("/plan",        auth, ctrl.updateWeeklyPlan);
router.post("/plan/shuffle",auth, ctrl.shuffleWeeklyPlan);

module.exports = router;
