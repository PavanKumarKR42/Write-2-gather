const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const {
  createRoom,
  joinRoom,
  setPermissions,
  getUserRooms
} = require('../controllers/roomController');

router.post('/create', auth, createRoom);
router.post('/join', auth, joinRoom);
router.post('/permissions', auth, setPermissions);
router.get('/my-rooms', auth, getUserRooms);

module.exports = router;
