import React, { useState, useEffect} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate(); 

  useEffect(() => {
    document.title = "RoomChat - Register";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault(); 
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    // 👉 1. పాస్‌వర్డ్ కరెక్ట్ గా ఉండి API కాల్ వెళ్లే ముందు లోడింగ్ స్టార్ట్ అవుతుంది
    setIsLoading(true);

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
    } finally {
      // 👉 2. సక్సెస్ అయినా, ఎర్రర్ వచ్చినా ఫైనల్ గా లోడింగ్ ఆగిపోవాలి
      setIsLoading(false);
    }
  };

  return (
    <div className="joinChatContainer">
      <form onSubmit={handleRegister}>
        <h3>Register</h3>
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {/* 👉 3. బటన్ డిజైన్ మరియు లోడింగ్ టెక్స్ట్ మార్చాం */}
          <button 
            type="submit"
            disabled={isLoading}
            style={{ 
              opacity: isLoading ? 0.7 : 1, 
              cursor: isLoading ? 'not-allowed' : 'pointer' 
            }}
          >
            {isLoading ? 'Loading...' : 'Register'}
          </button>
          
        </div>
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