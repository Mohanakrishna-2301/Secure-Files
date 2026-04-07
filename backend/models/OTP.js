const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['register', 'login', '2fa', 'password-reset'],
    default: 'register',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL — MongoDB auto-deletes at expiresAt
  },
});

// Hash OTP before saving
otpSchema.pre('save', async function () {
  if (this.isModified('otpHash')) {
    this.otpHash = await bcrypt.hash(this.otpHash, 10);
  }
});

// Verify OTP
otpSchema.methods.verifyOTP = async function (plainOTP) {
  return bcrypt.compare(plainOTP, this.otpHash);
};

module.exports = mongoose.model('OTP', otpSchema);
