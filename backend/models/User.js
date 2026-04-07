const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const knownDeviceSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  addedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    dob: Date,
    phone: String,
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    knownDevices: [knownDeviceSchema],
    storageLimit: {
      type: Number,
      default: 52428800, // 50 MB in bytes (default per new request)
    },
    storageUsed: {
      type: Number,
      default: 0,
    },
    lastLoginAt: Date,
    lastLoginRisk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare entered password with hashed
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Check if device is known
userSchema.methods.isKnownDevice = function (ip, userAgent) {
  return this.knownDevices.some(
    (d) => d.ip === ip && d.userAgent === userAgent
  );
};

// Add new device to known list
userSchema.methods.addKnownDevice = function (ip, userAgent) {
  if (!this.isKnownDevice(ip, userAgent)) {
    this.knownDevices.push({ ip, userAgent });
    // Keep only last 10 known devices
    if (this.knownDevices.length > 10) {
      this.knownDevices = this.knownDevices.slice(-10);
    }
  }
};

module.exports = mongoose.model('User', userSchema);
