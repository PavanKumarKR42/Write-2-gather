// backend/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const boardRoutes = require('./routes/boards'); // <--- NEW: Import board routes

const app = express();

// Middleware
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON requests

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (e.g., /api/auth/login)
app.use('/api/rooms', roomRoutes); // Room management routes (e.g., /api/rooms/create)
app.use('/api/boards', boardRoutes); // <--- NEW: Board management routes (e.g., /api/boards/:roomId)

// Simple root route (optional, for basic server check)
app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;