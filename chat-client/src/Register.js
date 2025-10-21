import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 'useNavigate' ni import cheddam

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Navigation kosam

  const handleRegister = async (e) => {
    e.preventDefault(); // Form submit avvakunda aaputundi
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }
    try {
      // Back-end register API ni call chestunnam
      const response = await axios.post('https://chat-room-server-4gu1.onrender.com/register', {
        username: username,
        password: password,
      });

      setMessage(response.data.message); // Success message
      // Register ayyaka, user ni login page ki pampiddam
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // Error unte, message chupiddam
      setMessage(error.response.data.message);
    }
  };

  return (
    <div className="joinChatContainer">
      <form onSubmit={handleRegister}>
        <h3>Register</h3>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </form>
      <p>
        Already have an account?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{ color: 'blue', cursor: 'pointer' }}
        >
          Login here
        </span>
      </p>
    </div>
  );
}

export default Register;