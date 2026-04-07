const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  terminateSession,
  upgradePlan,
} = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

router.use(protect); // All user routes require authentication

router.get('/profile', getProfile);
router.put('/update', updateProfile);
router.put('/change-password', changePassword);
router.post('/enable-2fa', enable2FA);
router.post('/verify-2fa', verify2FA);
router.post('/disable-2fa', disable2FA);
router.delete('/sessions/:sessionId', terminateSession);
router.post('/upgrade', upgradePlan);

module.exports = router;
