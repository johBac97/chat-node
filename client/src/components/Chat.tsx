import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import ChatBox from "./ChatBox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Message, UserPayload, Chats } from "../types/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import UserSelectionButton from "@/components/UserSelectionButton";
import { receieveMessage } from "@/components/messageReceiever";

const SOCKET_SERVER_URL = "http://localhost:4000";

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chats>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<UserPayload[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPayload | null>();
  const [currentUser, setCurrentUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    const initializeSocket = async () => {
      const user: UserPayload = JSON.parse(localStorage.getItem("user")!);
      setCurrentUser(user);

      newSocket.emit("registerConnection", { userId: user.userId });

      newSocket.on("userList", (updatedUsers: UserPayload[]) => {
        setUsers((prev) => {
          return updatedUsers;
        });
      });
    };

    initializeSocket();

    return () => {
      socket?.disconnect();
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    if (!socket || !currentUser) return;

    socket!.on("chatMessage", (msg: Message) => {
      receieveMessage(msg, currentUser, setChats);
    });
  }, [socket, currentUser]);

  return (
    <div className="size-full h-screen w-screen p-8 flex-row flex m-2">
      <div className="border w-1/6 flex flex-col overflow-y-auto rounded-xl m-2 bg-secondary">
        <div className="p-1">
          <header className="text-center text-xl font-large font-extrabold text-balance align-middle">
            Users
          </header>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col">
          {users
            .filter((u) => u.userId !== currentUser!.userId)
            .map((user, index) => (
              <UserSelectionButton
                key={index}
                setSelectedUser={setSelectedUser}
                selectedUser={selectedUser}
                user={user}
              />
            ))}
        </div>
      </div>
      <div className="flex-1 m-2">
        <ChatBox
          chats={chats}
          socket={socket}
          selectedUser={selectedUser}
          currentUser={currentUser}
          users={users}
        />
      </div>
    </div>
  );
};

export default Chat;
