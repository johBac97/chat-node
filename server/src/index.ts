import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "OPTION"],
  },
});

interface Message {
  toUserId: string;
  fromUserId: string;
  content: string;
  id: string;
  timestamp: string;
}

interface MessageClient {
  toUserId: string;
  fromUserId: string;
  content: string;
  id: string | null;
  timestamp: string | null;
}

interface User {
  username: string;
  userId: string;
  socketId: string | null;
  online: boolean;
}

interface RegisterUser {
  username: string;
}

interface UserPayload {
  username: string;
  userId: string;
  online: boolean;
}

interface Chat {
  messages: Message[];
}

function normalize_key(s1: string, s2: string): string {
  return s1 < s2 ? `${s1}_${s2}` : `${s2}_${s1}`;
}

const users: { [userId: string]: User } = {};
const chats: { [key: string]: { messages: Message[] } } = {};

io.on("connection", (socket) => {
  var socketUserId: string | null = null;

  socket.on("chatMessage", (msgClient: MessageClient) => {
    const key = normalize_key(msgClient.toUserId, msgClient.fromUserId);

    // TODO: make sure user exists
    if (!(key in chats)) {
      chats[key] = {
        messages: [],
      };
    }

    let msg = {
      toUserId: msgClient.toUserId,
      fromUserId: msgClient.fromUserId,
      content: msgClient.content,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID().split("-")[0],
    };
    chats[key].messages.push(msg);

    if (users[msg.fromUserId]?.online) {
      io.to(users[msg.fromUserId].socketId!).emit("chatMessage", msg);
    }

    if (users[msg.toUserId]?.online) {
      io.to(users[msg.toUserId].socketId!).emit("chatMessage", msg);
    }

    console.log("Chat Message:", msg);
  });

  socket.on("registerConnection", ({ userId }) => {
    console.log(`Registering connection:`, userId);
    // Check so that there exists a logged in user with this userId
    if (users[userId] === undefined) {
      console.error("User is undefined:", userId);
    } else {
      users[userId].socketId = socket.id;
      socketUserId = userId;
    }

    const userList: UserPayload[] = Object.values(users).map((u) => ({
      username: u.username,
      userId: u.userId,
      online: u.online,
    }));
    io.emit("userList", userList);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socketUserId);
    const userList: UserPayload[] = Object.values(users).map((u) => ({
      username: u.username,
      userId: u.userId,
      online: u.online,
    }));
    io.emit("userList", userList);
  });

  socket.on("userSelected", ({ userId }) => {
    const key = normalize_key(socketUserId!, userId);

    if (!(key in chats)) {
      // No chat between these users. Do nothing
      return;
    }

    for (let msg of chats[key].messages) {
      io.to(users[socketUserId!].socketId!).emit("chatMessage", msg);
    }
  });
});

app.post("/login", (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const userId = crypto.randomUUID().split("-")[0];
  const user: User = { username, socketId: null, userId, online: true };
  users[userId] = user;

  return res.status(200).json({
    username: username,
    userId: userId,
    online: true,
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Chat Backend is running!");
});

app.get("/users", (req: Request, res: Response) => {
  const userList: UserPayload[] = Object.values(users).map((u) => ({
    username: u.username,
    userId: u.userId,
    online: u.online,
  }));

  res.send(userList);
});

const PORT = 4000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
