import React, { useRef, useState, useEffect } from "react";
import * as motion from "motion/react-client";
import colorSwatches from "../../utils/colors";
import { useSocket } from "../context/SocketContext";
import { useParams } from "react-router-dom";

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
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameStarted, setGameStarted] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const {roomId} = useParams();


  //Challenge
  useEffect(() => {
    if (!socket) return;
    
    socket.emit("getChallenge", { roomId });
    
    const handleChallenge = (data) => {
      console.log("Received challenge:", data);
      setGameChallenge(data.challenge);
    };
    
    socket.on("challenge", handleChallenge);
    
    return () => {
      socket.off("challenge", handleChallenge);
    };
  }, [socket]);


  // Initialize canvas and context
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

  // Update context when tool, color, or lineWidth changes
  useEffect(() => {
    if (ctxRef.current) {
      if (tool === "eraser") {
        ctxRef.current.globalCompositeOperation = "destination-out";
      } else {
        ctxRef.current.globalCompositeOperation = "source-over";
        ctxRef.current.strokeStyle = color;
      }
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [tool, color, lineWidth]);

  const hexToRgba = (hex) => {
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 255];
  };

  // Flood-fill algorithm for the paint bucket tool (Thank you yt T_T)
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

    // Function to compare two colors (arrays of [r, g, b, a])
    const colorsMatch = (a, b) =>
      a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

    // If the starting pixel is already the fill color, nothing to do.
    if (colorsMatch(startColor, fillColor)) return;

    while (stack.length) {
      let [x, y] = stack.pop();
      let currentPos = (y * width + x) * 4;

      // Move upward to find the top boundary of the area to fill.
      while (
        y >= 0 &&
        colorsMatch(data.slice(currentPos, currentPos + 4), startColor)
      ) {
        y--;
        currentPos -= width * 4;
      }

      // Step back to the valid position
      y++;
      currentPos += width * 4;
      let reachLeft = false;
      let reachRight = false;

      // Fill downward and push adjacent pixels on the stack when needed.
      while (
        y < height &&
        colorsMatch(data.slice(currentPos, currentPos + 4), startColor)
      ) {
        // Fill the current pixel with the new color.
        data[currentPos] = fillColor[0];
        data[currentPos + 1] = fillColor[1];
        data[currentPos + 2] = fillColor[2];
        data[currentPos + 3] = fillColor[3];

        // Check left pixel.
        if (x > 0) {
          const leftPos = currentPos - 4;
          if (colorsMatch(data.slice(leftPos, leftPos + 4), startColor)) {
            if (!reachLeft) {
              stack.push([x - 1, y]);
              reachLeft = true;
            }
          } else {
            reachLeft = false;
          }
        }

        // Check right pixel.
        if (x < width - 1) {
          const rightPos = currentPos + 4;
          if (colorsMatch(data.slice(rightPos, rightPos + 4), startColor)) {
            if (!reachRight) {
              stack.push([x + 1, y]);
              reachRight = true;
            }
          } else {
            reachRight = false;
          }
        }
        y++;
        currentPos += width * 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // Start drawing or apply the paint bucket if that tool is selected.
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    if (tool === "bucket") {
      floodFill(offsetX, offsetY);
      return;
    }
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || tool === "bucket") return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const finishDrawing = () => {
    if (tool !== "bucket") {
      ctxRef.current.closePath();
    }
    setIsDrawing(false);
  };

  //on click this fucn changes the size of the current brush
  const handleBrushSize = (size) => {
    setLineWidth(size);
    setSizeSelected(size);
  };

  const buttonStyle = [
    { size: 5, className: "h-2 w-2" },
    { size: 10, className: "h-6 w-6" },
    { size: 15, className: "h-9 w-9" },
    { size: 20, className: "h-12 w-12" },
  ];

  return (
    <div className="h-screen grid grid-cols-[1fr_3fr_1fr] overflow-hidden">
      {/* Left Sidebar */}
      <div className="p-4 border-r">
        <div className="flex flex-col space-y-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2"
            onClick={() => setTool("pencil")}
          >
            Pencil
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2"
            onClick={() => setTool("eraser")}
          >
            Eraser
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="border p-2"
            onClick={() => setTool("bucket")}
          >
            Bucket
          </motion.button>

          <div className="flex space-x-4 items-center my-10">
            <span>Size : </span>
            {buttonStyle.map((btn) => (
              <motion.button
                key={btn.size}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleBrushSize(btn.size)}
                className={`bg-gray-400 border-2 p-2 rounded-full ${
                  btn.className
                } ${
                  sizeSelected === btn.size
                    ? "border-3 border-black"
                    : "border-transparent"
                }`}
              />
            ))}
          </div>
          <div className="">
            {colorSwatches.map((swatch) => (
              <div key={swatch.name} className="mb-1">
                <div className="flex justify-center">
                  {swatch.shades.map((shade) => (
                    <motion.button
                      key={shade}
                      className={`w-6 h-6 border ${
                        selectedColor === shade
                          ? "border-black"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: shade }}
                      onClick={() => setColor(shade)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex flex-col justify-center items-center">
        <div>
          {gameChallenge}
        </div>
        <canvas
          ref={canvasRef}
          className="border border-dashed"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={finishDrawing}
          onMouseLeave={finishDrawing}
        />
      </div>

      {/* Right Sidebar */}
      <div className="p-4 border-l"></div>
    </div>
  );
};

export default DrawingPage;
