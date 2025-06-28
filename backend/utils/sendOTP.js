const transporter = require('../config/nodemailer');
const redisClient = require('../config/redis');

const sendOTP = async (email) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redisClient.setEx(`otp:${email}`, 300, otp); // Store with TTL
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`,
    });

    console.log(`OTP ${otp} sent to ${email}`);
  } catch (err) {
    console.error('SEND OTP ERROR:', err);
    throw err; 
  }
};

module.exports = sendOTP;
