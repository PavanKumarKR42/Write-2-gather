// backend/controllers/boardController.js
const Board = require('../models/Board');
const Room = require('../models/Room'); // Need Room model to check permissions

// Get the board data for a specific room
exports.getBoard = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId; // From auth middleware

  try {
    // Optional: Check if user is a participant in the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const isParticipant = room.participants.some(p => p.user.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant of this room' });
    }

    // Find the board for the room, or create a new empty one if it doesn't exist
    let board = await Board.findOne({ roomId }).populate('elements'); // Populate if elements have refs
    if (!board) {
      board = new Board({ roomId, elements: [] });
      await board.save();
    }
    res.status(200).json(board);
  } catch (err) {
    console.error('Error fetching board:', err);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
};

// Save board data (e.g., after a drawing session, or periodically)
// This might be less used with real-time saving via sockets,
// but useful for initial load or full board state saves.
exports.saveBoard = async (req, res) => {
  const { roomId } = req.params;
  const { elements } = req.body; // Array of drawing elements from frontend
  const userId = req.user.userId; // From auth middleware

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const participant = room.participants.find(p => p.user.toString() === userId);

    // Only allow writers to save the board
    if (!participant || !participant.canWrite) {
      return res.status(403).json({ error: 'Only writers can save the board' });
    }

    let board = await Board.findOne({ roomId });
    if (!board) {
      board = new Board({ roomId, elements });
    } else {
      board.elements = elements; // Replace existing elements
    }
    board.lastUpdatedBy = userId;
    await board.save();
    res.status(200).json({ message: 'Board saved successfully' });
  } catch (err) {
    console.error('Error saving board:', err);
    res.status(500).json({ error: 'Failed to save board' });
  }
};