import React, { useState } from "react";
import type { Message, UserPayload} from "../types/types";
import { Socket } from "socket.io-client";
//import './ChatBox.css';
import  MessageDisplay from './MessageDisplay';

interface ChatBoxProps {
  messages: list[Message];
  setMessages: React.Dispatch<React.SetStateAction<string>>;
  socket: Socket;
  selectedUser: string;
  currentUser: UserPayload;
  users: list[UserPayload];
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  setMessages,
  socket,
  selectedUser,
  currentUser,
  users,
}) => {
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e) => {
    if (e.key == "Enter" && inputText.trim()) {
      if (selectedUser !== undefined) {
        const msg: Message = {
          fromUserId: currentUser.userId,
          toUserId: selectedUser?.userId,
          content: inputText,
        };
        setMessages([...messages, msg]);
        socket?.emit("chatMessage", msg);
        setInputText("");
      } else {
        console.log("cannot send message when no user is selected.");
      }
    }
  };

  return (
    <div className="chat-box">
      {selectedUser !== undefined && (
        <header className="chat-header">{`In Chat:\t${selectedUser?.username}`}</header>
      )}
      <MessageDisplay messages={messages} currentUser={currentUser} users={users} />
      <input
        type="text"
        className="chat-input"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={handleSendMessage}
        placeholder="Type a message"
      />
    </div>
  );
};

export default ChatBox;
