const express = require('express');
const router = express.Router();
const {
  register,
  verifyOTPHandler,
  login,
  googleLogin,
  refreshToken,
  logout,
  logoutAll,
  resendOTP,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOTPHandler);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
