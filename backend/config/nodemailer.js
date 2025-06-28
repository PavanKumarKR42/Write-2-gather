require('dotenv').config(); // ✅ This is crucial to load EMAIL_USER and EMAIL_PASS

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Must be your 16-character Gmail App Password
  },
});

module.exports = transporter;
