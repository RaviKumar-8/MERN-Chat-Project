import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import { useNavigate } from 'react-router-dom';

function Chat({ socket, username, room }) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "RoomChat - In Room";
  }, []);

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        messageId: Math.random().toString(36).substring(7),
        room: room,
        author: username,
        message: currentMessage,
        time:
          new Date(Date.now()).getHours() +
          ":" +
          new Date(Date.now()).getMinutes(),
        status: "sent",
      };

      await socket.emit("send_message", messageData);

      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  useEffect(() => {
    // 1. కొత్త మెసేజ్ వచ్చినప్పుడు
    const messageHandler = (data) => {
      setMessageList((list) => [...list, data]);
      
      // అవతలి వాళ్ళకి డెలివర్ అయిందని చెప్పడం
      if (data.author !== username) {
        socket.emit("message_delivered", { 
          messageId: data.messageId, 
          room: data.room, 
          status: "read" 
        });
      }
    };

    // 2. పాత మెసేజెస్ (డేటాబేస్ నుండి) వచ్చినప్పుడు
    const previousMessagesHandler = (messages) => {
      setMessageList(messages);

      messages.forEach((msg) => {
        // status "read" కాకపోతే, వాటన్నిటినీ "read" చేసేస్తాం
        if (msg.author !== username && msg.status !== "read" && msg.messageId) {
          socket.emit("message_read", { 
            messageId: msg.messageId, room: msg.room, status: "read" 
          });
        }
      });
    };

    // 3. స్టేటస్ అప్‌డేట్ అయినప్పుడు (టిక్స్ కోసం)
    const statusUpdateHandler = (data) => {
      setMessageList((list) => 
        list.map((msg) => 
          msg.messageId === data.messageId ? { ...msg, status: data.status } : msg
        )
      );
    };
    
    // 4. రూమ్ లో యూజర్స్ మారినప్పుడు
    const usersUpdateHandler = (users) => {
      setRoomUsers(users); 
    };

    // --- లిజనర్స్ ఆన్ చేయడం ---
    socket.on("receive_message", messageHandler);
    socket.on("previous_messages", previousMessagesHandler); 
    socket.on("message_status_update", statusUpdateHandler); 
    socket.on("room_users_update", usersUpdateHandler);

    if (username !== "" && room !== "") {
      // 1. కనెక్షన్ ఆల్రెడీ ఉంటే డైరెక్ట్ గా జాయిన్ అవ్వు
      if (socket.connected) {
        socket.emit("join_room", { username, room });
      } else {
        // 2. ఒకవేళ Render కి కనెక్ట్ అవ్వడానికి టైమ్ పడితే, కనెక్ట్ అయ్యాక జాయిన్ అవ్వు
        socket.on("connect", () => {
          socket.emit("join_room", { username, room });
        });
      }
    }

    // --- క్లీన్ అప్ (ఆఫ్ చేయడం) ---
    return () => {
      socket.off("receive_message", messageHandler);
      socket.off("previous_messages", previousMessagesHandler);
      socket.off("message_status_update", statusUpdateHandler);
      socket.off("room_users_update", usersUpdateHandler);
    };
  }, [socket, username, room]);

  const leaveRoom = () => {
    navigate('/chat');
  };

  return (
    <div className="chat-window">
      <div className="chat-header" style={{ display: "flex", flexDirection: "column", padding: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <button onClick={leaveRoom} className="leave-btn">⬅️</button>
          <p style={{ margin: 0 }}>Room: {room} | Name: {username || "Empty"} | 🟢 {roomUsers.length} Online</p>
        </div>
        
        <p style={{ fontSize: "12px", color: "#d1ffcf", margin: "5px 0 0 0" }}>
          Members: {roomUsers.map((user) => user.username).join(", ")}
        </p>
      </div>
      
      <div 
        className="chat-body"
        style={{
          backgroundImage:"url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
          backgroundRepeat: "repeat",
          backgroundColor: "#efeae2",
          backgroundSize: "400px"
        }}
      >
        <ScrollToBottom className="message-container-scroll">
          {messageList.map((messageContent, index) => {
            return (
              <div
                key={index}
                className="message-container"
                id={username === messageContent.author ? "you" : "other"}
              >
                <div className="message">
                  <div className="message-meta" style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "5px", width: "100%" }}>
                    
                    {/* 1. ఎడమవైపు పేరు (మన మెసేజ్ కాకపోతేనే కనిపిస్తుంది) */}
                    {username !== messageContent.author && (
                      <p id="author" style={{ margin: 0, fontWeight: "bold", whiteSpace: "nowrap", color: "#4caf50", flexShrink: 0 }}>
                        {messageContent.author}:
                      </p>
                    )}
                    
                    {/* 2. మెసేజ్ (కొత్తగా minWidth: 0 యాడ్ చేసాం) */}
                    <div className="message-content" style={{ 
                      flex: 1, 
                      textAlign: "left", 
                      wordBreak: "break-word", 
                      overflowWrap: "break-word",
                      minWidth: 0 
                    }}>
                      <p style={{ margin: 0 }}>{messageContent.message}</p>
                    </div>
                    
                    {/* 3. కుడివైపు టైమ్ మరియు టిక్స్ (కొత్తగా flexShrink: 0 యాడ్ చేసాం) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap", marginTop: "2px", flexShrink: 0 }}>
                      <p id="time" style={{ margin: 0, fontSize: "12px", color: "gray" }}>{messageContent.time}</p>
                      
                      {username === messageContent.author && (
                        <span style={{ 
                          fontSize: "14px", 
                          fontWeight: "bold", 
                          color: messageContent.status === "read" ? "#53bdeb" : (messageContent.status === "delivered" ? "gray" : "lightgray") 
                        }}>
                          {messageContent.status === "sent" ? "✓" : (messageContent.status === "delivered" || messageContent.status === "read" ? "✓✓" : "")}
                        </span>
                      )}
                    </div>

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
          placeholder="Message"
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