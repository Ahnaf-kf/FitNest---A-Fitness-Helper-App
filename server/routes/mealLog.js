const express = require("express");
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/mealLogController");
const router  = express.Router();

router.get("/",        auth, ctrl.getTodayMeals);
router.post("/",       auth, ctrl.addMeal);
router.put("/:id",     auth, ctrl.updateMeal);
router.delete("/:id",  auth, ctrl.deleteMeal);

module.exports = router;
