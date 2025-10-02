import type { Message, Chats, UserPayload } from "@/types/types";
import React from "react";

export function receieveMessage(
  message: Message,
  currentUser: UserPayload,
  setChats: React.Dispatch<React.SetStateAction<Chats>>,
) {
  let otherUserId = undefined;
  console.log(`currentUser: ${currentUser}`);
  if (message.fromUserId === currentUser?.userId) {
    otherUserId = message.toUserId;
  } else {
    otherUserId = message.fromUserId;
  }

  setChats((prev) => {
    const alreadyReceieved =
      prev[otherUserId]?.some((m) => m.id === message.id) || false;
    if (alreadyReceieved) {
      return prev;
    }
    console.log(`receieved message:${JSON.stringify(message)}`);

    return {
      ...prev,
      [otherUserId]: [...(prev[otherUserId] || []), message],
    };
  });
}
