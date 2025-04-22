import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import colorSwatches from "../../utils/colors";
import { useSocket } from "../context/SocketContext";
import { useParams } from "react-router-dom";
import DrawingState from "../components/DrawingState";
import Clock from "../components/Clock";

const DrawingPage = () => {
  const socket = useSocket();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil");
  const [lineWidth, setLineWidth] = useState(5);
  const [color, setColor] = useState("#000000");
  const [sizeSelected, setSizeSelected] = useState(10);
  const [selectedColor, setSelectedColor] = useState(null);
  const [gameChallenge, setGameChallenge] = useState("");

  const [gameStarted, setGameStarted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isPlayerDrawing, setIsPlayerDrawing] = useState(false);

  const { roomId } = useParams();

  // Challenge
  useEffect(() => {
    if (!socket) return;
    socket.emit("getChallenge", { roomId });
    const handleChallenge = data => setGameChallenge(data.challenge);
    socket.on("challenge", handleChallenge);
    return () => socket.off("challenge", handleChallenge);
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    // Get initial game state when component mounts
    socket.emit("getGameState", { roomId });

    // Listen for game state updates
    socket.on("gameStateUpdate", ({ isStarted, isDrawing }) => {
      setGameStarted(isStarted);
      setIsPlayerDrawing(isDrawing);
    });

    return () => {
      socket.off("gameStateUpdate");
    };
  }, [socket, roomId]);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
  }, []);

  // Update drawing tool & style
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = lineWidth;
  }, [tool, color, lineWidth]);

  // Helpers
  const hexToRgba = hex => {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 255];
  };

  // Flood fill implementation...
  const floodFill = (startX, startY) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const stack = [[startX, startY]];
    const startPos = (startY * width + startX) * 4;
    const startColor = data.slice(startPos, startPos + 4);
    const fillColor = hexToRgba(color);
    const colorsMatch = (a, b) => a.every((v, i) => v === b[i]);
    if (colorsMatch(startColor, fillColor)) return;

    while (stack.length) {
      let [x, y] = stack.pop();
      let pos = (y * width + x) * 4;
      while (y >= 0 && colorsMatch(data.slice(pos, pos + 4), startColor)) {
        y--;
        pos -= width * 4;
      }
      y++;
      pos += width * 4;
      let reachLeft = false;
      let reachRight = false;
      while (y < height && colorsMatch(data.slice(pos, pos + 4), startColor)) {
        // fill pixel
        data[pos] = fillColor[0];
        data[pos + 1] = fillColor[1];
        data[pos + 2] = fillColor[2];
        data[pos + 3] = fillColor[3];
        if (x > 0) {
          const leftPos = pos - 4;
          if (colorsMatch(data.slice(leftPos, leftPos + 4), startColor)) {
            if (!reachLeft) { stack.push([x - 1, y]); reachLeft = true; }
          } else reachLeft = false;
        }
        if (x < width - 1) {
          const rightPos = pos + 4;
          if (colorsMatch(data.slice(rightPos, rightPos + 4), startColor)) {
            if (!reachRight) { stack.push([x + 1, y]); reachRight = true; }
          } else reachRight = false;
        }
        y++;
        pos += width * 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // Drawing handlers
  const startDrawing = e => {
    if (isTimeUp || !gameStarted) return;
    const { offsetX, offsetY } = e.nativeEvent;
    if (tool === "bucket") return floodFill(offsetX, offsetY);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = e => {
    if (isTimeUp || !gameStarted || !isDrawing || tool === "bucket") return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const finishDrawing = () => {
    if (tool !== "bucket") ctxRef.current.closePath();
    setIsDrawing(false);
  };

  const handleBrushSize = size => {
    setLineWidth(size);
    setSizeSelected(size);
  };

  const handleDrawingState = () => {
    setIsPlayerDrawing(true);
    setGameStarted(true);
    socket.emit("updateGameState", {
      roomId,
      userId: localStorage.getItem("userId"),
      isStarted: true,
      isDrawing: true,
    });
  };

  const handleTimeUp = async () => {
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL("image/png");
    socket.emit("drawingDone", { roomId, imageData, challenge: gameChallenge });
  };

  return (
    <div className="h-screen grid grid-cols-[1fr_3fr_1fr] overflow-hidden">
      {/* Left Sidebar */}
      <aside className="p-4 border-r overflow-y-auto">
        <div className="flex flex-col space-y-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2 cursor-pointer"
            onClick={() => setTool("pencil")}
          >
            Pencil
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2 cursor-pointer"
            onClick={() => setTool("eraser")}
          >
            Eraser
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2 cursor-pointer"
            onClick={() => setTool("bucket")}
          >
            Bucket
          </motion.button>

          <div className="flex items-center space-x-2 mt-6">
            <span>Size:</span>
            { [5,10,15,20].map(size => (
              <motion.button
                key={size}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBrushSize(size)}
                className={
                  `cursor-pointer rounded-full border-2 p-2 h-${size/5*3} w-${size/5*3} ` +
                  (sizeSelected === size ? `border-black` : `border-transparent`)
                }
              />
            )) }
          </div>

          <div className="mt-6">
            {colorSwatches.map(swatch => (
              <div key={swatch.name} className="mb-2">
                <div className="flex justify-center space-x-2">
                  {swatch.shades.map(shade => (
                    <motion.button
                      key={shade}
                      className={
                        `cursor-pointer w-6 h-6 rounded border-2 ` +
                        (selectedColor === shade ? `border-black` : `border-transparent`)
                      }
                      style={{ backgroundColor: shade }}
                      onClick={() => { setColor(shade); setSelectedColor(shade); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex flex-col items-center justify-center space-y-4">
        <div className="text-xl font-bold">
          <Clock roomId={roomId}/>
        </div>
        <div className="font-semibold text-lg">
          Challenge: {gameChallenge}
        </div>
        <canvas
          ref={canvasRef}
          className={`border border-dashed ${isTimeUp ? "opacity-50 cursor-not-allowed" : "cursor-crosshair"}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
        />
      </main>

      {/* Right Sidebar */}
      <aside className="p-4 border-l overflow-y-auto">
        <DrawingState />
      </aside>
    </div>
  );
};

export default DrawingPage;
