import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/SideBar";
import TopBar  from "../TopBar/TopBar";
import "./DietLanding.css";

const API = "http://localhost:5000";

function EditableNote({ note, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [text, setText]     = useState(note.text);

  const save = () => {
    if (!text.trim() || text === note.text) {
      setEditing(false);
      return;
    }
    onUpdate(note._id, text).then(() => setEditing(false));
  };

  return editing ? (
    <div className="note-editing">
      <textarea
        className="note-input-inline"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <div className="note-buttons-inline">
        <button onClick={save}>Save</button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  ) : (
    <div className="note-view">
      <span className="note-text">{note.text}</span>
      <div className="note-buttons-inline">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={() => onDelete(note._id)}>Delete</button>
      </div>
    </div>
  );
}

function AddMealModal({ onClose, onSave }) {
  const [name, setName]   = useState("");
  const [tags, setTags]   = useState("");
  const [items, setItems] = useState([{ name:"", grams:"" }]);

  const addItemField = () => setItems(i => [...i, { name:"", grams:"" }]);
  const updateItem   = (idx, key, val) => {
    setItems(i => i.map((it, j) => j===idx ? {...it, [key]: val} : it));
  };

  const handleSave = () => {
    const parsedTags = tags.split(",").map(t=>t.trim()).filter(t=>t);
    onSave({ name, tags: parsedTags, items });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Add Your Own Meal</h2>
        <input
          placeholder="Meal name"
          value={name} onChange={e=>setName(e.target.value)}
        />
        <br></br>
        <br></br>
        {items.map((it, idx) => (
          <div key={idx} className="item-row">
            <input
              placeholder="Food element"
              value={it.name}
              onChange={e=>updateItem(idx, "name", e.target.value)}
            />
            <input
              placeholder="Amount (g)"
              type="number"
              value={it.grams}
              onChange={e=>updateItem(idx, "grams", e.target.value)}
            />
          </div>
        ))}

        <button onClick={addItemField}>Add more food element</button>
        <br></br>
        <br></br>
        <input
          placeholder="Tags, comma-separated"
          value={tags} onChange={e=>setTags(e.target.value)}
        />
        <br></br>
        <br></br>
        <button onClick={handleSave}>Save Meal</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}


export default function DietLanding() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("fitnest_token");

  // Notes state
  const [notes, setNotes]       = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [todayMeals, setTodayMeals] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/meals`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setTodayMeals)
      .catch((err) => console.error("Error loading meals:", err));
  }, [token]);
  
  // Load notes on mount
  useEffect(() => {
    fetch(`${API}/api/notes?tag=nutrition`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoadingNotes(false));
  }, [token]);

  // Add a new note
  const addNote = () => {
    if (!noteText.trim()) return;
    fetch(`${API}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tag: "nutrition", text: noteText })
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(newNote => {
        setNotes(prev => [newNote, ...prev]);
        setNoteText("");
      })
      .catch(err => alert("Error adding note: " + err.message));
  };

  // Delete a note
  const deleteNote = (id) => {
    return fetch(`${API}/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Delete failed (${r.status})`);
        setNotes(prev => prev.filter(n => n._id !== id));
      })
      .catch(err => alert("Error deleting note: " + err.message));
  };

  // Update a note
  const updateNote = (id, newText) => {
    return fetch(`${API}/api/notes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: newText })
    })
      .then(r => {
        if (!r.ok) throw new Error(`Update failed (${r.status})`);
        return r.json();
      })
      .then(updated => {
        setNotes(prev => prev.map(n => (n._id === id ? updated : n)));
      })
      .catch(err => alert("Error updating note: " + err.message));
  };

  const saveMeal = (mealData) => {
    fetch(`${API}/api/meals`, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body: JSON.stringify(mealData)
    })
      .then(r=>r.json())
      .then(newMeal => setTodayMeals(prev => [newMeal, ...prev]));
  };

  return (
   <>
    <div className="diet-container">
      <Sidebar />
      <main className="diet-main">
        <TopBar />

        <div className="diet-content">
          {/* Weekly Meal Plan Placeholder */}
          <div
            className="weekly-plan-box"
            onClick={() => navigate("/diet/plan")}
          >
            <h2>Weekly Meal Plan</h2>
            <p>(Coming soon…)</p>
          </div>

          <div className="feature-cards">
            {/* Calorie & Macro Intake Card */}
            <div className="feature-card" onClick={() => setShowAddMeal(true)}>
              <h3>Custom Meals</h3>
              {todayMeals.length > 0 ? (
                todayMeals.map(m => (
                  <div key={m._id} className="meal-summary">
                    <div className="meal-summary-header">
                      <strong>{m.name}</strong> — {Math.round(m.totals.calories)} kcal
                    </div>
                    <div className="meal-tooltip">
                      <div>Calories: {m.totals.calories.toFixed(1)}</div>
                      <div>Carbs:    {m.totals.carbs.toFixed(1)} g</div>
                      <div>Protein:  {m.totals.protein.toFixed(1)} g</div>
                      <div>Fat:      {m.totals.fat.toFixed(1)} g</div>
                      <div>Fiber:    {m.totals.fiber.toFixed(1)} g</div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Add your own meals</p>
              )}
            </div>

            {/* Preferences & Restrictions Card */}
            <div
              className="feature-card"
              onClick={() => navigate("/diet/preferences")}
            >
              <h3>Preferences & Restrictions</h3>
              <p>Set dietary restrictions to personalize your plan.</p>
            </div>

            {/* Diet Notes Inline Card */}
            <div className="notes-card">
              <h3>Diet Notes</h3>

              {loadingNotes ? (
                <p>Loading notes…</p>
              ) : notes.length > 0 ? (
                <div className="notes-list">
                  {notes.map(n => (
                    <EditableNote
                      key={n._id}
                      note={n}
                      onDelete={deleteNote}
                      onUpdate={updateNote}
                    />
                  ))}
                </div>
              ) : (
                <p className="no-notes">Add nutrition notes</p>
              )}

              <textarea
                className="note-input"
                placeholder="Type your note here…"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <button className="add-note-btn" onClick={addNote}>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
    {showAddMeal && (
      <AddMealModal
        onClose={() => setShowAddMeal(false)}
        onSave={saveMeal}
      />
    )}
   </>
  );
}