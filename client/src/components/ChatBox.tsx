import React, { useState, useEffect, useRef } from "react";
import type {
  ClientMessage,
  Message,
  UserPayload,
  Chats,
} from "../types/types";
import { Socket } from "socket.io-client";
import MessageDisplay from "./MessageDisplay";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatBoxProps {
  chats: Chats;
  socket: Socket;
  selectedUser: UserPayload;
  currentUser: UserPayload;
  users: UserPayload[];
}

const ChatBox: React.FC<ChatBoxProps> = ({
  chats,
  socket,
  selectedUser,
  currentUser,
  users,
}) => {
  const [inputText, setInputText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (selectedUser) {
      const msg: ClientMessage = {
        fromUserId: currentUser.userId,
        toUserId: selectedUser?.userId,
        content: inputText,
      };
      socket?.emit("chatMessage", msg);
      setInputText("");
    }
  };

  let userMessages: Message[] = [];
  if (selectedUser && chats[selectedUser.userId] !== undefined) {
    userMessages = chats[selectedUser.userId];
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userMessages]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-4 bg-card border-b">
        <h3 className="text-lg font-semibold text-card-foreground">
          {selectedUser
            ? `Chat with ${selectedUser.username}`
            : "No Chat Selected"}
        </h3>
      </div>

      <div className="flex-1 p-4 bg-background rounded-xl overflow-y-auto">
        <MessageDisplay
          messages={userMessages}
          currentUser={currentUser}
          users={users}
        />
        <div ref={messagesEndRef} />
      </div>

      <div className="gap-2 bg-card border-t items-center p-4 flex resize-none">
        <Textarea
          value={inputText}
          onChange={(e) => {
            if (e.target.value !== "\n") {
              setInputText(e.target.value);
            }
          }}
          //onKeyPress={handleSendMessage}
          onKeyPress={(event: React.KeyboardEvent<Textarea>) => {
            if (event.key == "Enter" && inputText.trim()) {
              handleSendMessage();
            }
          }}
          placeholder="Type a message"
        />
        <Button onClick={handleSendMessage} size="sm">
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;
