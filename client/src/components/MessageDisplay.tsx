import React from "react";
import type { Message, UserPayload } from "../types/types";
import { cn } from "@/lib/utils";

interface MessageDisplayProps {
  messages: Message[];
  currentUser: UserPayload;
  users: UserPayload[];
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  currentUser,
  users,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message: Message, index: number) => {
        const isSender = message.senderId === currentUser.userId;
        const sender = users.find(
          (u: UserPayload) => u.userId === message.senderId,
        );

        return (
          <div
            key={index}
            className={cn(
              "max-w-xs px-4 py-2 rounded-2xl shadow-sm animate-fade-in break-words md:break-words",
              isSender
                ? "self-end bg-chat-bubble-self text-primary-foreground"
                : "self-start bg-chat-bubble-other text-muted-foreground",
            )}
          >
            <p className="text-sm font-semibold">{sender?.username}</p>
            <p>{message.content}</p>
            <span className="text-xs opacity-70">
              Sent at {new Date(message.timestamp!).toLocaleString("en-SE")}
            </span>
            {}
            {}
          </div>
        );
      })}
    </div>
  );
};

export default MessageDisplay;
