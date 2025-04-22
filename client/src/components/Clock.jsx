import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const Clock = ({ roomId }) => {
  const [timeLeft, setTimeLeft] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const navigate = useNavigate();
  const socket = useSocket();

  // Initialize timer and game state
  useEffect(() => {
    if (!socket) return;

    // Get current timer state from server
    socket.emit("getTimerState", { roomId });
    
    // Get current game state
    socket.emit("getGameState", { roomId });
    socket.emit("getPlayers", { roomId });

    socket.on("timerUpdate", ({ remainingTime, running }) => {
      setTimeLeft(remainingTime);
      setIsRunning(running);
    });

    socket.on("playerUpdate", ({ players }) => {
      if (players && players.length === 2) {
        // Only start timer if it's not already running
        if (!isRunning) {
          const newTime = 120;
          setTimeLeft(newTime);
          setIsRunning(true);
          socket.emit("updateTimer", {
            roomId,
            remainingTime: newTime,
            running: true
          });
          socket.emit("updateGameState", {
            roomId,
            isStarted: true,
            isDrawing: true
          });
        }
      }
    });

    socket.on("gameStateUpdate", ({ isStarted, isDrawing }) => {
      if (isStarted && isDrawing) {
        setIsRunning(true);
      }
    });

    return () => {
      socket.off("playerUpdate");
      socket.off("gameStateUpdate");
      socket.off("timerUpdate");
    };
  }, [socket, roomId, isRunning]);

  useEffect(() => {
    let intervalId;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(intervalId);
            setIsRunning(false);
            // Emit time up event to server
            if (socket) {
              socket.emit("updateTimer", {
                roomId,
                remainingTime: 0,
                running: false
              });
              socket.emit("updateGameState", {
                roomId,
                isStarted: false,
                isDrawing: false
              });
            }
            // Navigate to score page
            navigate(`/score/${roomId}`);
            return 0;
          }
          // Update server with new time
          socket.emit("updateTimer", {
            roomId,
            remainingTime: newTime,
            running: true
          });
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, roomId, socket, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Time Left</h2>
      <div className="text-5xl font-mono font-semibold text-gray-900 my-6">
        {formatTime(timeLeft)}
      </div>
      <p className={`text-sm mt-4 ${
        timeLeft === 0 ? "text-red-500 font-medium" : "text-gray-500"
      }`}>
        {timeLeft === 0 ? "Time's up!" : (isRunning ? "Game in progress" : "Waiting for players...")}
      </p>
    </div>
  );
};

export default Clock;
