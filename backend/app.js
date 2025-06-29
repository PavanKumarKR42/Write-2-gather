// backend/app.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const boardRoutes = require('./routes/boards'); // Make sure this path is correct if your board routes are implemented

const app = express();

// Middleware
// Configure CORS to dynamically accept the frontend URL from environment variables
// In production, FRONTEND_URL will be set to your deployed frontend URL (e.g., https://your-frontend.onrender.com)
// In local development, it will default to http://localhost:3000
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5137', // <--- CHANGED
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // <--- RECOMMENDED: Specify all methods your API uses
    credentials: true // <--- RECOMMENDED: Important if you're sending cookies/auth headers (e.g., JWT)
}));
app.use(express.json()); // Parses incoming JSON requests

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (e.g., /api/auth/login)
app.use('/api/rooms', roomRoutes); // Room management routes (e.g., /api/rooms/create)
app.use('/api/boards', boardRoutes); // Ensure this line exists and is correct if you have board routes

// Simple root route (optional, for basic server check)
app.get('/', (req, res) => {
    res.send('API is running...');
});

module.exports = app;