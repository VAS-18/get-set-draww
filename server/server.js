import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { generateRoomCode } from "./utils/generate-room-code.js";
import { createClient } from "redis";

// dotenv configuration
dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());

// io Initialization
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});

// Redis Client Setup
const redisClient = createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("Connected to Redis"));
await redisClient.connect();

io.on("connect", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("createRoom", async ({ nickname, theme }) => {
    try {
      const roomId = generateRoomCode();
      const roomData = {
        theme,
        players: [{ socketId: socket.id, nickname, ready: false }],
      };

      // Store room in Redis with 1-hour expiration
      await redisClient.setEx(roomId, 300, JSON.stringify(roomData));
      socket.join(roomId);
      socket.emit("roomCreated", { roomId, theme });
      console.log(`Room ${roomId} created with theme: ${theme}`);
    } catch (error) {
      socket.emit("error", { message: "Failed to create room" });
      console.error("Error creating room:", error);
    }
  });

  socket.on("joinRoom", async ({ roomId, nickname }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      if (roomData.players.length >= 2) {
        socket.emit("error", { message: "Room is full" });
        return;
      }

      roomData.players.push({ socketId: socket.id, nickname, ready: false });
      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));

      socket.join(roomId);
      socket.emit("roomJoined", { roomId, theme: roomData.theme });
      io.to(roomId).emit("playerUpdate", { players: roomData.players });
      console.log(`${nickname} joined room ${roomId}`);
    } catch (error) {
      socket.emit("error", { message: "Failed to join room" });
      console.error("Error joining room:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const roomKeys = await redisClient.keys("*"); // Get all room keys
      for (const roomId of roomKeys) {
        const roomDataString = await redisClient.get(roomId);
        if (!roomDataString) continue; // Skip if room expired
        const roomData = JSON.parse(roomDataString);

        const updatedPlayers = roomData.players.filter(
          (p) => p.socketId !== socket.id
        );
        if (updatedPlayers.length === 0) {
          await redisClient.del(roomId);
          console.log(`Room ${roomId} deleted`);
        } else if (updatedPlayers.length < roomData.players.length) {
          roomData.players = updatedPlayers;
          await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
          io.to(roomId).emit("playerUpdate", { players: roomData.players });
        }
      }
      console.log("A user disconnected:", socket.id);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
