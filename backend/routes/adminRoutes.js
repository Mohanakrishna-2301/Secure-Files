const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

// All admin routes: authenticate + admin role check
router.use(protect, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);
router.get('/dashboard-stats', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.post('/create-user', createUser);

// Promote / block / flag
router.put('/promote/:id', promoteToAdmin);
router.post('/block-user/:id', blockUser);
router.post('/flag-user/:id', flagUser);

// Storage
router.get('/storage', getStorageStats);
router.put('/storage-limit', updateStorageLimit);

// Risk logs
router.get('/risk-logs', getRiskLogs);

// Activity logs
router.get('/activity-logs', getActivityLogs);

module.exports = router;
