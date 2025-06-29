// backend/server.js
require('dotenv').config(); // Loads environment variables from .env file
const http = require('http');
const socketIO = require('socket.io');

const connectDB = require('./config/db'); // Your database connection utility
// const redisClient = require('redis'); // Your Redis client (if used, change to 'redis' if you had a file path there)
const app = require('./app'); // ✅ Use the properly configured Express app from app.js

// Connect to DB
connectDB();

// Create HTTP server and attach the Express app
const server = http.createServer(app);

// Socket.IO configuration
const io = socketIO(server, {
  cors: {
    // Configure Socket.IO CORS to use the frontend URL from environment variables
    // In production, FRONTEND_URL will be set to your deployed frontend URL (e.g., https://your-frontend.onrender.com)
    // In local development, ensure it's defined in your backend's .env file (e.g., FRONTEND_URL=http://localhost:3000)
    origin: process.env.FRONTEND_URL || 'http://localhost:5137', // <--- CHANGED
    methods: ['GET', 'POST'] // Allowed HTTP methods for CORS preflight
  }
});

// Socket.IO logic for whiteboard
require('./sockets/whiteboard')(io); // Pass the io instance to your whiteboard socket logic

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});