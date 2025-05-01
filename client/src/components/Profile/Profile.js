import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from '../SideBar/SideBar';
import TopBar  from '../TopBar/TopBar';
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("fitnest_user") || "{}");
  const token = localStorage.getItem("fitnest_token");
  const userId = user.id;

  const [loading, setLoading] = useState(true);
  const [mode, setMode]     = useState("view"); // "view" | "edit"
  const [error, setError]   = useState("");
  const [profile, setProfile] = useState(null);

  // Form inputs
  const [inputs, setInputs] = useState({
    height:            "",
    weight:            "",
    sex:               "female",
    bmi:               "",
    bmr:               "",
    heart_rate:        "",
    sleep_hours:       "",
    goal:              "maintain fitness",
    fitness_level:     "beginner",
    birthday:          "",
    motivational_message: "",
  });

  // Load profile on mount
  useEffect(() => {
    fetch(`http://localhost:5000/api/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 404) {
          setMode("edit");
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.profile) {
          setProfile(data.profile);
          // populate inputs for editing
          const m = data.profile.metrics;
          const fg = data.profile.fitness_goals;
          setInputs({
            height: m.height,
            weight: m.weight,
            sex: m.sex,
            bmi: m.bmi,
            bmr: m.bmr,
            heart_rate: m.heart_rate || "",
            sleep_hours: m.sleep_hours || "",
            goal: fg.goal,
            fitness_level: fg.fitness_level,
            birthday: data.profile.birthday
              ? data.profile.birthday.slice(0,10)
              : "",
            motivational_message: data.profile.motivational_message || ""
          });
          setMode("view");
        }
      })
      .catch(err => setError("Error loading profile"))
      .finally(() => setLoading(false));
  }, [userId, token]);

  const BMIEqn = (weight, height) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to meters
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      return (w / (h * h)).toFixed(2);
    }
    return "";
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setInputs(prev => {
      const updated = { ...prev, [name]: value };
  
      // Auto-calculate BMI if height or weight is changed
      if (name === "weight" || name === "height") {
        updated.bmi = BMIEqn(updated.weight, updated.height);
      }
  
      return updated;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    // basic validation
    if (!inputs.height || !inputs.weight || !inputs.bmi || !inputs.bmr) {
      return setError("Please fill all required metrics.");
    }
    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id:       userId,
          metrics: {
            height:      Number(inputs.height),
            weight:      Number(inputs.weight),
            bmi:         Number(inputs.bmi),
            bmr:         Number(inputs.bmr),
            heart_rate:  inputs.heart_rate ? Number(inputs.heart_rate) : undefined,
            sleep_hours: inputs.sleep_hours ? Number(inputs.sleep_hours) : undefined,
          },
          fitness_goals: {
            goal:          inputs.goal,
            fitness_level: inputs.fitness_level
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      setProfile(data.profile);
      setMode("view");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="dashboard-main">
        <TopBar />
        <div className="profile-page">
          <div className="background-box" />
          <div className="profile-container">
            <h2>User Profile</h2>

            {mode === "view" && profile && (
              <>
                <div className="profile-stats">
                  <section>
                    <h3>Metrics</h3>
                    <ul>
                      <li>Height: {profile.metrics.height} cm</li>
                      <li>Weight: {profile.metrics.weight} kg</li>
                      <li>BMI: {profile.metrics.bmi}</li>
                      <li>BMR: {profile.metrics.bmr}</li>
                      {profile.metrics.heart_rate != null && (
                        <li>Heart Rate: {profile.metrics.heart_rate} bpm</li>
                      )}
                      {profile.metrics.sleep_hours != null && (
                        <li>Sleep: {profile.metrics.sleep_hours} hrs/day</li>
                      )}
                    </ul>
                  </section>
                  <section>
                    <h3>Goals</h3>
                    <ul>
                      <li>Goal: {profile.fitness_goals.goal}</li>
                      <li>Level: {profile.fitness_goals.fitness_level}</li>
                    </ul>
                  </section>
                  <section>
                    <h3>Progress</h3>
                    <ul>
                      <li>Workouts Done: {profile.progress.workouts_completed}</li>
                      <li>Cardio Goals: {profile.progress.cardio_goals_completed}</li>
                      <li>Calories Burned: {profile.progress.calories_burned}</li>
                    </ul>
                  </section>
                </div>
                <button
                  className="cta"
                  onClick={() => setMode("edit")}
                >
                  Update Profile
                </button>
              </>
            )}

            {(mode === "edit") && (
              <form className="form-box" onSubmit={handleSubmit}>
                <div className="name-row">
                  <label>
                    Height:
                    <input
                      type="number" name="height"
                      placeholder="Height (cm)"
                      value={inputs.height}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Weight:
                    <input
                      type="number" name="weight"
                      placeholder="Weight (kg)"
                      value={inputs.weight}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </div>
                <div className="name-row">
                  <label>
                    Date of Birth:
                    <input
                      type="date" name="birthday"
                      value={inputs.birthday}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    Sex:
                    <select
                      name="sex" value={inputs.sex}
                      onChange={handleChange}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Prefer not to say</option>
                    </select>
                  </label>
                </div>
                <div className="name-row">
                  <label>
                    BMI: 
                    <input
                      type="number" name="bmi"
                      placeholder="BMI"
                      step="0.1"
                      value={inputs.bmi}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    BMR: 
                  <input
                    type="number" name="bmr"
                    placeholder="BMR"
                    value={inputs.bmr}
                    onChange={handleChange}
                    required
                  />
                  </label>
                </div>
                <div className="name-row">
                  <label>
                  Heart Rate:
                    <input
                      type="number" name="heart_rate"
                      placeholder="Heart Rate (bpm)"
                      value={inputs.heart_rate}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    Sleep Hours:
                    <input
                      type="number" name="sleep_hours"
                      placeholder="Sleep Hours"
                      value={inputs.sleep_hours}
                      onChange={handleChange}
                    />
                  </label>
                </div>
                <div className="name-row">
                  <label>
                    Goal:
                    <select
                      name="goal" value={inputs.goal}
                      onChange={handleChange}
                    >
                      <option value="gain muscle">Gain Muscle</option>
                      <option value="lose weight">Lose Weight</option>
                      <option value="maintain fitness">Maintain Fitness</option>
                    </select>
                  </label>
                  <label>
                    Fitness Level:
                    <select
                      name="fitness_level" value={inputs.fitness_level}
                      onChange={handleChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                </div>
                
                {/* <textarea
                  name="motivational_message"
                  placeholder="Motivational Message"
                  value={inputs.motivational_message}
                  onChange={handleChange}
                /> */}
                {error && <div className="form-error">{error}</div>}
                <button type="submit" className="register-button">
                  {profile ? "Update Profile" : "Create Profile"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
