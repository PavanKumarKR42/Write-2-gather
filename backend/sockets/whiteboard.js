const Room = require('../models/Room');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('⚡ New client connected:', socket.id);

    // Join room
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;

      console.log(`📥 ${userId} joined room ${roomId}`);

      io.to(roomId).emit('user-joined', { userId });
    });

    // Handle drawing events (only if canWrite = true)
    socket.on('draw', async ({ roomId, userId, data }) => {
      const room = await Room.findById(roomId);
      const participant = room.participants.find(p => p.user.toString() === userId);

      if (participant && participant.canWrite) {
        socket.to(roomId).emit('draw', { userId, data });
      }
    });

    // Handle clear-board (only writers)
    socket.on('clear-board', async ({ roomId, userId }) => {
      const room = await Room.findById(roomId);
      const participant = room.participants.find(p => p.user.toString() === userId);

      if (participant && participant.canWrite) {
        io.to(roomId).emit('clear-board');
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });
};
