import React from "react";
import type { Message, UserPayload } from "../types/types";
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

function formatMessage(message, index, users, currentUser) {
  let messageClassName = "";
  let userName = "";
  let otherUser = false;
  if (message.fromUserId === currentUser.userId) {
    otherUser = false;
    userName = currentUser.username;
  } else {
    otherUser = true;
    const usersDict = users.reduce(
      (dict, user) => {
        dict[user.userId] = user;
        return dict;
      },
      {} as Record<string, User>,
    );
    userName = usersDict[message.fromUserId].username;
  }

  messageClassName = "bg-muted p-0 rounded-xl max-w-xs break-words";

  if (otherUser) {
	  messageClassName = messageClassName + " self-end";
  } else {
	  messageClassName = messageClassName + " self-start";
	}

  return (
    <Card key={index} className={messageClassName}>
      <CardContent className="p-2">
        <strong>{userName}:</strong> {message.content}
      </CardContent>
    </Card>
  );
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  currentUser,
  users,
  selectedUser,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) =>
        formatMessage(message, index, users, currentUser),
      )}
    </div>
  );
};

export default MessageDisplay;
