import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Ee 'onLogin' prop ni manam App.js nundi pass cheddam
function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "RoomChat - Login";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Back-end login API ni call chestunnam
      const response = await axios.post('https://chat-room-server-4gu1.onrender.com/login', {
        username: username,
        password: password,
      });

      // Login ayyaka, token ni mariyu user info ni save cheddam
      const { token, username: loggedInUsername } = response.data;
      localStorage.setItem('chat-token', token);
      localStorage.setItem('chat-username', loggedInUsername);
      
      // App.js ki user login ayyaru ani cheppadaniki ee function call cheddam
      onLogin(loggedInUsername);
      
      // Direct ga chat page ki navigate cheddam
      navigate('/chat');

    } catch (error) {
      setMessage(error.response.data.message);
    }
  };

  return (
    <div className="joinChatContainer">
      <form onSubmit={handleLogin}>
        <h3>Login</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </div>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </form>
      <p>
        Don't have an account?{' '}
        <span
          onClick={() => navigate('/register')}
          style={{ color: 'blue', cursor: 'pointer' }}
        >
          Register here
        </span>
      </p>
    </div>
  );
}

export default Login;