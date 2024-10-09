const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Max login attempts and lock time
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Helper to check if account is locked
const isLocked = (user) => user.lockUntil && user.lockUntil > Date.now();

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  // Input validation to prevent XSS
  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide all fields' });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Check if account is locked
    if (isLocked(user)) {
      return res.status(403).json({ message: 'Account locked. Try later.' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Reset login attempts if login is successful
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Create and assign JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, { httpOnly: true, secure: false }).json({
      message: 'Logged in successfully',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = (req, res) => {
  res.cookie('token', '', { httpOnly: true, secure: false, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { loginUser, logoutUser };
