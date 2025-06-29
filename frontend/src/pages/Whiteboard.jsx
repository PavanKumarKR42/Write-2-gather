// src/pages/Whiteboard.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client'; // Install socket.io-client: npm install socket.io-client

const SOCKET_SERVER_URL = "http://localhost:5000";
let socket; // Declare outside to maintain single instance

export default function Whiteboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [thickness, setThickness] = useState(2);
  const [boardError, setBoardError] = useState("");
  const [canWrite, setCanWrite] = useState(false);

  const token = localStorage.getItem("authToken");
  let userId = null;
  if (token) {
    try {
      userId = JSON.parse(atob(token.split(".")[1])).userId;
    } catch (e) {
      console.error("Error decoding token:", e);
      localStorage.removeItem("authToken");
      navigate("/login", { replace: true });
    }
  }

  // Helper to draw a single line segment
  const drawLine = useCallback((start, end, strokeColor = '#000000', strokeThickness = 2) => {
    if (!contextRef.current) return;
    contextRef.current.beginPath();
    contextRef.current.moveTo(start.x, start.y);
    contextRef.current.lineTo(end.x, end.y);
    contextRef.current.strokeStyle = strokeColor;
    contextRef.current.lineWidth = strokeThickness;
    contextRef.current.lineCap = 'round';
    contextRef.current.stroke();
    contextRef.current.closePath();
  }, []);

  // Initialize Canvas and Socket
  useEffect(() => {
    if (!token || !userId || !roomId) {
      navigate("/login", { replace: true });
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      contextRef.current = ctx;

      canvas.width = window.innerWidth * 0.8;
      canvas.height = window.innerHeight * 0.7;
    }

    socket = io(SOCKET_SERVER_URL, {
        query: { token }
    });

    socket.on('connect', () => {
      console.log('Socket Connected:', socket.id);
      socket.emit('join-room', { roomId, userId });
    });

    socket.on('load-board', ({ elements }) => {
      console.log('Received load-board event:', elements); // Log board load
      if (contextRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        elements.forEach(element => {
          if (element.type === 'path' && element.points && element.points.length >= 4) {
            for (let i = 0; i < element.points.length - 2; i += 2) {
              const start = { x: element.points[i], y: element.points[i+1] };
              const end = { x: element.points[i+2], y: element.points[i+3] };
              drawLine(start, end, element.color, element.thickness);
            }
          }
          // Handle other element types (circles, rects, text) here if you implement them
        });
      }
    });

    // Listen for draw events from other users
    socket.on('draw', ({ data, userId: drawingUserId }) => { // <--- ADDED drawingUserId for clarity
      console.log('Received draw event from server. Raw event:', { data, drawingUserId }); // <--- LOG ADDED
      console.log('Received draw event data:', data); // <--- LOG ADDED

      // <--- ADDED NULL/UNDEFINED CHECK FOR 'data' to prevent TypeError
      if (data && data.type === 'path' && data.points && data.points.length >= 4) {
        for (let i = 0; i < data.points.length - 2; i += 2) {
          const start = { x: data.points[i], y: data.points[i+1] };
          const end = { x: data.points[i+2], y: data.points[i+3] };
          drawLine(start, end, data.color, data.thickness);
        }
      } else {
        console.error("Received invalid drawing data or 'data' is undefined/null:", data); // <--- LOG ADDED
      }
      // Handle other element types here
    });

    socket.on('clear-board', () => {
      console.log('Received clear-board event from server.'); // Log clear board
      if (contextRef.current && canvasRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    socket.on('permission-denied', ({ message }) => {
        setBoardError(message);
        console.warn('Permission Denied:', message); // Log permission denied
    });

    socket.on('board-error', ({ message }) => { // Listen for generic board errors from backend
        setBoardError(message);
        console.error('Board Error:', message);
    });

    socket.on('user-joined', ({ joinedUserId }) => {
      console.log(`User ${joinedUserId} joined the room.`); // Log user joins
    });


    // Fetch user's permission for the room to enable/disable drawing
    const fetchUserPermission = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.room) {
                const participant = data.room.participants.find(p => p.user?._id === userId);
                setCanWrite(participant?.canWrite || false);
                console.log(`User ${userId} has write permission: ${participant?.canWrite || false}`); // Log permission status
            } else {
                setBoardError(data.error || "Failed to fetch room details for permissions.");
                console.error("Failed to fetch room details for permissions:", data.error);
            }
        } catch (err) {
            setBoardError(err.message);
            console.error("Error fetching user permission:", err);
        }
    };
    fetchUserPermission();


    // Clean up on unmount
    return () => {
      if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
      }
    };
  }, [roomId, userId, navigate, token, drawLine]);

  // Drawing event handlers
  const startDrawing = ({ nativeEvent }) => {
    setBoardError(""); // Clear error on new action
    if (!canWrite) {
      setBoardError("You don't have write permission.");
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    // Initialize a dummy lastX/lastY for the first point of a new stroke
    contextRef.current.canvas.lastX = offsetX;
    contextRef.current.canvas.lastY = offsetY;
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !canWrite) return;
    const { offsetX, offsetY } = nativeEvent;
    
    // Draw on local canvas immediately
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = thickness;
    contextRef.current.stroke();

    // Prepare the drawing data for emission
    const drawingData = {
      type: 'path',
      points: [
        contextRef.current.canvas.lastX, contextRef.current.canvas.lastY, // previous point
        offsetX, offsetY // current point
      ],
      color,
      thickness
    };

    // Emit the event to the server, with userId and data payload
    socket.emit('draw', { userId, data: drawingData }); // <--- FIX APPLIED HERE

    // Update last point for the next segment
    contextRef.current.canvas.lastX = offsetX;
    contextRef.current.canvas.lastY = offsetY;
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleClearBoard = () => {
    setBoardError(""); // Clear error on new action
    if (!canWrite) {
        setBoardError("You don't have write permission to clear the board.");
        return;
    }
    socket.emit('clear-board', { roomId, userId }); // <--- FIX APPLIED HERE (ensure userId is passed if backend expects it)
  };

  // No need for a separate useEffect for initial context setup if it's done in the main useEffect's canvas setup
  // The 'ctx.canvas.lastX = offsetX; ctx.canvas.lastY = offsetY;' in startDrawing is better for initial point.
  // Removing the duplicated useEffect:
  // useEffect(() => {
  //   const canvas = canvasRef.current;
  //   if (canvas) {
  //     const ctx = canvas.getContext('2d');
  //     ctx.canvas.lastX = 0;
  //     ctx.canvas.lastY = 0;
  //   }
  // }, []);


  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Whiteboard for Room: {roomId}</h1>
      {boardError && <p className="text-red-500 mb-4">{boardError}</p>}

      <div className="flex space-x-2 mb-4">
        <label htmlFor="colorPicker">Color:</label>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          disabled={!canWrite}
        />
        <label htmlFor="thicknessSlider">Thickness:</label>
        <input
          type="range"
          id="thicknessSlider"
          min="1"
          max="10"
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          disabled={!canWrite}
        />
        <button
          onClick={handleClearBoard}
          className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
          disabled={!canWrite}
        >
          Clear Board
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-400 bg-white shadow-lg cursor-crosshair"
      ></canvas>
    </div>
  );
}