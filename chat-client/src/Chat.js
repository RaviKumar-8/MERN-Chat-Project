import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const navigate = useNavigate(); // 2. Initialize navigate

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
      };

      await socket.emit("send_message", messageData);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    const messageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };
    const oldMessagesHandler = (data) => {
      setMessageList(data);
    };

    socket.on("receive_message", messageHandler);
    socket.on("load_old_messages", oldMessagesHandler);

    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("load_old_messages", oldMessagesHandler);
      // Room nundi vellipoyetappudu server ki cheppadam
      socket.emit("leave_room", room);
    };
  }, [socket, room]);

  // 3. Leave Room Function
  const leaveRoom = () => {
    navigate('/chat'); // Join Room page ki teesukeltundi
    // Note: useEffect lo unna 'return' function automatic ga run ayyi server nundi disconnect chestundi.
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {/* 4. Leave Button Add Chesam */}
        <button onClick={leaveRoom} className="leave-btn">⬅️</button>
        <p>Live Chat - Room: {room}</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container-scroll">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message-container"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div className="message">
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="author">{messageContent.author}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#9658;</button>
      </div>
    </div>
  );
}

export default Chat;