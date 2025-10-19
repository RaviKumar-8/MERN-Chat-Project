// 1. Necessary libraries ni import chesukuntunnam
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./Message.js');

// 2. Express app ni initialize chesi, middleware ni add cheddam
const app = express();
app.use(cors()); // CORS middleware ni okkasari matrame add cheyali

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
});

// 5. Server ni start cheyadam
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});