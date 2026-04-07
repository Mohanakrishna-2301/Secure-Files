const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'REGISTER',
        'OTP_VERIFY',
        'OTP_RESEND',
        'PASSWORD_CHANGE',
        'PROFILE_UPDATE',
        'FILE_UPLOAD',
        'FILE_DELETE',
        'FILE_DOWNLOAD',
        'PLAN_UPGRADE',
        'ADMIN_DELETE_USER',
        'ADMIN_PROMOTE_USER',
        'ADMIN_BLOCK_USER',
        'ADMIN_UNBLOCK_USER',
        'ADMIN_UPDATE_STORAGE',
        'ADMIN_SEND_WARNING',
        'ADMIN_FLAG_USER',
        'ADMIN_CREATE_USER',
      ],
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: 'Unknown',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Auto-delete logs older than 180 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
