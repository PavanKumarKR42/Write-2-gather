// backend/models/Board.js
const mongoose = require('mongoose');

const boardDataSchema = new mongoose.Schema({
  // This schema will depend on how your frontend represents drawing data.
  // For example, if you use a series of paths/strokes:
  type: {
    type: String, // e.g., 'path', 'circle', 'rectangle', 'text'
    required: true
  },
  points: { // For paths (e.g., [x1, y1, x2, y2, ...])
    type: [Number]
  },
  color: {
    type: String, // e.g., '#000000', 'red'
    default: '#000000'
  },
  thickness: {
    type: Number,
    default: 2
  },
  // Add other properties as needed for different shapes (e.g., x, y, radius, width, height, text content)
  // Example for text:
  text: {
    type: String
  },
  fontSize: {
    type: Number
  },
  x: { type: Number },
  y: { type: Number },
});

const boardSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    unique: true // A room should have only one board
  },
  // This will store an array of drawing elements
  elements: [boardDataSchema],
  // You might want to track who last updated it or a version number
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);