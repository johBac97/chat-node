import React from "react";
import type { Message, UserPayload } from "../types/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

interface MessageDisplayProps {
  messages: list[Message];
  currentUser: UserPayload;
  users: list[UserPayload];
  selectedUser: UserPayload;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  currentUser,
  users,
  selectedUser,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((message, index) => {
        const isSender = message.fromUserId === currentUser.userId;
        const sender = users.find((u) => u.userId === message.fromUserId);

        return (
          <div
            key={index}
            className={cn(
              "max-w-xs px-4 py-2 rounded-2xl shadow-sm animate-fade-in",
              isSender
                ? "self-end bg-chat-bubble-self text-primary-foreground"
                : "self-start bg-chat-bubble-other text-muted-foreground",
            )}
          >
            <p className="text-sm font-semibold">{sender?.username}</p>
            <p>{message.content}</p>
            <span className="text-xs opacity-70">
              Sent at {new Date(message.timestamp).toLocaleString("en-SE")}
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
