const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = 5000;

// Middleware
app.use(helmet()); // Adds security headers
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173", // React frontend URL
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60 * 60 * 1000, // 1 hour
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
    },
  })
);

// Mock users data
const users = [
  { username: "admin", password: "admin123" },
  { username: "user", password: "user123" },
];

// Login attempts tracking
const loginAttempts = {};
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// Helper Functions
const isLocked = (username) => {
  const attempt = loginAttempts[username];
  if (!attempt) return false;
  if (attempt.lockUntil && attempt.lockUntil > Date.now()) {
    return true;
  }
  return false;
};

const incrementLoginAttempts = (username) => {
  if (!loginAttempts[username]) {
    loginAttempts[username] = { count: 1, lockUntil: null };
  } else {
    loginAttempts[username].count += 1;
    if (loginAttempts[username].count >= MAX_LOGIN_ATTEMPTS) {
      loginAttempts[username].lockUntil = Date.now() + LOCK_TIME;
    }
  }
};

const resetLoginAttempts = (username) => {
  delete loginAttempts[username];
};

// Routes

// Login Route
app.post("/api/users/login", (req, res) => {
  const { username, password } = req.body;

  // Input Validation
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input types." });
  }

  // Check if user is locked
  if (isLocked(username)) {
    return res
      .status(403)
      .json({ message: "Too many login attempts. Please try again later." });
  }

  // Find user
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    req.session.user = { username: user.username };
    resetLoginAttempts(username);
    return res.status(200).json({ message: "Login successful!" });
  } else {
    incrementLoginAttempts(username);
    const attemptsLeft =
      MAX_LOGIN_ATTEMPTS - (loginAttempts[username]?.count || 0);
    let message = "Invalid username or password.";
    if (attemptsLeft > 0) {
      message += ` You have ${attemptsLeft} attempt(s) left.`;
    } else {
      message += " You have been locked out for 15 minutes.";
    }
    return res.status(401).json({ message });
  }
});

// Logout Route
app.post("/api/users/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed." });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logout successful!" });
  });
});

// Check Session Route
app.get("/api/users/session", (req, res) => {
  if (req.session.user) {
    return res
      .status(200)
      .json({ user: req.session.user, message: "User is logged in." });
  } else {
    return res.status(401).json({ message: "No active session." });
  }
});

// Protected Route Example
app.get("/api/protected", (req, res) => {
  if (req.session.user) {
    return res
      .status(200)
      .json({
        message: `Welcome, ${req.session.user.username}! This is protected data.`,
      });
  } else {
    return res
      .status(403)
      .json({ message: "Session expired. Please log in again." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
