const User = require("../models/User");
const jwt  = require("jsonwebtoken");
const axios = require("axios")

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// @route   POST /api/auth/register
// @desc    Create new user
// @access  Public
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, username, email, password } = req.body;
    // Basic validation
    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ msg: 'Please fill all fields' });
    }
    // Check for existing user
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ msg: 'Email or username already in use' });
    }
    // Create and save
    const user = new User({ firstname, lastname, username, email, password });
    await user.save();

    // Generate JWT
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password, hcaptchaToken } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ msg: 'Please fill all fields' });
    }

    if (!hcaptchaToken) {
      return res.status(400).json({ msg: "Captcha token missing" });
    }

    console.log("UsinghCaptcha secret:", process.env.HCAPTCHA_SECRET);
    console.log("hcaptchaToken received from frontend:", hcaptchaToken);
    //Verify with hCaptcha
    const hcapRes = await axios.post(
      "https://hcaptcha.com/siteverify",
      new URLSearchParams({
        secret: process.env.HCAPTCHA_SECRET,
        response: hcaptchaToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("hcaptcha response:", hcapRes.data);

    if (!hcapRes.data.success) {
      return res.status(400).json({ msg: "Captcha verification failed" });
    }

    // Find by email or username
    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Success
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
