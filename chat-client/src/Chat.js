import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

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
    // Handler for receiving live messages
    const messageHandler = (data) => {
      setMessageList((list) => [...list, data]);
    };

    // Handler for loading old messages
    const oldMessagesHandler = (data) => {
      setMessageList(data); // List ni set cheyali, add cheyakudadu
    };

    // Listeners ni setup cheyadam
    socket.on("receive_message", messageHandler);
    socket.on("load_old_messages", oldMessagesHandler); // Kotta listener

    // Clean up function
    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("load_old_messages", oldMessagesHandler); // Kotta listener cleanup
    };
  }, [socket]); // Dependency array lo marpu ledu

  return (
    <div className="chat-window">
      <div className="chat-header">
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