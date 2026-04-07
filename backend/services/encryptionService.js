const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

const getKey = () => {
  const hexKey = process.env.FILE_ENCRYPTION_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error('FILE_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypt a file buffer using AES-256-CBC
 * @param {Buffer} buffer - Raw file data
 * @returns {Buffer} - IV (16 bytes) + encrypted data
 */
const encryptBuffer = (buffer) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  // Prepend IV so we can decrypt later
  return Buffer.concat([iv, encrypted]);
};

/**
 * Decrypt a file buffer using AES-256-CBC
 * @param {Buffer} encryptedBuffer - IV (16 bytes) + encrypted data
 * @returns {Buffer} - Original file data
 */
const decryptBuffer = (encryptedBuffer) => {
  const key = getKey();
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const encrypted = encryptedBuffer.slice(IV_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

module.exports = { encryptBuffer, decryptBuffer };
