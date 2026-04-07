const crypto = require('crypto');
const OTP = require('../models/OTP');

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a 6-digit OTP, hash it, store in DB
 */
const generateOTP = async (email, purpose = 'register') => {
  // Delete any existing OTPs for this email + purpose
  await OTP.deleteMany({ email: email.toLowerCase(), purpose });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Create OTP record (pre-save hook will hash it)
  await OTP.create({
    email: email.toLowerCase(),
    otpHash: otp, // stored as plain, hashed in pre-save
    purpose,
    expiresAt,
  });

  return otp; // Return plain OTP to send via email
};

/**
 * Verify OTP for an email + purpose
 */
const verifyOTP = async (email, plainOTP, purpose = 'register') => {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }

  // Increment attempts
  record.attempts += 1;
  await record.save();

  if (record.attempts > 5) {
    await record.deleteOne();
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  const isMatch = await record.verifyOTP(plainOTP);
  if (!isMatch) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }

  // OTP is valid — delete it
  await record.deleteOne();
  return { valid: true };
};

module.exports = { generateOTP, verifyOTP };
