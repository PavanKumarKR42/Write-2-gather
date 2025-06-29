// backend/sockets/whiteboard.js
const Room = require('../models/Room');
const Board = require('../models/Board'); // <<< Import Board model

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);

    // Store user ID and room ID on the socket for easier access
    // This is good practice. Socket.io supports custom properties on the socket object.
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(roomId);
      socket.roomId = roomId; // Store on socket for later use
      socket.userId = userId; // Store on socket for later use

      console.log(`📥 ${userId} joined room ${roomId}`);

      // When a user joins, load the current board state and emit it to them
      try {
        let board = await Board.findOne({ roomId });
        if (!board) {
          // If no board exists for this room, create an empty one
          board = new Board({ roomId, elements: [] });
          await board.save();
        }
        socket.emit('load-board', { elements: board.elements }); // Emit existing elements to the joining user
      } catch (err) {
        console.error(`Error loading board for room ${roomId}:`, err);
        socket.emit('board-error', { message: 'Failed to load board.' });
      }

      // Notify others in the room
      io.to(roomId).emit('user-joined', { userId });
    });

    // Handle drawing events (only if canWrite = true)
    socket.on('draw', async ({ data }) => { // Data now contains the specific drawing action/element
      const roomId = socket.roomId; // Use stored roomId
      const userId = socket.userId; // Use stored userId

      if (!roomId || !userId) {
        console.warn(`Socket ${socket.id} tried to draw without joining a room.`);
        return;
      }

      try {
        const room = await Room.findById(roomId);
        if (!room) {
          console.error(`Room ${roomId} not found for drawing event.`);
          return;
        }
        const participant = room.participants.find(p => p.user.toString() === userId);

        if (participant && participant.canWrite) {
          // 1. Persist the new drawing element to the database
          const board = await Board.findOneAndUpdate(
            { roomId },
            {
              $push: { elements: data }, // Add the new drawing element to the array
              $set: { lastUpdatedBy: userId } // Update last updated user
            },
            { new: true, upsert: true } // Create if not exists, return updated doc
          );

          // 2. Broadcast the drawing event to all other clients in the room
          socket.to(roomId).emit('draw', { userId, data });
        } else {
          console.warn(`User ${userId} tried to draw in room ${roomId} without write permissions.`);
          socket.emit('permission-denied', { message: 'You do not have write access to this board.' });
        }
      } catch (err) {
        console.error('Error handling draw event:', err);
        socket.emit('board-error', { message: 'Failed to process drawing.' });
      }
    });

    // Handle clear-board (only writers)
    socket.on('clear-board', async () => {
      const roomId = socket.roomId;
      const userId = socket.userId;

      if (!roomId || !userId) {
        console.warn(`Socket ${socket.id} tried to clear board without joining a room.`);
        return;
      }

      try {
        const room = await Room.findById(roomId);
        if (!room) {
          console.error(`Room ${roomId} not found for clear board event.`);
          return;
        }
        const participant = room.participants.find(p => p.user.toString() === userId);

        if (participant && participant.canWrite) {
          // Clear board data from the database
          await Board.findOneAndUpdate(
            { roomId },
            { $set: { elements: [], lastUpdatedBy: userId } }, // Clear the elements array
            { new: true, upsert: true }
          );
          // Broadcast clear event to all clients in the room
          io.to(roomId).emit('clear-board');
        } else {
          console.warn(`User ${userId} tried to clear board in room ${roomId} without write permissions.`);
          socket.emit('permission-denied', { message: 'You do not have write access to clear the board.' });
        }
      } catch (err) {
        console.error('Error handling clear-board event:', err);
        socket.emit('board-error', { message: 'Failed to clear board.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
      // Optional: Handle leaving room on disconnect if needed for UI,
      // but Socket.IO automatically handles leaving rooms on disconnect.
    });
  });
};