// 1. Necessary libraries ni import chesukuntunnam
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./Message.js');
const User = require('./User.js');
const jwt = require('jsonwebtoken');

// 2. Express app ni initialize chesi, middleware ni add cheddam
const app = express();
app.use(cors()); // CORS middleware ni okkasari matrame add cheyali
app.use(express.json());

// --- MONGODB CONNECTION CODE ---
// !! Mukhyam: Ee kindi line lo <db_password> ni mee nijamaina password tho replace cheyandi
const DB_CONNECTION_STRING = "mongodb+srv://testuser123:dGkKr53sYxpbo27c@cluster0.2rrmy6o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(DB_CONNECTION_STRING)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
  });

// 3. HTTP Server mariyu Socket.io Server ni setup cheddam
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Mee React app ekkada run avtundo aa URL
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;

// 4. Socket connection logic
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Room lo join avvadaniki
  socket.on("join_room", async (data) => {
    socket.join(data);
    console.log(`User ${socket.id} joined room: ${data}`);

    // Paatha messages ni load cheyadam
    try {
      const oldMessages = await Message.find({ room: data }).sort({ 'createdAt': 1 }); // createdAt tho sort cheste better
      socket.emit("load_old_messages", oldMessages);
      console.log(`Sent ${oldMessages.length} old messages to user ${socket.id}`);
    } catch (err) {
      console.error("Error fetching old messages:", err.message);
    }
  });

  // Message pampadaniki
  socket.on("send_message", async (data) => {
    // Message ni DB lo save cheyadam
    try {
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time,
      });
      await newMessage.save();
    } catch (err) {
      console.error("Error saving message:", err.message);
    }

    // Message ni room lo andariki pampadam
    io.to(data.room).emit("receive_message", data);
  });

  // Disconnect ayinappudu
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });

  // KOTTA EVENT: User room nundi vellipothe
  socket.on("leave_room", (data) => {
    socket.leave(data);
    console.log(`User ${socket.id} left room: ${data}`);
  });

  // User disconnect ayinappudu (idi already undi)
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// =========== AUTHENTICATION ROUTES ============

// 1. REGISTER ROUTE
app.post("/register", async (req, res) => {
  try {
    // 1. React nundi username mariyu password teesukondi
    const { username, password } = req.body;

    // 2. Aa username tho user unnaro ledo check cheyandi
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      // Unte, error pampinchandi
      return res.status(400).json({ message: "Username already exists" });
    }

    // 3. Leni paksham lo, kotta user ni create cheyandi
    // (Password anedi User.js lo automatic ga hash (encrypt) avtundi)
    const newUser = new User({
      username: username,
      password: password,
    });

    // 4. Kotta user ni database lo save cheyandi
    await newUser.save();

    // 5. Success message pampinchandi
    res.status(201).json({ message: "User created successfully!" });

  } catch (err) {
    // Edaina vere error vaste
    console.error("Error during registration:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// 2. LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    // 1. React nundi username mariyu password teesukondi
    const { username, password } = req.body;

    // 2. Aa username tho user unnaro ledo check cheyandi
    const user = await User.findOne({ username: username });
    if (!user) {
      // User lekapothe, error pampinchandi
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. User unte, password correct o kado check cheyandi
    // (idi database lo unna hashed password tho compare chestundi)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Password tappu aite, error pampinchandi
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4. Password correct aite, oka JWT Token create cheyandi
    const token = jwt.sign(
      { userId: user._id, username: user.username }, // Token lo ee data pedutunnam
      process.env.JWT_SECRET, // Manam .env lo pettina secret key
      { expiresIn: "1d" } // Ee token 1 day varaku valid
    );

    // 5. Token ni mariyu user info ni React app ki pampinchandi
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

// 6. Server ni start cheyadam
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});