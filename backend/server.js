// backend/server.js
require('dotenv').config(); // Loads environment variables from .env file
const http = require('http');
const socketIO = require('socket.io');

const connectDB = require('./config/db'); // Your database connection utility
// const redisClient = require('./config/redis'); // Your Redis client (if used, not directly modified here)
const app = require('./app'); // ✅ Use the properly configured Express app from app.js

// Connect to DB
connectDB();

// Create HTTP server and attach the Express app
const server = http.createServer(app);

// Socket.IO configuration
const io = socketIO(server, {
  cors: {
    origin: '*', // Allows all origins. For production, specify your frontend URL (e.g., 'http://localhost:3000')
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