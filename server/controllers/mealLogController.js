const MealLog = require("../models/MealLog");
//const fetch  = require("node-fetch"); // or axios

// Utility: fetch macros per 100g from Nutritionix (or USDA FoodData Central)
async function getMacrosForFood(name) {
  // Example Nutritionix request (you’ll need APP_ID & APP_KEY env vars)
  const res = await fetch(
    `https://trackapi.nutritionix.com/v2/natural/nutrients`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": process.env.NX_APP_ID,
        "x-app-key": process.env.NX_APP_KEY
      },
      body: JSON.stringify({ query: name })
    }
  );
  const data = await res.json();
  const food = data.foods?.[0];
  return {
    calories: food.nf_calories,
    protein:  food.nf_protein,
    carbs:    food.nf_total_carbohydrate,
    fat:      food.nf_total_fat,
    fiber:    food.nf_dietary_fiber
  };
}

exports.getTodayMeals = async (req, res) => {
  const userId = req.user.id;
  const today = new Date(); today.setHours(0,0,0,0);
  const meals = await MealLog.find({ user: userId, date: today });
  res.json(meals);
};

exports.addMeal = async (req, res) => {
  const userId = req.user.id;
  const { name, items, tags } = req.body; // items: [{ name, grams }]
  // 1) For each item, fetch per-100g macros, scale by grams/100
  const detailed = await Promise.all(items.map(async it => {
    const m = await getMacrosForFood(it.name);
    const factor = it.grams / 100;
    return {
      name: it.name,
      grams: it.grams,
      macros: {
        calories: m.calories * factor,
        protein:  m.protein  * factor,
        carbs:    m.carbs    * factor,
        fat:      m.fat      * factor,
        fiber:    m.fiber    * factor
      }
    };
  }));
  // 2) Sum totals
  const totals = detailed.reduce((t, it) => {
    t.calories += it.macros.calories;
    t.protein  += it.macros.protein;
    t.carbs    += it.macros.carbs;
    t.fat      += it.macros.fat;
    t.fiber    += it.macros.fiber;
    return t;
  }, { calories:0, protein:0, carbs:0, fat:0, fiber:0 });

  // 3) Save
  const meal = new MealLog({
    user: userId,
    name,
    items: detailed,
    tags,
    totals
  });
  await meal.save();
  res.status(201).json(meal);
};

exports.updateMeal = async (req, res) => {
    try {
      const userId = req.user.id;
      const mealId = req.params.id;
      const { name, items, tags } = req.body;
      
      // Basic validation
      if (!name || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ message: "Meal name and at least one item required" });
      }
  
      // 1) Recalculate detailed items with new macros
      const detailed = await Promise.all(
        items.map(async (it) => {
          if (!it.name || !it.grams) {
            throw new Error("Each item must have a name and grams");
          }
          const m = await getMacrosForFood(it.name);
          const factor = it.grams / 100;
          return {
            name: it.name,
            grams: it.grams,
            macros: {
              calories: m.calories * factor,
              protein:  m.protein  * factor,
              carbs:    m.carbs    * factor,
              fat:      m.fat      * factor,
              fiber:    m.fiber    * factor
            }
          };
        })
      );
  
      // 2) Sum up totals again
      const totals = detailed.reduce(
        (t, it) => {
          t.calories += it.macros.calories;
          t.protein  += it.macros.protein;
          t.carbs    += it.macros.carbs;
          t.fat      += it.macros.fat;
          t.fiber    += it.macros.fiber;
          return t;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      );
  
      // 3) Find & update the existing meal
      const updated = await MealLog.findOneAndUpdate(
        { _id: mealId, user: userId },
        {
          name,
          items: detailed,
          tags,
          totals
        },
        { new: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.json(updated);
  
    } catch (err) {
      console.error("Error in updateMeal:", err);
      if (err.message.startsWith("No nutrition data") || err.message.includes("Each item")) {
        return res.status(400).json({ message: err.message });
      }
      res.status(500).json({ message: "Server error updating meal" });
    }
  };

exports.deleteMeal = async (req, res) => {
  const meal = await MealLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!meal) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
};
