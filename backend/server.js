require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIO = require('socket.io');

const connectDB = require('./config/db');
const redisClient = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

// Initialize app and middleware
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Start MongoDB
connectDB();

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO logic
require('./sockets/whiteboard')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
