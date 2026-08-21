const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: { type: String }, // కొత్తగా యాడ్ చేసాం
  room: { type: String, required: true },
  author: { type: String, required: true },
  message: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: "sent" } // కొత్తగా యాడ్ చేసాం
});

module.exports = mongoose.model('Message', messageSchema);
