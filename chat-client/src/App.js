import './App.css';
import io from 'socket.io-client';
import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from 'react-router-dom';
import Chat from './Chat';
import Login from './Login';
import Register from './Register';

// Socket connection ni ikkada initialize cheddam
// Kani connect() ni chat component lo cheddam
const socket = io('https://chat-room-server-4gu1.onrender.com');

function App() {
  // User login ayyara leda ani 'localStorage' lo check cheddam
  const [username, setUsername] = useState(localStorage.getItem('chat-username') || null);

  useEffect(() => {
    // LocalStorage lo username unte set chesukondi
    const storedUsername = localStorage.getItem('chat-username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogin = (loggedInUsername) => {
    setUsername(loggedInUsername);
    // localStorage lo save chesindi Login.js lo chestunnam
  };

  const handleLogout = () => {
    localStorage.removeItem('chat-token');
    localStorage.removeItem('chat-username');
    setUsername(null);
  };

  return (
    <Router>
      <div className="App">
        {/* Logout button, user login ayi unte chupiddam */}
        {username && (
          <button 
            onClick={handleLogout} 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              backgroundColor: '#f44336' 
            }}
          >
            Logout
          </button>
        )}

        <Routes>
          {/* 1. Register Page */}
          <Route path="/register" element={<Register />} />

          {/* 2. Login Page */}
          <Route
            path="/login"
            element={!username ? <Login onLogin={handleLogin} /> : <Navigate to="/chat" />}
          />

          {/* 3. Chat Page (Join Room) */}
          <Route
            path="/chat"
            element={username ? <JoinRoomPage socket={socket} username={username} /> : <Navigate to="/login" />}
          />
          
          {/* 4. Chat Room Page */}
           <Route 
            path="/chat/:room" 
            element={username ? <ChatPage socket={socket} username={username} /> : <Navigate to="/login" />}
          />

          {/* Default Route */}
          <Route
            path="/"
            element={username ? <Navigate to="/chat" /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

// --- Chat Page ki manam kotta components create cheddam ---

// 1. Room Join Avvadaniki Component
function JoinRoomPage({ socket, username }) {
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "RoomChat";
  }, []);

  const joinRoom = () => {
    if (room !== '') {
      // Socket event emi pampanavasaram ledu, direct ga URL ki veldam
      navigate(`/chat/${room}`);
    }
  };

  return (
    <div className="joinChatContainer">
      <h3>Join A Chat Room</h3>
      <h4>Welcome, {username}!</h4>
      <input
        type="text"
        placeholder="Room ID..."
        onChange={(event) => {
          setRoom(event.target.value);
        }}
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}

// 2. Asalaina Chat Component ni render chese Page
// (URL nundi room ID teesukovadaniki)

function ChatPage({ socket, username }) {
  const { room } = useParams(); // URL nundi 'room' ID ni teesukuntundi

  useEffect(() => {
    // User ee page ki vachinappudu server ki "join_room" event pampali
    if (socket && room) {
      socket.emit("join_room", room);
      console.log(`User ${username} joining room ${room}`);
    }
  }, [socket, room, username]);


  return (
    // Manam already create chesina 'Chat' component ni ikkada vadutunnam
    <Chat socket={socket} username={username} room={room} />
  );
}

export default App;