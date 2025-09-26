import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import ChatBox from "./ChatBox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Message, UserPayload } from "../types/types";

const SOCKET_SERVER_URL = "http://localhost:4000";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
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

      console.log(`currentUser: ${user.username}`);

      newSocket.emit("registerConnection", { userId: user.userId });

      newSocket.on("userList", (users: UserPayload[]) => {
        setUsers(users.filter((u) => u.userId !== currentUser?.userId));
      });

      newSocket.on("chatMessage", (msg: Message) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });
    };

    initializeSocket();

    return () => {
      socket?.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <div className="size-full h-screen w-screen p-8 flex-row flex m-2">
      <div className="border w-1/4 flex flex-col rounded m-2 bg-secondary">
        <div className="p-1">
          <header className="text-center text-xl font-large font-extrabold text-balance align-middle">
            Users
          </header>
        </div>
        <Separator clasName="my-4" />
        <div className="flex flex-col ">
          {users
            .filter((u) => u.userId !== currentUser!.userId)
            .map((user) => (
              <div className="flex flex-col">
                <Button
                  key={user.username}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    fontWeight:
                      selectedUser?.username === user.username
                        ? "bold"
                        : "normal",
                  }}
                >
                  {user.username}
                </Button>
              </div>
            ))}
        </div>
      </div>
      <div className="flex-1 m-2">
        <ChatBox
          messages={messages}
          setMessages={setMessages}
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
