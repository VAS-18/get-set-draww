import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { generateRoomCode } from "./utils/generate-room-code.js";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";
import words from "./utils/words.js";

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

// Map to track socket connections
const socketIdToPlayerMap = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Emit a unique userId to the client on connection
  const userId = uuidv4();
  socket.emit("userId", userId);

  socket.on("createRoom", async ({ nickname, theme, avatar }) => {
    try {
      const roomId = generateRoomCode();

      const challenge = await words(theme);

      const roomData = {
        theme,
        challenge,
        players: [
          {
            userId,
            socketId: socket.id,
            nickname,
            avatar,
            ready: false,
            disconnectTime: null,
            currentState: false,
          },
        ],
      };

      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
      socketIdToPlayerMap.set(socket.id, { roomId, userId });
      socket.join(roomId);

      // Emit room creation info
      socket.emit("roomCreated", { roomId, theme, userId });
      io.to(roomId).emit("playerUpdate", { players: roomData.players });

      // Emit the challenge to all players in the room
      io.to(roomId).emit("challenge", { challenge });
      console.log(
        `Room ${roomId} created with theme: ${theme} and challenge: ${challenge}`
      );
    } catch (error) {
      socket.emit("error", { message: "Failed to create room" });
      console.error("Error creating room:", error);
    }
  });

  socket.on(
    "joinRoom",
    async ({ roomId, nickname, avatar, userId: providedUserId }) => {
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

        const finalUserId = providedUserId || userId; // Use provided ID or new one
        const playerData = {
          userId: finalUserId,
          socketId: socket.id,
          nickname,
          avatar,
          ready: false,
          disconnectTime: null,
          isSubmitted: false,
        };
        roomData.players.push(playerData);

        await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
        socketIdToPlayerMap.set(socket.id, { roomId, userId: finalUserId }); // Track in Map
        socket.join(roomId);
        socket.emit("roomJoined", {
          roomId,
          theme: roomData.theme,
          userId: finalUserId,
        });
        io.to(roomId).emit("playerUpdate", { players: roomData.players });

        socket.emit("challenge", { challenge: roomData.challenge });

        console.log(`${nickname} joined room ${roomId}`);
      } catch (error) {
        socket.emit("error", { message: "Failed to join room" });
        console.error("Error joining room:", error);
      }
    }
  );

  // generates the challenge
  socket.on("getChallenge", async ({ roomId }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      socket.emit("challenge", { challenge: roomData.challenge });
    } catch (error) {
      console.error("Error getting challenge:", error);
      socket.emit("error", { message: "Failed to get challenge" });
    }
  });

  socket.on("gameState", async ({ roomId, playerId, readyState }) => {
    try {
      if (typeof readyState !== "boolean" || !roomId || !playerId) {
        socket.emit("error", { message: "Invalid game state data" });
        return;
      }

      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      const player = roomData.players.find((p) => p.userId === playerId);
      if (!player) {
        socket.emit("error", { message: "Player not found in room" });
        return;
      }

      player.ready = readyState;
      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
      io.to(roomId).emit("playerUpdate", { players: roomData.players });
      console.log(
        `Player ${playerId} set ready to ${readyState} in room ${roomId}`
      );
    } catch (error) {
      socket.emit("error", { message: "Failed to update game state" });
      console.error("Error updating game state:", error);
    }
  });

  socket.on("reconnectRoom", async ({ userId, roomId }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      const player = roomData.players.find((p) => p.userId === userId);
      if (!player) {
        socket.emit("error", { message: "Player not found in room" });
        return;
      }

      player.socketId = socket.id; // Update to new socket ID
      player.disconnectTime = null; // Clear disconnection status
      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));

      socketIdToPlayerMap.set(socket.id, { roomId, userId }); // Update Map
      socket.join(roomId);
      socket.emit("roomRejoined", { roomId, theme: roomData.theme, userId });
      io.to(roomId).emit("playerUpdate", { players: roomData.players });
      console.log(`User ${userId} rejoined room ${roomId}`);
    } catch (error) {
      socket.emit("error", { message: "Failed to reconnect to room" });
      console.error("Error reconnecting:", error);
    }
  });

  socket.on("DrawingState", async ({ roomId, userId, isDrawing }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      const player = roomData.players.find((p) => p.userId == userId);

      if (player) {
        player.isDrawing = isDrawing;
        await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
        io.to(roomId).emit("playerUpdate", { players: roomData.players });
      }
    } catch (error) {
      socket.emit("error", {
        message: "Failed to send DrawingState to the room",
      });
      console.error("Failed to send DrawingState to the room", error);
    }
  });

  socket.on("getPlayers", async ({ roomId }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (roomDataString) {
          const roomData = JSON.parse(roomDataString);
          socket.emit("playerUpdate", { 
              players: roomData.players || [] 
          });
          console.log("Sending players:", roomData.players);
      } else {
          socket.emit("playerUpdate", { players: [] });
          console.log("No room data found for:", roomId);
      }
  } catch (error) {
      console.error("Error fetching players:", error);
      socket.emit("error", { message: "Failed to fetch players" });
  }
  });

  socket.on("getGameState", async ({ roomId }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      socket.emit("gameStateUpdate", {
        isStarted: roomData.gameStarted || false,
        isDrawing: roomData.isDrawing || false
      });
    } catch (error) {
      console.error("Error getting game state:", error);
      socket.emit("error", { message: "Failed to get game state" });
    }
  });

  socket.on("updateGameState", async ({ roomId, userId, isStarted, isDrawing }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      roomData.gameStarted = isStarted;
      roomData.isDrawing = isDrawing;

      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
      io.to(roomId).emit("gameStateUpdate", { isStarted, isDrawing });
    } catch (error) {
      console.error("Error updating game state:", error);
      socket.emit("error", { message: "Failed to update game state" });
    }
  });

  //Timer logic
  socket.on("getTimerState", async ({ roomId }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      if (roomData.timerState) {
        socket.emit("timerUpdate", roomData.timerState);
      }
    } catch (error) {
      console.error("Error getting timer state:", error);
      socket.emit("error", { message: "Failed to get timer state" });
    }
  });

  socket.on("updateTimer", async ({ roomId, remainingTime, running }) => {
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      const roomData = JSON.parse(roomDataString);
      roomData.timerState = { remainingTime, running };
      
      await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
      io.to(roomId).emit("timerUpdate", { remainingTime, running });
    } catch (error) {
      console.error("Error updating timer:", error);
      socket.emit("error", { message: "Failed to update timer" });
    }
  });


  //Player disconnect logic
  socket.on("disconnect", async () => {
    const playerInfo = socketIdToPlayerMap.get(socket.id);
    if (!playerInfo) {
      console.log("No player info found for socket:", socket.id);
      return;
    }

    const { roomId, userId } = playerInfo;
    try {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) {
        socketIdToPlayerMap.delete(socket.id);
        return;
      }

      const roomData = JSON.parse(roomDataString);
      const player = roomData.players.find((p) => p.userId === userId);
      if (player) {
        player.socketId = null; // Mark as disconnected
        player.disconnectTime = Date.now(); // Record disconnection time
        await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
        io.to(roomId).emit("playerUpdate", { players: roomData.players });
        console.log(`User ${userId} disconnected from room ${roomId}`);
      }

      socketIdToPlayerMap.delete(socket.id); // Remove from Map
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
});

setInterval(async () => {
  try {
    const roomKeys = await redisClient.keys("*");
    for (const roomId of roomKeys) {
      const roomDataString = await redisClient.get(roomId);
      if (!roomDataString) continue;

      const roomData = JSON.parse(roomDataString);
      const currentTime = Date.now();
      const threshold = 300000; // 5 minutes

      const updatedPlayers = roomData.players.filter((p) => {
        if (p.socketId) return true; // Keep connected players
        return currentTime - p.disconnectTime <= threshold; // Keep recently disconnected
      });

      if (updatedPlayers.length < roomData.players.length) {
        roomData.players = updatedPlayers;
        await redisClient.setEx(roomId, 3600, JSON.stringify(roomData));
        io.to(roomId).emit("playerUpdate", { players: updatedPlayers });
        console.log(`Cleaned up disconnected players in room ${roomId}`);
      }

      if (updatedPlayers.length === 0) {
        await redisClient.del(roomId);
        console.log(`Room ${roomId} deleted due to no players`);
      }
    }
  } catch (error) {
    console.error("Error in cleanup task:", error);
  }
}, 60000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
