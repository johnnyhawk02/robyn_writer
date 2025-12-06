
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface TraceCanvasProps {
  color: string;
  lineWidth: number;
  isEraser: boolean;
}

export interface TraceCanvasHandle {
  clearCanvas: () => void;
  getCanvas: () => HTMLCanvasElement | null;
}

const TraceCanvas = forwardRef<TraceCanvasHandle, TraceCanvasProps>(({ color, lineWidth, isEraser }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      if (canvas && contextRef.current) {
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    getCanvas: () => canvasRef.current
  }));

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle High DPI screens
    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const dpr = window.devicePixelRatio || 1;
        const rect = parent.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          contextRef.current = ctx;
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to set up sizing logic

  // Update context properties when props change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
      // 'destination-out' removes pixels (true eraser), 'source-over' draws new pixels
      contextRef.current.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    }
  }, [color, lineWidth, isEraser]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { nativeEvent } = e;
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    // Important: Release pointer capture to allow smooth touch scrolling if needed elsewhere, 
    // but here we want to capture to draw.
    canvas.setPointerCapture(nativeEvent.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const { nativeEvent } = e;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Release capture
    e.currentTarget.releasePointerCapture(e.nativeEvent.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 touch-none z-10 cursor-crosshair bg-transparent"
      onPointerDown={startDrawing}
      onPointerMove={draw}
      onPointerUp={stopDrawing}
      onPointerLeave={stopDrawing}
    />
  );
});

export default TraceCanvas;
