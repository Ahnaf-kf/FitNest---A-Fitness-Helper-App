import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/SideBar";
import TopBar  from "../TopBar/TopBar";
import "./MealPlanner.css";

export default function MealPlanner() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("fitnest_token");
  const [plan, setPlan] = useState(null);
  const [mealsList, setMealsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const slots  = ["breakfast","lunch","dinner","snack"];
  const days   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  // Load both the weekly plan and all available meals
  useEffect(() => {
    Promise.all([
      fetch("/api/diet/plan", { headers: { Authorization:`Bearer ${token}` }}).then(r=>r.json()),
      fetch("/api/diet/meals", { headers: { Authorization:`Bearer ${token}` }}).then(r=>r.json())
    ])
    .then(([planData, mealsData]) => {
      setPlan(planData);
      setMealsList(mealsData);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [token]);

  const handleMealChange = (day, slot, mealId) => {
    setPlan(p => {
      const updated = {...p};
      updated.meals = p.meals.map(m =>
        m.dayOfWeek===day && m.slot===slot
          ? {...m, meal: mealsList.find(x=>x._id===mealId)}
          : m
      );
      return updated;
    });
  };

  const handleSave = () => {
    const payload = plan.meals.map(m => ({
      dayOfWeek: m.dayOfWeek,
      slot:      m.slot,
      meal:      m.meal._id
    }));
    fetch("/api/diet/plan", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify({ meals: payload })
    })
    .then(r => r.json())
    .then(updatedPlan => {
      setPlan(updatedPlan);
      alert("Plan saved!");
    })
    .catch(err => alert("Error saving plan"));
  };

  const handleShuffle = () => {
    fetch("/api/diet/plan/shuffle", {
      method: "POST",
      headers: { Authorization:`Bearer ${token}` }
    })
    .then(r => r.json())
    .then(shuffled => setPlan(shuffled))
    .catch(err => console.error(err));
  };

  if (loading) return <div className="planner-loading">Loading...</div>;
  if (!plan || !Array.isArray(plan.meals)) {
    return (
      <div className="planner-loading">
        No plan found — try reloading or contact support.
      </div>
    );
  }

  return (
    <div className="planner-container">
      <Sidebar />
      <main className="planner-main">
        <TopBar />
        <div className="planner-content">
          <h2>Weekly Meal Planner</h2>
          <button className="btn-shuffle" onClick={handleShuffle}>
            Shuffle Whole Week
          </button>
          <table className="planner-table">
            <thead>
              <tr>
                <th>Day / Meal</th>
                {days.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {slots.map(slot => (
                <tr key={slot}>
                  <td className="slot-name">{slot}</td>
                  {days.map(day => {
                    const entry = plan.meals.find(m=>m.dayOfWeek===day && m.slot===slot);
                    return (
                      <td key={day}>
                        <select
                          value={entry.meal._id}
                          onChange={e => handleMealChange(day, slot, e.target.value)}
                        >
                          {mealsList.map(meal => (
                            <option key={meal._id} value={meal._id}>
                              {meal.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
}
