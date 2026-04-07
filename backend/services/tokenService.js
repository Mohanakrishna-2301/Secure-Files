const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Session = require('../models/Session');

/**
 * Generate Access Token (short-lived, 15m)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

/**
 * Generate Refresh Token (long-lived, 7d)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Create token pair and store refresh token session
 */
const createTokenPair = async (userId, role, deviceInfo, ipAddress, userAgent, browser, os) => {
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);

  // Hash the refresh token before storing
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // Enforce single session: invalidate all previous ones
  await invalidateAllSessions(userId);

  // Store new session
  await Session.create({
    userId,
    refreshTokenHash,
    deviceInfo,
    ipAddress,
    userAgent,
    browser,
    os,
    lastActive: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { accessToken, refreshToken };
};

/**
 * Rotate refresh token — invalidate old, issue new
 */
const rotateRefreshToken = async (oldRefreshToken) => {
  const decoded = verifyRefreshToken(oldRefreshToken);

  // Find matching session by userId (then verify hash)
  const sessions = await Session.find({ userId: decoded.userId }).select('+refreshTokenHash');
  let matchedSession = null;

  for (const session of sessions) {
    const match = await bcrypt.compare(oldRefreshToken, session.refreshTokenHash);
    if (match) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    throw new Error('Invalid refresh token — session not found');
  }

  // Issue new tokens
  const newAccessToken = generateAccessToken(decoded.userId, decoded.role);
  const newRefreshToken = generateRefreshToken(decoded.userId);
  const newHash = await bcrypt.hash(newRefreshToken, 10);

  // Update session
  matchedSession.refreshTokenHash = newHash;
  matchedSession.lastActive = new Date();
  matchedSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await matchedSession.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, userId: decoded.userId };
};

/**
 * Invalidate a specific session
 */
const invalidateSession = async (userId, refreshToken) => {
  const sessions = await Session.find({ userId }).select('+refreshTokenHash');
  for (const session of sessions) {
    const match = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (match) {
      await session.deleteOne();
      return true;
    }
  }
  return false;
};

/**
 * Invalidate all sessions for a user
 */
const invalidateAllSessions = async (userId) => {
  await Session.deleteMany({ userId });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  createTokenPair,
  rotateRefreshToken,
  invalidateSession,
  invalidateAllSessions,
};
