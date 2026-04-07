const cloudinary = require('../config/cloudinary');
const File = require('../models/File');
const User = require('../models/User');
const { encryptBuffer, decryptBuffer } = require('../services/encryptionService');
const { v4: uuidv4 } = require('uuid');
const streamifier = require('streamifier');

const MAX_STORAGE = (user) => user.storageLimit;

// Helper: upload buffer to Cloudinary as raw resource
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `secure-files/${folder}`,
        public_id: publicId,
        resource_type: 'raw',
        overwrite: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// @desc   Upload encrypted file
// @route  POST /api/files/upload
// @access Protected
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const user = await User.findById(req.user._id);
  if (user.storageUsed + req.file.size > user.storageLimit) {
    return res.status(400).json({
      success: false,
      message: 'Storage limit exceeded. Please upgrade your plan.',
    });
  }

  // Encrypt the file buffer
  const encryptedBuffer = encryptBuffer(req.file.buffer);

  // Generate unique ID for the file
  const publicId = `${req.user._id}_${uuidv4()}`;

  // Upload encrypted buffer to Cloudinary
  const cloudResult = await uploadToCloudinary(
    encryptedBuffer,
    req.user._id.toString(),
    publicId
  );

  // Save file metadata to MongoDB
  const fileDoc = await File.create({
    userId: req.user._id,
    fileName: `${req.file.originalname}.enc`,
    originalName: req.file.originalname,
    cloudinaryUrl: cloudResult.secure_url,
    publicId: cloudResult.public_id,
    mimeType: req.file.mimetype,
    size: req.file.size,
    encrypted: true,
  });

  // Update user storage usage
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { storageUsed: req.file.size },
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded and encrypted successfully.',
    file: {
      id: fileDoc._id,
      originalName: fileDoc.originalName,
      size: fileDoc.size,
      mimeType: fileDoc.mimeType,
      encrypted: fileDoc.encrypted,
      uploadedAt: fileDoc.createdAt,
    },
  });
};

// @desc   List user's files
// @route  GET /api/files
// @access Protected
const getFiles = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = { userId: req.user._id };
  if (search) {
    query.originalName = { $regex: search, $options: 'i' };
  }

  const files = await File.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-cloudinaryUrl -publicId'); // Don't expose Cloudinary URLs directly

  const total = await File.countDocuments(query);

  res.json({
    success: true,
    files,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
  });
};

// @desc   Get signed download URL for a file
// @route  GET /api/files/:id
// @access Protected
const getFileUrl = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  // Generate signed Cloudinary URL (valid for 5 minutes)
  const signedUrl = cloudinary.utils.private_download_url(file.publicId, 'raw', {
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min
    attachment: true,
  });

  // Update download count
  await File.findByIdAndUpdate(file._id, {
    $inc: { downloadCount: 1 },
    lastDownloadedAt: new Date(),
  });

  res.json({
    success: true,
    signedUrl,
    file: {
      id: file._id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      encrypted: file.encrypted,
    },
  });
};

// @desc   Download and decrypt file content
// @route  GET /api/files/:id/download
// @access Protected
const downloadFile = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  // Fetch encrypted file from Cloudinary
  const response = await fetch(file.cloudinaryUrl);
  if (!response.ok) {
    return res.status(500).json({ success: false, message: 'Failed to fetch file from storage.' });
  }
  const encryptedBuffer = Buffer.from(await response.arrayBuffer());

  // Decrypt
  const decryptedBuffer = decryptBuffer(encryptedBuffer);

  // Update download count
  await File.findByIdAndUpdate(file._id, {
    $inc: { downloadCount: 1 },
    lastDownloadedAt: new Date(),
  });

  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', decryptedBuffer.length);
  res.send(decryptedBuffer);
};

// @desc   Delete file
// @route  DELETE /api/files/:id
// @access Protected
const deleteFile = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
  if (!file) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  // Delete from Cloudinary
  await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' });

  // Update user storage
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { storageUsed: -file.size },
  });

  await file.deleteOne();
  res.json({ success: true, message: 'File deleted successfully.' });
};

// @desc   Generate a temporary share link
// @route  POST /api/files/:id/share
// @access Protected
const shareFile = async (req, res) => {
  const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
  if (!file) return res.status(404).json({ success: false, message: 'File not found.' });

  const shareToken = uuidv4();
  const shareExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  file.shareToken = shareToken;
  file.shareExpiresAt = shareExpiresAt;
  await file.save();

  const shareUrl = `${process.env.CLIENT_URL}/share/${shareToken}`;
  res.json({ success: true, shareUrl, expiresAt: shareExpiresAt });
};

module.exports = { uploadFile, getFiles, getFileUrl, downloadFile, deleteFile, shareFile };
