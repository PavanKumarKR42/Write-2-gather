// backend/routes/rooms.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  createRoom,
  joinRoom,
  setPermissions,
  getUserRooms,
  getRoomById // <--- NEW: Import the new controller function
} = require('../controllers/roomController');

router.post('/create', auth, createRoom);
router.post('/join', auth, joinRoom);
router.post('/permissions', auth, setPermissions);
router.get('/my-rooms', auth, getUserRooms);
router.get('/:roomId', auth, getRoomById); // <--- NEW: Route to get a single room by ID

module.exports = router;