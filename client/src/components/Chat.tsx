import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import ChatBox from "./ChatBox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Message, UserPayload, Chats } from "../types/types";
import UserSelectionButton from "@/components/UserSelectionButton";
import { receieveMessage } from "@/components/messageReceiever";

const SOCKET_SERVER_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const Chat: React.FC = () => {
  const [chats, setChats] = useState<Chats>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [users, setUsers] = useState<UserPayload[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserPayload | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPayload | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    const initializeSocket = async () => {
      const user: UserPayload = JSON.parse(localStorage.getItem("user")!);
      setCurrentUser(user);

      newSocket.emit("registerConnection", { userId: user.userId });

      newSocket.on("userList", (updatedUsers: UserPayload[]) => {
        setUsers(() => {
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
    <div className="flex flex-col h-screen bg-background">
      <header className="flex h-1/20 items-center justify-between p-4 bg-primary text-primary-foreground shadow-md">
        <h1 className="text-xl font-bold">Chat App</h1>
        <div className="flex items-center gap-2">
          <span className="text-md font-bold">{currentUser?.username}</span>
          <Button variant="ghost" size="icon">
            Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/5 md:2-1/5 bg-secondary border-r p-4 sticky top-0 rounded-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Online Users</h2>
          <Separator className="mb-4" />
          {users
            .filter((u) => u.userId !== currentUser!.userId)
            .map((user, index) => (
              <UserSelectionButton
                key={index}
                setSelectedUser={setSelectedUser}
                selectedUser={selectedUser}
                user={user}
                socket={socket!}
              />
            ))}
        </aside>

        <main className="flex-col flex flex-1 overflow-hidden">
          {selectedUser ? (
            <ChatBox
              chats={chats}
              socket={socket!}
              selectedUser={selectedUser}
              currentUser={currentUser!}
              users={users}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a user to start chatting!
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
