const Note = require("../models/Note");

// GET /api/notes?tag=nutrition
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      user: req.user.id,
      tag:  req.query.tag
    }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching notes" });
  }
};

// POST /api/notes
exports.addNote = async (req, res) => {
  console.log(" addNote called");
  console.log("  userId:", req.user.id);
  console.log("  body: ", req.body);
  try {
    const { tag, text } = req.body;
    if (!tag || !text) {
      return res.status(400).json({ message: "Tag and text are required" });
    }

    const note = new Note({
      user: req.user.id,
      tag,
      text
    });
    await note.save();
    console.log("  note saved:", note);
    res.status(201).json(note);
  } catch (err) {
    console.error("Error in addNote:", err);
    res.status(500).json({ message: "Error adding note" });
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting note" });
  }
};

// PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const { text } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { text },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating note" });
  }
};
