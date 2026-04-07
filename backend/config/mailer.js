const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT),
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  family: 4, // Force IPv4 to avoid ENETUNREACH errors on IPv6
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
