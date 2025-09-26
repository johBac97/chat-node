import React, { useState } from "react";
import type { Message, UserPayload } from "../types/types";
import { Socket } from "socket.io-client";
import MessageDisplay from "./MessageDisplay";
import { Textarea } from "@/components/ui/textarea";

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

  const header = selectedUser === undefined ? "" : `In Chat: ${selectedUser?.username}`;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 overflow-auto p-4 border rounded-xl">
        <MessageDisplay
          selectedUser={selectedUser}
          messages={messages}
          currentUser={currentUser}
          users={users}
        />
      </div>
      <div className="gap-2">
        <Textarea
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleSendMessage}
          placeholder="Type a message"
          className="w-full h-24"
        />
      </div>
    </div>
  );
};

export default ChatBox;
