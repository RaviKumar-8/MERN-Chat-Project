require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./Message.js');
const User = require('./User.js');
const jwt = require('jsonwebtoken');

// 2. Express app initialization
const app = express();
app.use(cors()); 
app.use(express.json());

// --- MONGODB CONNECTION CODE ---
// Security Note: Hardcode చేసిన లింక్ బదులు process.env వాడటం మంచిది. 
const DB_CONNECTION_STRING = process.env.MONGO_URI || "mongodb+srv://testuser123:RaviChat1234@cluster0.2rrmy6o.mongodb.net/chat-app?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(DB_CONNECTION_STRING)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
  });

// 3. HTTP & Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://mern-chat-project-amber.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 4. Socket connection logic
let onlineUsers = []; 

// === MAIN CONNECTION BLOCK STARTS HERE ===
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // A. Join Room Logic (దీన్ని async చేయాలి)
  socket.on("join_room", async (data) => {
    const username = data.username;
    const room = data.room;

    socket.join(room); 

    onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);
    onlineUsers.push({ id: socket.id, username: username, room: room });

    const usersInThisRoom = onlineUsers.filter((user) => user.room === room);
    io.to(room).emit("room_users_update", usersInThisRoom);

    // 👉 కొత్త కోడ్: రూమ్ లో జాయిన్ అవ్వగానే డేటాబేస్ నుండి పాత మెసేజెస్ తీసుకురావడం
    try {
      // ఆ రూమ్ కి సంబంధించిన మెసేజెస్ అన్నీ వెతికి తీస్తున్నాం
      const previousMessages = await Message.find({ room: room });
      
      // జాయిన్ అయిన వాళ్ళకి మాత్రమే ఆ పాత మెసేజెస్ పంపుతున్నాం
      socket.emit("previous_messages", previousMessages);
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    }
  });

  // B. Send Message Logic (DB Save + Emit Merged)
  socket.on("send_message", async (data) => {
    
    socket.to(data.room).emit("receive_message", data);
    
    try {
      const newMessage = new Message({
        messageId: data.messageId,
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time,
        status: data.status,
      });
      await newMessage.save();
    } catch (err) {
      console.error("Error saving message:", err.message);
    }

  });

  socket.on("message_delivered", async (data) => {
    // మెసేజ్ పంపిన వాళ్ళకి డెలివరీ స్టేటస్ పంపుతాం
    socket.to(data.room).emit("message_status_update", data);

    try {
      await Message.updateOne(
        { messageId: data.messageId }, 
        { $set: { status: "delivered" } }
      );
    } catch (err) {
      console.error("Error updating status in DB:", err.message);
    }

  });

  // 3. Message Read Logic (బ్లూ టిక్స్ కోసం)
  socket.on("message_read", async (data) => {
    // మెసేజ్ పంపిన వాళ్ళకి 'read' స్టేటస్ పంపుతున్నాం
    socket.to(data.room).emit("message_status_update", data);
    
    // డేటాబేస్ లో కూడా స్టేటస్ ని 'read' గా మారుస్తున్నాం
    try {
      await Message.updateOne(
        { messageId: data.messageId }, 
        { $set: { status: "read" } }
      );
    } catch (err) {
      console.error("Error updating status to read in DB:", err.message);
    }
  });

  // C. Leave Room
  socket.on("leave_room", (data) => {
    socket.leave(data);
    console.log(`User ${socket.id} left room: ${data}`);
  });

  // D. Disconnect Logic (Merged)
  socket.on("disconnect", () => {
    const userThatLeft = onlineUsers.find((user) => user.id === socket.id);
    
    if (userThatLeft) {
      onlineUsers = onlineUsers.filter((user) => user.id !== socket.id);
      const usersInThisRoom = onlineUsers.filter((user) => user.room === userThatLeft.room);
      io.to(userThatLeft.room).emit("room_users_update", usersInThisRoom);
    }
    console.log("User Disconnected", socket.id);
  });
}); 
// === MAIN CONNECTION BLOCK ENDS HERE ===

// =========== AUTHENTICATION ROUTES ============

// 1. REGISTER ROUTE
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username: username });
    
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({
      username: username,
      password: password,
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully!" });

  } catch (err) {
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 2. LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" } 
    );

    res.status(200).json({
      message: "Login successful!",
      token: token,
      userId: user._id,
      username: user.username
    });

  } catch (err) {
    console.error("Error during login:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// =========== END AUTH ROUTES ============

// 6. Server Start
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});