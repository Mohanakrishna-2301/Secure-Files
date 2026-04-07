const transporter = require('../config/mailer');

const FROM = `"Secure-Files" <${process.env.MAIL_USER}>`;

/**
 * Send OTP Verification Email
 */
const sendOTPEmail = async (email, otp, purpose = 'register') => {
  const subjects = {
    register: 'Verify Your Email — Secure-Files',
    login: 'Your Login OTP — Secure-Files',
    '2fa': 'Two-Factor Authentication Code — Secure-Files',
    'password-reset': 'Password Reset OTP — Secure-Files',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; color: white; }
          .body { padding: 32px; }
          .otp-box { background: #0f0f1a; border: 2px solid #6366f1; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
          .otp { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #a78bfa; }
          .note { color: #94a3b8; font-size: 14px; margin-top: 8px; }
          .footer { padding: 16px 32px; color: #475569; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Secure-Files</h1>
          </div>
          <div class="body">
            <p>Hi there,</p>
            <p>Your one-time verification code is:</p>
            <div class="otp-box">
              <div class="otp">${otp}</div>
              <div class="note">This code expires in 10 minutes. Do not share it with anyone.</div>
            </div>
            <p>If you didn't request this code, please ignore this email or contact support immediately.</p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Secure-Files · All rights reserved
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: subjects[purpose] || 'Your OTP Code',
    html,
  });
};

/**
 * Send Login Risk Alert Email
 */
const sendRiskAlertEmail = async (email, name, riskData) => {
  const riskColors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  const riskEmojis = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  const color = riskColors[riskData.riskLevel] || '#94a3b8';
  const emoji = riskEmojis[riskData.riskLevel] || '⚪';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0f0f1a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; color: white; }
          .body { padding: 32px; }
          .risk-badge { display: inline-block; background: ${color}20; border: 2px solid ${color}; color: ${color}; border-radius: 8px; padding: 8px 20px; font-weight: 700; font-size: 18px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
          .label { color: #64748b; }
          .value { color: #e2e8f0; font-weight: 500; }
          .footer { padding: 16px 32px; color: #475569; font-size: 12px; text-align: center; border-top: 1px solid #1e293b; }
          .btn { display: inline-block; background: #6366f1; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Security Alert — Login Detected</h1>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We detected a new login to your Secure-Files account. Here are the details:</p>
            <br/>
            <div class="detail-row"><span class="label">Risk Level</span><span class="value">${emoji} ${riskData.riskLevel.toUpperCase()}</span></div>
            <div class="detail-row"><span class="label">IP Address</span><span class="value">${riskData.ip}</span></div>
            <div class="detail-row"><span class="label">Device</span><span class="value">${riskData.device}</span></div>
            <div class="detail-row"><span class="label">Browser</span><span class="value">${riskData.browser}</span></div>
            <div class="detail-row"><span class="label">Time</span><span class="value">${new Date().toLocaleString()}</span></div>
            <br/>
            ${riskData.riskLevel !== 'low'
              ? `<p><strong>⚠️ If this wasn't you</strong>, please log out of all devices and change your password immediately.</p>`
              : `<p>Everything looks normal! This alert is just for your awareness.</p>`
            }
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Secure-Files · All rights reserved
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${emoji} Login Alert: ${riskData.riskLevel.toUpperCase()} Risk — Secure-Files`,
    html,
  });
};

module.exports = { sendOTPEmail, sendRiskAlertEmail };
