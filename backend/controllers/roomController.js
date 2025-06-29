const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  try {
    const room = new Room({
      name,
      creator: userId,
      participants: [{ user: userId, canWrite: true }]
    });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};

exports.joinRoom = async (req, res) => {
  const { roomId } = req.body;
  const userId = req.user.userId;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const alreadyJoined = room.participants.find(p => p.user.toString() === userId);
    if (!alreadyJoined) {
      room.participants.push({ user: userId, canWrite: false });
      await room.save();
    }

    res.status(200).json({ message: 'Joined room', room });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room' });
  }
};

exports.setPermissions = async (req, res) => {
  const { roomId, targetUserId, canWrite } = req.body;
  const userId = req.user.userId;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.creator.toString() !== userId) {
      return res.status(403).json({ error: 'Only room creator can change permissions' });
    }

    const participant = room.participants.find(p => p.user.toString() === targetUserId);
    if (!participant) return res.status(404).json({ error: 'User not in room' });

    participant.canWrite = canWrite;
    await room.save();

    res.status(200).json({ message: 'Permissions updated', room });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permissions' });
  }
};

exports.getUserRooms = async (req, res) => {
  const userId = req.user.userId;

  try {
    const rooms = await Room.find({
      participants: { $elemMatch: { user: userId } }
    })
    .populate('creator', 'name')
    .populate('participants.user', 'name email') // <--- ADD THIS LINE!
    .sort({ createdAt: -1 });

    res.status(200).json(rooms);
  } catch (err) {
    console.error("Error fetching user rooms:", err); // Added for better debugging
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// backend/controllers/roomController.js
// ... (existing imports and functions)

exports.getRoomById = async (req, res) => {
  const { roomId } = req.params; // Get roomId from URL parameters
  const userId = req.user.userId; // From auth middleware

  try {
    const room = await Room.findById(roomId)
      .populate('creator', 'name')
      .populate('participants.user', 'name email'); // Populate participants for frontend needs

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Optional: Ensure the requesting user is actually a participant of this room
    const isParticipant = room.participants.some(p => p.user && p.user._id && p.user._id.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant of this room.' });
    }

    res.status(200).json({ room }); // Send the room object
  } catch (err) {
    console.error(`Error fetching room ${roomId}:`, err);
    res.status(500).json({ error: 'Failed to fetch room details.' });
  }
};