const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const sendOTP = require('../utils/sendOTP');

// Send OTP to email
exports.requestOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    await sendOTP(email);
    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (storedOtp === otp) {
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Invalid OTP' });
    }
  } catch (err) {
    console.error('VERIFY OTP ERROR:', err);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

// Register user
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error('REGISTRATION ERROR:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ token });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
