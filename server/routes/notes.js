const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const ctrl    = require("../controllers/noteController");

router.get("/",  auth, ctrl.getNotes);
router.post("/", auth, ctrl.addNote);
router.put("/:id", auth, ctrl.updateNote);
router.delete("/:id", auth, ctrl.deleteNote);


module.exports = router;
