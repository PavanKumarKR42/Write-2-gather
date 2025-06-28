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
    }).populate('creator', 'name').sort({ createdAt: -1 });

    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};
