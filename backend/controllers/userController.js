const User = require('../models/User');
const Plan = require('../models/Plan');
const LoginHistory = require('../models/LoginHistory');
const Session = require('../models/Session');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const bcrypt = require('bcryptjs');


// @desc   Get current user profile
// @route  GET /api/user/profile
// @access Protected
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).populate('plan', 'name storageLimitBytes price');
  const loginHistory = await LoginHistory.find({ userId: req.user._id })
    .sort({ loginTime: -1 })
    .limit(10);

  const sessions = await Session.find({ userId: req.user._id });

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      verified: user.verified,
      twoFactorEnabled: user.twoFactorEnabled,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
      lastLoginAt: user.lastLoginAt,
      lastLoginRisk: user.lastLoginRisk,
      dob: user.dob,
      phone: user.phone,
      plan: user.plan,
      createdAt: user.createdAt,
    },
    loginHistory,
    activeSessions: sessions.map((s) => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
    })),
  });
};

// @desc   Update user profile
// @route  PUT /api/user/update
// @access Protected
const updateProfile = async (req, res) => {
  const { name, avatar, dob, phone } = req.body;
  const updates = {};
  if (name)   updates.name = name.trim();
  if (avatar) updates.avatar = avatar;
  if (dob)    updates.dob = new Date(dob);
  if (phone !== undefined) updates.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ success: true, message: 'Profile updated.', user: { name: user.name, avatar: user.avatar, dob: user.dob, phone: user.phone } });
};

// @desc   Change password
// @route  PUT /api/user/change-password
// @access Protected
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both fields are required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
};

// @desc   Enable 2FA — generate secret + QR code
// @route  POST /api/user/enable-2fa
// @access Protected
const enable2FA = async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `Secure-Files (${req.user.email})`,
    length: 20,
  });

  // Store secret temporarily (not enabled until verified)
  await User.findByIdAndUpdate(req.user._id, { twoFactorSecret: secret.base32 });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    secret: secret.base32,
    qrCode: qrCodeUrl,
    message: 'Scan the QR code with your authenticator app, then verify to activate 2FA.',
  });
};

// @desc   Verify and activate 2FA
// @route  POST /api/user/verify-2fa
// @access Protected
const verify2FA = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, message: 'Token is required.' });

  const user = await User.findById(req.user._id).select('+twoFactorSecret');
  if (!user.twoFactorSecret) {
    return res.status(400).json({ success: false, message: 'Please initiate 2FA setup first.' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    return res.status(400).json({ success: false, message: 'Invalid 2FA code. Please try again.' });
  }

  await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
  res.json({ success: true, message: '2FA enabled successfully!' });
};

// @desc   Disable 2FA
// @route  POST /api/user/disable-2fa
// @access Protected
const disable2FA = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
  });
  res.json({ success: true, message: '2FA disabled.' });
};

// @desc   Terminate a specific session
// @route  DELETE /api/user/sessions/:sessionId
// @access Protected
const terminateSession = async (req, res) => {
  const { sessionId } = req.params;
  const session = await Session.findOne({ _id: sessionId, userId: req.user._id }).select('+refreshTokenHash');
  if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

  // Determine if we're terminating the CURRENT session
  const currentRefreshToken = req.cookies?.refreshToken;
  let isCurrentSession = false;
  if (currentRefreshToken) {
    isCurrentSession = await bcrypt.compare(currentRefreshToken, session.refreshTokenHash);
  }

  await session.deleteOne();
  res.json({ success: true, message: 'Session terminated.', isCurrentSession });
};

// @desc   Upgrade storage plan
// @route  POST /api/user/upgrade
// @access Protected
const upgradePlan = async (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ success: false, message: 'Plan ID is required.' });
  }

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) {
    return res.status(404).json({ success: false, message: 'Plan not found or inactive.' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { storageLimit: plan.storageLimitBytes, plan: plan._id },
    { new: true }
  );

  res.json({
    success: true,
    message: `Plan upgraded to ${plan.name}.`,
    storageLimit: user.storageLimit,
    plan: { id: plan._id, name: plan.name, storageLimitBytes: plan.storageLimitBytes },
  });
};

module.exports = { getProfile, updateProfile, changePassword, enable2FA, verify2FA, disable2FA, terminateSession, upgradePlan };
