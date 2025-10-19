const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  time: {
    type: String, // Manam simple ga string save chestunnam
    required: true,
  },
  // Professional projects lo Date type vadataru
  // timestamp: {
  //   type: Date,
  //   default: Date.now,
  // }
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;