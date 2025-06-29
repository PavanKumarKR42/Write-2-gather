// src/pages/Whiteboard.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Use environment variable for the backend URL
// REACT_APP_BACKEND_URL will be set by your frontend hosting platform (e.g., Render) in production
// In local development, ensure it's defined in your frontend's .env file
const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";; // <--- CHANGED
let socket;

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

    // Initialize Socket.IO connection
    // This will now connect to your deployed backend URL in production
    socket = io(SOCKET_SERVER_URL, { // <--- CHANGED
        query: { token }
    });

    socket.on('connect', () => {
      console.log('Socket Connected:', socket.id);
      socket.emit('join-room', { roomId, userId });
    });

    socket.on('load-board', ({ elements }) => {
      console.log('Received load-board event:', elements);
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
        });
      }
    });

    socket.on('draw', ({ data, userId: drawingUserId }) => {
      console.log('Received draw event from server. Raw event:', { data, drawingUserId });
      console.log('Received draw event data:', data);

      if (data && data.type === 'path' && data.points && data.points.length >= 4) {
        for (let i = 0; i < data.points.length - 2; i += 2) {
          const start = { x: data.points[i], y: data.points[i+1] };
          const end = { x: data.points[i+2], y: data.points[i+3] };
          drawLine(start, end, data.color, data.thickness);
        }
      } else {
        console.error("Received invalid drawing data or 'data' is undefined/null:", data);
      }
    });

    socket.on('clear-board', () => {
      console.log('Received clear-board event from server.');
      if (contextRef.current && canvasRef.current) {
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    });

    socket.on('permission-denied', ({ message }) => {
        setBoardError(message);
        console.warn('Permission Denied:', message);
    });

    socket.on('board-error', ({ message }) => {
        setBoardError(message);
        console.error('Board Error:', message);
    });

    socket.on('user-joined', ({ joinedUserId }) => {
      console.log(`User ${joinedUserId} joined the room.`);
    });

    // Fetch user's permission for the room to enable/disable drawing
    const fetchUserPermission = async () => {
        try {
            // Use environment variable for backend URL
            const res = await fetch(`${SOCKET_SERVER_URL}/api/rooms/${roomId}`, { // <--- CHANGED
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && data.room) {
                const participant = data.room.participants.find(p => p.user?._id === userId);
                setCanWrite(participant?.canWrite || false);
                console.log(`User ${userId} has write permission: ${participant?.canWrite || false}`);
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

    return () => {
      if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
      }
    };
  }, [roomId, userId, navigate, token, drawLine]);

  const startDrawing = ({ nativeEvent }) => {
    setBoardError("");
    if (!canWrite) {
      setBoardError("You don't have write permission.");
      return;
    }
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    contextRef.current.canvas.lastX = offsetX;
    contextRef.current.canvas.lastY = offsetY;
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !canWrite) return;
    const { offsetX, offsetY } = nativeEvent;
    
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = thickness;
    contextRef.current.stroke();

    const drawingData = {
      type: 'path',
      points: [
        contextRef.current.canvas.lastX, contextRef.current.canvas.lastY,
        offsetX, offsetY
      ],
      color,
      thickness
    };

    socket.emit('draw', { userId, data: drawingData });

    contextRef.current.canvas.lastX = offsetX;
    contextRef.current.canvas.lastY = offsetY;
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const handleClearBoard = () => {
    setBoardError("");
    if (!canWrite) {
        setBoardError("You don't have write permission to clear the board.");
        return;
    }
    socket.emit('clear-board', { roomId, userId });
  };

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