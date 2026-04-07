const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 465, // Using port 465 for SSL (more stable in cloud environments)
  secure: true, 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  family: 4, 
  connectionTimeout: 30000, // 30 seconds
  greetingTimeout: 30000, 
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
