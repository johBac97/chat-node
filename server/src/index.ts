import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://frontend:3000",
  "https://frontend:3000",
];

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTION"],
  },
});

interface Message {
  id: string;
  recipientId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

interface MessageClient {
  recipientId: string;
  senderId: string;
  content: string;
  id: string | null;
  timestamp: string | null;
}

interface User {
  username: string;
  userId: string;
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

const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "db",
  database: process.env.POSTGRES_DB || "chat_db",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
});

async function initDB() {
  try {
    await pool.query(`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

		CREATE TABLE IF NOT EXISTS users (
			user_id VARCHAR(255) PRIMARY KEY,
			username VARCHAR(255) NOT NULL UNIQUE,
			online BOOLEAN DEFAULT FALSE
		);

		CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			sender_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
			recipient_id VARCHAR(255) NOT NULL REFERENCES users(user_id),
			content TEXT NOT NULL,
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);

	 `);
    console.log("Database initialized!");
  } catch (err) {
    console.error("Error initializing database: ", err);
  }
}

const userIdToSocket = new Map<string, Socket>();

io.on("connection", (socket) => {
  socket.on("chatMessage", async (msgClient: MessageClient) => {
    try {
      const result = await pool.query(
        "INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *",
        [msgClient.senderId, msgClient.recipientId, msgClient.content],
      );

      const savedMessage = result.rows[0];

      const message: Message = {
        id: savedMessage.id,
        senderId: savedMessage.sender_id,
        recipientId: savedMessage.recipient_id,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
      };

      const recipientSocket = userIdToSocket.get(message.recipientId);
      const senderSocket = userIdToSocket.get(message.senderId);

      if (senderSocket) senderSocket.emit("chatMessage", message);
      if (recipientSocket) recipientSocket.emit("chatMessage", message);
    } catch (err) {
      console.error("Error getting chat message: ", err);
    }
  });

  socket.on("registerConnection", async ({ userId }) => {
    console.log(`Registering connection:`, userId);

    try {
      userIdToSocket.set(userId, socket);
      const result = await pool.query(
        "UPDATE users SET online = TRUE WHERE user_id = $1 RETURNING user_id, username, online",
        [userId],
      );

      // Attach the user object to the socket handle
      const user: User = {
        userId: result.rows[0].user_id,
        username: result.rows[0].username,
        online: result.rows[0].online,
      };

      socket.data.user = user;

      const userResult = await pool.query(
        "SELECT user_id, username, online FROM users",
      );

      const userList = userResult.rows.map((user) => ({
        userId: user.user_id,
        username: user.username,
        online: user.online,
      }));

      io.emit("userList", userList);
    } catch (err) {
      console.error("Error registring connection:", err);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await pool.query("UPDATE users SET online = FALSE WHERE user_id = $1", [
        socket.data.user,
      ]);
      const userResult = await pool.query(
        "SELECT user_id, username, online FROM users",
      );

      io.emit("userList", userResult.rows);
    } catch (err) {
      console.error("Error disconnct:", err);
    }
  });

  socket.on("userSelected", async ({ userId }) => {
    try {
      console.log(
        `Retreiving messeages for user ${JSON.stringify(socket.data.user)} and target ${userId}`,
      );
      const messages = await pool.query(
        "SELECT (id, sender_id, recipient_id, content, timestamp ) FROM messages WHERE (sender_id = $1 and recipient_id = $2) OR (sender_id = $2 and recipient_id = $1)",
        [userId, socket.data.user.userId],
      );

      const parsedMessages = messages.rows.map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipientId,
        content: row.content,
        timestamp: row.timestamp,
      }));

      for (let msg of parsedMessages) {
        socket.emit("chatMessage", msg);
      }
    } catch (err) {
      console.error("Error retreieving chat history:", err);
    }
  });
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const userId = crypto.randomUUID().split("-")[0];
  try {
    const result = await pool.query(
      "INSERT INTO users (user_id, username, online) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING RETURNING *",
      [userId, username, true],
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Username already taken" });
    }
    const user = result.rows[0];

    console.log(`Created user:\t${JSON.stringify(user)}`);

    res.status(200).json({
      username: user.username,
      userId: user.user_id,
      online: user.online,
    });
  } catch (err) {
    console.error("Login error:\t", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Chat Backend is running!");
});

app.get("/api/health", async (req: Request, res: Response) => {
  res.send("Chat Backend is running!");
});

app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT user_id, username, online FROM users",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

const PORT = 4000;

httpServer.listen(PORT, async () => {
  console.log(
    `Database config:\t${JSON.stringify({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT,
    })}`,
  );

  await initDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
