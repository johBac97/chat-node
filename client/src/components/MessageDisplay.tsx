import React from "react";
import type { Message, UserPayload } from "../types/types";

interface MessageDisplayProps {
  messages: list[Message];
  currentUser: UserPayload;
  users: list[UserPayload];
  selectedUser: UserPayload;
}

function formatMessage(message, index, users, currentUser) {
  let messageClassName = "";
  let userName = "";
  if (message.fromUserId === currentUser.userId) {
    messageClassName = "current-user-message";
    userName = currentUser.username;
  } else {
    messageClassName = "other-user-message";
    const usersDict = users.reduce(
      (dict, user) => {
        dict[user.userId] = user;
        return dict;
      },
      {} as Record<string, User>,
    );
    userName = usersDict[message.fromUserId].username;
  }

  return (
    <div key={index} className={messageClassName}>
      <strong>{userName}:</strong> {message.content}
    </div>
  );
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  currentUser,
  users,
  selectedUser,
}) => {
  return (
      <div>
        {messages.map((message, index) =>
          formatMessage(message, index, users, currentUser),
        )}
      </div>
  );
};

export default MessageDisplay;
