const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  getFileUrl,
  downloadFile,
  deleteFile,
  shareFile,
} = require('../controllers/fileController');
const protect = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(protect); // All file routes require authentication

router.post('/upload', uploadLimiter, upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFileUrl);
router.get('/:id/download', downloadFile);
router.delete('/:id', deleteFile);
router.post('/:id/share', shareFile);

module.exports = router;
