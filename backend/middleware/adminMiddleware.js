/**
 * Protect route — verify if user has admin role
 * Exported both as named export and default for compatibility
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Administrative privileges required.' });
  }
};

// Support both: require('../middleware/adminMiddleware') and { isAdmin }
module.exports = isAdmin;
module.exports.isAdmin = isAdmin;
