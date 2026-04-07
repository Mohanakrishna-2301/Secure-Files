const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const cloudinary = require('../config/cloudinary');

/* ── helpers ─────────────────────────────────────────────────── */
const fmtDate = (d) => new Date(d).toISOString().slice(0, 10); // "YYYY-MM-DD"

// @desc   Get all users
// @route  GET /api/admin/users
// @access Admin
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, role, riskLevel } = req.query;
  const query = {};

  // Optionally filter by non-admin by default
  if (!role) query.role = { $ne: 'admin' };
  else if (role !== 'all') query.role = role;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (riskLevel) query.lastLoginRisk = riskLevel;

  const users = await User.find(query)
    .select('-knownDevices -twoFactorSecret')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    users,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
};

// @desc   Get a single user's details
// @route  GET /api/admin/users/:id
// @access Admin
const getUserDetails = async (req, res) => {
  const user = await User.findById(req.params.id).select('-twoFactorSecret');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const loginHistory = await LoginHistory.find({ userId: user._id }).sort({ loginTime: -1 }).limit(25);
  const recentLogs   = await ActivityLog.find({ userId: user._id }).sort({ createdAt: -1 }).limit(20);

  res.json({ success: true, user, loginHistory, activityLogs: recentLogs });
};

// @desc   Update a user (name, email, role, storageLimit)
// @route  PUT /api/admin/user/:id
// @access Admin
const updateUser = async (req, res) => {
  const allowedFields = ['name', 'email', 'storageLimit'];
  const update = {};
  for (const f of allowedFields) {
    if (req.body[f] !== undefined) update[f] = req.body[f];
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-twoFactorSecret -password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await ActivityLog.create({
    userId: user._id,
    action: 'ADMIN_UPDATE_STORAGE',
    meta: { updatedFields: Object.keys(update) },
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.json({ success: true, message: 'User updated.', user });
};

// @desc   Delete a user
// @route  DELETE /api/admin/user/:id
// @access Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Cannot delete your own account.' });
  }

  // Delete all their files from Cloudinary
  const files = await File.find({ userId: user._id });
  for (const file of files) {
    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' }).catch(() => {});
  }
  await File.deleteMany({ userId: user._id });
  await LoginHistory.deleteMany({ userId: user._id });
  await ActivityLog.deleteMany({ userId: user._id });

  await ActivityLog.create({
    action: 'ADMIN_DELETE_USER',
    meta: { deletedUserId: user._id, deletedUserEmail: user.email },
    ip: req.ip,
    performedBy: req.user._id,
  });

  await user.deleteOne();

  res.json({ success: true, message: 'User and all associated data deleted.' });
};

// @desc   Update user storage limit
// @route  PUT /api/admin/storage-limit
// @access Admin
const updateStorageLimit = async (req, res) => {
  const { userId, storageLimit } = req.body;
  if (!userId || !storageLimit) {
    return res.status(400).json({ success: false, message: 'userId and storageLimit are required.' });
  }

  const user = await User.findByIdAndUpdate(userId, { storageLimit }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await ActivityLog.create({
    userId: user._id,
    action: 'ADMIN_UPDATE_STORAGE',
    meta: { newLimit: storageLimit },
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.json({ success: true, message: 'Storage limit updated.', storageLimit: user.storageLimit });
};

// @desc   Promote user to admin
// @route  PUT /api/admin/promote/:id
// @access Admin
const promoteToAdmin = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await ActivityLog.create({
    userId: user._id,
    action: 'ADMIN_PROMOTE_USER',
    meta: { newRole: 'admin' },
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.json({ success: true, message: `${user.name} promoted to admin.` });
};

// @desc   Block / unblock a user
// @route  POST /api/admin/block-user/:id
// @access Admin
const blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot block an admin account.' });
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  const action = user.isBlocked ? 'ADMIN_BLOCK_USER' : 'ADMIN_UNBLOCK_USER';
  await ActivityLog.create({
    userId: user._id,
    action,
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.json({ success: true, isBlocked: user.isBlocked, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.` });
};

// @desc   Flag / unflag a user
// @route  POST /api/admin/flag-user/:id
// @access Admin
const flagUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.flagged = !user.flagged;
  await user.save();

  await ActivityLog.create({
    userId: user._id,
    action: 'ADMIN_FLAG_USER',
    meta: { flagged: user.flagged },
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.json({ success: true, flagged: user.flagged, message: `User ${user.flagged ? 'flagged' : 'unflagged'}.` });
};

// @desc   Get risk logs
// @route  GET /api/admin/risk-logs
// @access Admin
const getRiskLogs = async (req, res) => {
  const { riskLevel, page = 1, limit = 50 } = req.query;
  const query = {};
  if (riskLevel) query.riskLevel = riskLevel;

  const logs = await LoginHistory.find(query)
    .populate('userId', 'name email avatar isBlocked flagged')
    .sort({ loginTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await LoginHistory.countDocuments(query);
  const stats = {
    low:    await LoginHistory.countDocuments({ riskLevel: 'low' }),
    medium: await LoginHistory.countDocuments({ riskLevel: 'medium' }),
    high:   await LoginHistory.countDocuments({ riskLevel: 'high' }),
  };

  // Build risk trend: last 7 days grouped
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const trendData = await LoginHistory.aggregate([
    { $match: { loginTime: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } }, risk: '$riskLevel' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  res.json({ success: true, logs, stats, trendData, pagination: { page: parseInt(page), total } });
};

// @desc   Get dashboard stats
// @route  GET /api/admin/stats  OR  /api/admin/dashboard-stats
// @access Admin
const getDashboardStats = async (req, res) => {
  const now = new Date();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalFiles, verifiedUsers, highRiskLogins, activeUsersCount] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    File.countDocuments(),
    User.countDocuments({ verified: true, role: 'user' }),
    LoginHistory.countDocuments({ riskLevel: 'high', loginTime: { $gte: yesterday } }),
    LoginHistory.distinct('userId', { loginTime: { $gte: yesterday } }).then((ids) => ids.length),
  ]);

  const storageStats = await File.aggregate([
    { $group: { _id: null, totalSize: { $sum: '$size' }, count: { $sum: 1 } } },
  ]);

  // Login activity: last 14 days per day
  const loginTrend = await LoginHistory.aggregate([
    { $match: { loginTime: { $gte: new Date(now - 14 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$loginTime' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  // New users: last 14 days
  const newUsersTrend = await User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: new Date(now - 14 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', count: 1, _id: 0 } },
  ]);

  // Risk distribution for pie chart
  const riskDistribution = {
    low:    await LoginHistory.countDocuments({ riskLevel: 'low' }),
    medium: await LoginHistory.countDocuments({ riskLevel: 'medium' }),
    high:   await LoginHistory.countDocuments({ riskLevel: 'high' }),
  };

  // Recent activity feed (last 10 logins + last 5 registrations)
  const recentLogins = await LoginHistory.find()
    .populate('userId', 'name email avatar')
    .sort({ loginTime: -1 })
    .limit(10);

  const recentRegistrations = await User.find({ role: 'user' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .limit(5);

  const highRiskAlerts = await LoginHistory.find({ riskLevel: 'high' })
    .populate('userId', 'name email')
    .sort({ loginTime: -1 })
    .limit(5);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalFiles,
      verifiedUsers,
      highRiskLogins,
      activeUsers: activeUsersCount,
      totalStorageUsed: storageStats[0]?.totalSize || 0,
    },
    loginTrend,
    newUsersTrend,
    riskDistribution,
    recentLogins,
    recentRegistrations,
    highRiskAlerts,
  });
};

// @desc   Get storage overview
// @route  GET /api/admin/storage
// @access Admin
const getStorageStats = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const users = await User.find({ role: 'user' })
    .select('name email storageUsed storageLimit plan createdAt')
    .populate('plan', 'name')
    .sort({ storageUsed: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await User.countDocuments({ role: 'user' });

  const [totalUsed, totalAllocated] = await Promise.all([
    User.aggregate([{ $match: { role: 'user' } }, { $group: { _id: null, sum: { $sum: '$storageUsed' } } }]),
    User.aggregate([{ $match: { role: 'user' } }, { $group: { _id: null, sum: { $sum: '$storageLimit' } } }]),
  ]);

  res.json({
    success: true,
    users,
    overview: {
      totalUsed: totalUsed[0]?.sum || 0,
      totalAllocated: totalAllocated[0]?.sum || 0,
    },
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
};

// @desc   Get activity logs (system-wide)
// @route  GET /api/admin/activity-logs
// @access Admin
const getActivityLogs = async (req, res) => {
  const { page = 1, limit = 50, userId, action, from, to } = req.query;
  const query = {};

  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to)   query.createdAt.$lte = new Date(to);
  }

  const logs = await ActivityLog.find(query)
    .populate('userId', 'name email avatar')
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await ActivityLog.countDocuments(query);

  res.json({
    success: true,
    logs,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
};

// @desc   Create new user/admin
// @route  POST /api/admin/create-user
// @access Admin
const createUser = async (req, res) => {
  const { name, email, password, role = 'user', storageLimit } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already exists.' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    verified: true,
    storageLimit: storageLimit ? storageLimit * 1024 * 1024 : 52428800, // Handle MB to bytes
  });

  await ActivityLog.create({
    action: 'ADMIN_CREATE_USER',
    meta: { createdUserId: user._id, createdEmail: user.email, role },
    ip: req.ip,
    performedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = {
  getAllUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  updateStorageLimit,
  promoteToAdmin,
  blockUser,
  flagUser,
  getRiskLogs,
  getDashboardStats,
  getStorageStats,
  getActivityLogs,
  createUser,
};
