import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { randomUUID } from "crypto";
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cookie from "cookie";

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
    credentials: true,
  }),
);

app.use(cookieParser());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTION"],
    credentials: true,
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

const JWT_SECRET = process.env.JWT_SECRET as string;

async function initDB() {
  try {
    await pool.query(`
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

		CREATE TABLE IF NOT EXISTS users (
			user_id VARCHAR(255) PRIMARY KEY,
			username VARCHAR(255) NOT NULL UNIQUE,
			password VARCHAR(255) NOT NULL,
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

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.cookies.accessToken;

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    (req as any).user = user;
    next();
  });
};

io.use((socket, next) => {
  const rawCookie = socket.handshake.headers.cookie;

  if (!rawCookie) return next(new Error("No cookie"));

  const parsed = cookie.parse(rawCookie);
  const token = parsed.accessToken;

  if (!token) return next(new Error("No token"));

  try {
    const payload = jwt.verify(token, JWT_SECRET as string);
    socket.data.user = payload;
    next();
  } catch (err: any) {
    next(new Error("Invalid token"));
  }
});

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
    } catch (err: any) {
      console.error("Error getting chat message: ", err);
    }
  });

  socket.on("registerConnection", async () => {
    console.log(`Registering connection:${JSON.stringify(socket.data.user)}`);

    try {
      const userId = socket.data.user.userId;
      const result = await pool.query(
        "UPDATE users SET online = TRUE WHERE user_id = $1 RETURNING user_id, username, online;",
        [userId],
      );

      const userResult = await pool.query(
        "SELECT user_id, username, online FROM users;",
      );

      userIdToSocket.set(userId, socket);

      const userList = userResult.rows.map((user) => ({
        userId: user.user_id,
        username: user.username,
        online: user.online,
      }));

      io.emit("userList", userList);
    } catch (err: any) {
      console.error("Error registring connection:", err);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await pool.query("UPDATE users SET online = FALSE WHERE user_id = $1", [
        socket.data.user.userId,
      ]);
      const userResult = await pool.query(
        "SELECT user_id, username, online FROM users",
      );

      io.emit(
        "userList",
        userResult.rows.map((r) => ({
          userId: r.user_id,
          username: r.username,
          online: r.online,
        })),
      );
    } catch (err: any) {
      console.error("Error disconnct:", err);
    }
  });

  socket.on("userSelected", async ({ userId }) => {
    try {
      const messages = await pool.query(
        "SELECT id, sender_id, recipient_id, content, timestamp FROM messages WHERE (sender_id = $1 and recipient_id = $2) OR (sender_id = $2 and recipient_id = $1)",
        [userId, socket.data.user.userId],
      );

      const parsedMessages = messages.rows.map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        content: row.content,
        timestamp: row.timestamp,
      }));

      for (let msg of parsedMessages) {
        socket.emit("chatMessage", msg);
      }
    } catch (err: any) {
      console.error("Error retreieving chat history:", err);
    }
  });
});

app.post("/api/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const result = await pool.query(
      "INSERT INTO users (user_id, username, password, online) VALUES ($1, $2, $3, $4) RETURNING user_id, username, online",
      [userId, username, hashedPassword, false],
    );
    const user = result.rows[0];

    console.log(`User has signed up:\t${JSON.stringify(user)}`);

    res.status(201).json({ succes: true });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username already taken" });
    }
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    await pool.query("UPDATE users SET online = TRUE WHERE user_id = $1", [
      user.user_id,
    ]);

    const token = jwt.sign(
      { userId: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      user: { userId: user.user_id, username: user.username, online: true },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Chat Backend is running!");
});

app.get("/api/health", async (req: Request, res: Response) => {
  res.send("Chat Backend is running!");
});

app.get(
  "/api/users",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT user_id, username, online FROM users;",
      );
      res.status(200).json(result.rows);
    } catch (err: any) {
      console.error("Get users error:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  },
);

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
