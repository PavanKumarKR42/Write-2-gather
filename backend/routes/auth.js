const express = require('express');
const {
  requestOTP,
  verifyOTP,
  registerUser,
  loginUser
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin
} = require('../middlewares/authValidation');

const router = express.Router();

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

module.exports = router;
