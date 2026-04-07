const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_PORT == 465, // true for 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  family: 4,
  connectionTimeout: 10000, // Reduced timeout
  greetingTimeout: 10000,
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Mail transporter error:', error.message);
  } else {
    console.log('✅ Mail transporter ready');
  }
});

module.exports = transporter;
