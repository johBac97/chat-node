import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
//import './Chat.css';
import ChatBox from './ChatBox';
import type { Message, UserPayload } from '../types/types';

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
    <div className="chat-interface">
      <div className="user-menu">
        <h3>Users</h3>
        {users.filter((u) => u.userId !== currentUser!.userId).map((user) => (
          <button
            key={user.username}
            onClick={() => setSelectedUser(user)}
            style={{ fontWeight: selectedUser?.username === user.username ? 'bold' : 'normal' }}
          >
            {user.username}
          </button>
        ))}
      </div>
	<ChatBox 
		messages={messages} 
		setMessages={setMessages} 
		socket={socket} 
		selectedUser={selectedUser} 
		currentUser={currentUser} 
		users={users}
	/>
    </div>
  );
};

export default Chat;
