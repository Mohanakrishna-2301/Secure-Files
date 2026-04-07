const User = require('../models/User');
const Session = require('../models/Session');
const { generateOTP, verifyOTP } = require('../services/otpService');
const { sendOTPEmail, sendRiskAlertEmail } = require('../services/emailService');
const { createTokenPair, rotateRefreshToken, invalidateSession, invalidateAllSessions } = require('../services/tokenService');
const { analyzeLoginRisk, logLoginEvent } = require('../services/riskDetectionService');
const speakeasy = require('speakeasy');
const UAParser = require('ua-parser-js');

// Helper: extract device info from user agent
const getDeviceInfo = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  return {
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    device: result.device.type || 'Desktop',
  };
};

// Helper: get real IP
const getIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress ||
    req.ip ||
    '0.0.0.0'
  );
};

// @desc   Register new user + send OTP
// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser && existingUser.verified) {
    return res.status(409).json({ success: false, message: 'Email already registered. Please login.' });
  }

  // If unverified duplicate, remove it and re-register
  if (existingUser && !existingUser.verified) {
    await existingUser.deleteOne();
  }

  const user = await User.create({ name, email: email.toLowerCase(), password, verified: false });

  // Generate and send OTP
  const otp = await generateOTP(email, 'register');
  await sendOTPEmail(email, otp, 'register');

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for the OTP.',
    email: user.email,
  });
};

// @desc   Verify OTP
// @route  POST /api/auth/verify-otp
// @access Public
const verifyOTPHandler = async (req, res) => {
  const { email, otp, purpose = 'register' } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const result = await verifyOTP(email, otp, purpose);
  if (!result.valid) {
    return res.status(400).json({ success: false, message: result.message });
  }

  if (purpose === 'register') {
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { verified: true },
      { new: true }
    );

    const ip = getIP(req);
    const ua = req.headers['user-agent'] || '';
    const { browser, os, device } = getDeviceInfo(ua);
    const { accessToken, refreshToken } = await createTokenPair(
      user._id, user.role, device, ip, ua, browser, os
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // NO maxAge/expires → session-only cookie (dies when browser closes)
    });

    return res.json({ 
      success: true, 
      message: 'OTP verified successfully.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        storageLimit: user.storageLimit,
        storageUsed: user.storageUsed,
      }
    });
  }

  res.json({ success: true, message: 'OTP verified successfully.' });
};

// @desc   Login with email + password
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  const { email, password, totpCode } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +twoFactorSecret');
  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.verified) {
    return res.status(403).json({ success: false, message: 'Please verify your email first.' });
  }

  // 2FA check
  if (user.twoFactorEnabled) {
    if (!totpCode) {
      return res.status(200).json({ success: true, requiresTwoFactor: true, message: 'Please provide your 2FA code.' });
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });
    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code.' });
    }
  }

  const ip = getIP(req);
  const ua = req.headers['user-agent'] || '';
  const { browser, os, device } = getDeviceInfo(ua);

  // Risk analysis
  const { riskLevel } = await analyzeLoginRisk(user, ip, ua);

  // Log login event
  await logLoginEvent(user._id, ip, device, browser, os, ua, riskLevel);

  // Add to known devices if not already known
  user.addKnownDevice(ip, ua);
  user.lastLoginAt = new Date();
  user.lastLoginRisk = riskLevel;
  await user.save();

  // Send security email for medium/high risk
  if (riskLevel !== 'low') {
    sendRiskAlertEmail(user.email, user.name, { riskLevel, ip, device, browser }).catch(console.error);
  }

  // Create token pair + session
  const { accessToken, refreshToken } = await createTokenPair(
    user._id, user.role, device, ip, ua, browser, os
  );

  // Send refresh token as httpOnly session cookie (no maxAge = dies when browser closes)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // NO maxAge/expires → session-only cookie
  });

  res.json({
    success: true,
    message: 'Login successful.',
    accessToken,
    riskLevel,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
};

// @desc   Google OAuth callback — issue tokens
// @route  POST /api/auth/google
// @access Public
const googleLogin = async (req, res) => {
  const { googleId, email, name, avatar } = req.body;
  if (!googleId || !email) {
    return res.status(400).json({ success: false, message: 'Google credentials missing.' });
  }

  let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
  let isNewUser = false;

  if (!user) {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      googleId,
      avatar,
      verified: true,
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (!user.avatar) user.avatar = avatar;
    user.verified = true;
    await user.save();
  }

  const ip = getIP(req);
  const ua = req.headers['user-agent'] || '';
  const { browser, os, device } = getDeviceInfo(ua);
  const { riskLevel } = await analyzeLoginRisk(user, ip, ua);

  await logLoginEvent(user._id, ip, device, browser, os, ua, riskLevel);
  user.addKnownDevice(ip, ua);
  user.lastLoginAt = new Date();
  user.lastLoginRisk = riskLevel;
  await user.save();

  if (riskLevel !== 'low') {
    sendRiskAlertEmail(user.email, user.name, { riskLevel, ip, device, browser }).catch(console.error);
  }

  const { accessToken, refreshToken } = await createTokenPair(
    user._id, user.role, device, ip, ua, browser, os
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    // NO maxAge/expires → session-only cookie
  });

  res.json({
    success: true,
    message: 'Google login successful.',
    accessToken,
    riskLevel,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
    },
  });
};

// @desc   Refresh access token
// @route  POST /api/auth/refresh-token
// @access Public (cookie)
const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token provided.' });
  }

  try {
    const { accessToken, refreshToken: newRefreshToken, userId } = await rotateRefreshToken(token);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      // NO maxAge/expires → session-only cookie
    });

    res.json({ success: true, accessToken });
  } catch (err) {
    res.clearCookie('refreshToken');
    return res.status(401).json({ success: false, message: err.message });
  }
};

// @desc   Logout current session
// @route  POST /api/auth/logout
// @access Protected
const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await invalidateSession(req.user._id, token).catch(() => {});
  }
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully.' });
};

// @desc   Logout from all devices
// @route  POST /api/auth/logout-all
// @access Protected
const logoutAll = async (req, res) => {
  await invalidateAllSessions(req.user._id);
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out from all devices.' });
};

// @desc   Resend OTP
// @route  POST /api/auth/resend-otp
// @access Public
const resendOTP = async (req, res) => {
  const { email, purpose = 'register' } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const otp = await generateOTP(email, purpose);
  await sendOTPEmail(email, otp, purpose);
  res.json({ success: true, message: 'OTP sent successfully.' });
};

module.exports = { register, verifyOTPHandler, login, googleLogin, refreshToken, logout, logoutAll, resendOTP };
