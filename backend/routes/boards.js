// backend/routes/boards.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // Your auth middleware
const boardController = require('../controllers/boardController'); // Your board controller

// Get board data for a specific room
router.get('/:roomId', auth, boardController.getBoard);

// Save board data (e.g., full state save)
router.post('/:roomId/save', auth, boardController.saveBoard);

module.exports = router;