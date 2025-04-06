import React, { useRef, useState, useEffect } from 'react';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil'); // options: pencil, eraser, bucket
  const [lineWidth, setLineWidth] = useState(5);
  const [color, setColor] = useState('#000000');

  // Initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
  }, []);

  // Update context when tool, color, or lineWidth changes
  useEffect(() => {
    if (ctxRef.current) {
      if (tool === 'eraser') {
        ctxRef.current.globalCompositeOperation = 'destination-out';
      } else {
        ctxRef.current.globalCompositeOperation = 'source-over';
        ctxRef.current.strokeStyle = color;
      }
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [tool, color, lineWidth]);

  const hexToRgba = (hex) => {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b, 255];
  };

  // Flood-fill algorithm for the paint bucket tool
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
      while (y >= 0 && colorsMatch(data.slice(currentPos, currentPos + 4), startColor)) {
        y--;
        currentPos -= width * 4;
      }

      // Step back to the valid position
      y++;
      currentPos += width * 4;
      let reachLeft = false;
      let reachRight = false;

      // Fill downward and push adjacent pixels on the stack when needed.
      while (y < height && colorsMatch(data.slice(currentPos, currentPos + 4), startColor)) {
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
    if (tool === 'bucket') {
      floodFill(offsetX, offsetY);
      return;
    }
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || tool === 'bucket') return;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const finishDrawing = () => {
    if (tool !== 'bucket') {
      ctxRef.current.closePath();
    }
    setIsDrawing(false);
  };

  return (
    <div>
      <div style={{ position: 'fixed', top: 10, left: 10, zIndex: 10, background: '#fff', padding: 10 }}>
        <button onClick={() => setTool('pencil')}>Pencil</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <button onClick={() => setTool('bucket')}>Paint Bucket</button>
        <label style={{ marginLeft: '10px' }}>
          Color:
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)} 
            style={{ marginLeft: '5px' }}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Size:
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(parseInt(e.target.value, 10))} 
            style={{ marginLeft: '5px' }}
          />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid #000' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
      />
    </div>
  );
};

export default DrawingCanvas;
