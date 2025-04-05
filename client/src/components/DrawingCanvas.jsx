import { useRef, useEffect, useState } from 'react';
import * as fabric from 'fabric';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [mode, setMode] = useState("Drawing");

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        height: 900,
        width: 1500,
        isDrawingMode: true
      });

      setCanvas(fabricCanvas);
      return () => fabricCanvas.dispose();
    }
  }, []);

  const handleDrawingMode = () => {
    if (canvas) {
      canvas.isDrawingMode = true;
      const drawingBrush = new fabric.PencilBrush(canvas);
      drawingBrush.width = brushWidth;
      drawingBrush.color = currentColor;
      canvas.freeDrawingBrush = drawingBrush;
      setMode("Drawing");
    }
  };

  const handleEraserMode = () => {
    if (canvas) {
      canvas.isDrawingMode = true;
      const eraserBrush = new fabric.PencilBrush(canvas);
      eraserBrush.width = eraserWidth;
      eraserBrush.color = '#ffffff';
      eraserBrush.globalCompositeOperation = 'destination-out';
      canvas.freeDrawingBrush = eraserBrush;
      setMode("Eraser");
    }
  };

  const handlePaintBucket = () => {
    if (canvas) {
      canvas.isDrawingMode = false;
      setMode("Paint Bucket");

      canvas.on('mouse:down', function (event) {
        const clickedObject = event.target;
        if (clickedObject) {
          clickedObject.set('fill', currentColor);
          canvas.renderAll();
        }
      });
    }
  };

  const handleColorChange = (color) => {
    setCurrentColor(color);
    if (canvas && mode === "Drawing") {
      canvas.freeDrawingBrush.color = color;
    }
  };

  const handleBrushWidthChange = (width) => {
    setBrushWidth(width);
    if (canvas && mode === "Drawing") {
      canvas.freeDrawingBrush.width = width;
    }
  };

  const handleEraserWidthChange = (width) => {
    setEraserWidth(width);
    if (canvas && mode === "Eraser") {
      canvas.freeDrawingBrush.width = width;
    }
  };

  const handleClearCanvas = () => {
    if (canvas) canvas.clear();
  };

  return (
    <div className='flex-col'>
      <div className="flex gap-2 mb-2">
        <div>{mode}</div>
        <button onClick={handleDrawingMode} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Draw</button>
        <button onClick={handleEraserMode} className="px-4 py-2 bg-red-500 text-white hover:bg-red-600">Erase</button>
        <button onClick={handlePaintBucket} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Paint Bucket</button>
        <button onClick={handleClearCanvas} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Clear</button>
      </div>
      <div className="flex gap-4 mb-2">
        <div className="flex items-center gap-2">
          <label className="text-sm">Brush Width:</label>
          <input type="range" min="1" max="50" value={brushWidth} onChange={(e) => handleBrushWidthChange(Number(e.target.value))} className="w-24" />
          <span className="text-sm w-6">{brushWidth}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Eraser Width:</label>
          <input type="range" min="1" max="50" value={eraserWidth} onChange={(e) => handleEraserWidthChange(Number(e.target.value))} className="w-24" />
          <span className="text-sm w-6">{eraserWidth}</span>
        </div>
      </div>
      <div className="flex gap-1 mb-2">
        {["#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"].map((color) => (
          <button key={color} style={{ backgroundColor: color }} className={`w-8 h-8 border-2 ${currentColor === color ? 'border-gray-400' : 'border-transparent'}`} onClick={() => handleColorChange(color)} />
        ))}
      </div>
      <canvas ref={canvasRef} className='border'></canvas>
    </div>
  );
};

export default DrawingCanvas;