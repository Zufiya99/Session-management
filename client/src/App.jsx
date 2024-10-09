import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css"; 

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check session on component mount
  useEffect(() => {
    checkSession();
    // eslint-disable-next-line
  }, []);

  // Polling for session status every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLoggedIn) {
        checkSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [isLoggedIn]);

  const login = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/login",
        { username, password },
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message);
      } else {
        setMessage("An error occurred. Please try again.");
      }
    }
  };

  const logout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/logout",
        {},
        { withCredentials: true }
      );
      setMessage(response.data.message);
      setIsLoggedIn(false);
    } catch (error) {
      setMessage("Logout failed.");
    }
  };

  const checkSession = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users/session",
        { withCredentials: true }
      );
      if (response.data.user) {
        setIsLoggedIn(true);
        setMessage(response.data.message);
      } else {
        setIsLoggedIn(false);
        setMessage("No active session.");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setIsLoggedIn(false);
        setMessage("Session expired. Please log in again.");
      } else {
        setMessage("Unable to verify session.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <h2>Session Management System</h2>
        {isLoggedIn ? (
          <div className="logged-in">
            <p>{message}</p>
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={login}>
            <div className="input-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>
            <div className="input-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="btn-login">
              Login
            </button>
          </form>
        )}
        {message && <p className="message">{message}</p>}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 Created by Zufiya Idrisi</p>
      </footer>
    </div>
  );
}

export default App;
