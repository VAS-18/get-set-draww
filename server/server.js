import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import { generateRoomCode } from "./utils/generate-room-code.js";
import Room from "./models/roomModel.js";

// dotenv configuration
dotenv.config();

const app = express();
const server = http.createServer(app);
connectDB();
app.use(express.json());

// io Initialization
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connect", (socket) => {
  console.log("A user connected:", socket.id);
});


// Uncomment and modify as needed for proper port configuration
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
