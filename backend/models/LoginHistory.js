const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    device: {
      type: String,
      default: 'Unknown Device',
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
    },
    os: {
      type: String,
      default: 'Unknown OS',
    },
    userAgent: {
      type: String,
      default: '',
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    location: {
      type: String,
      default: 'Unknown',
    },
  },
  { timestamps: false }
);

// Auto-delete logs older than 90 days
loginHistorySchema.index({ loginTime: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
