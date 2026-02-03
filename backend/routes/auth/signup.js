// backend/routes/auth/signup-simple.js
const express = require('express');
const User = require('../../models/user'); // Import User model (ensure the model exists)

const router = express.Router();

router.post('/', async (req, res) => {
  const { fullName, email, password, dateOfBirth } = req.body;

  try {
    // Validate input
    if (!fullName || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user with plain text password (not hashed)
    const newUser = new User({ fullName, email, password, dateOfBirth });
    await newUser.save();

    // Return success message with user info
    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        dateOfBirth: newUser.dateOfBirth
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error signing up user', error: err });
  }
});

module.exports = router;
