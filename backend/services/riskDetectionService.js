const LoginHistory = require('../models/LoginHistory');

/**
 * Risk Detection Engine
 *
 * Factors:
 *   - Is the IP address known from previous logins?        → -20 pts (reduces risk)
 *   - Is the user agent / device known?                    → -20 pts
 *   - Is the login time within normal hours (8am–10pm)?   → -10 pts
 *
 * Scoring → Risk Level:
 *   0  pts → 🟢 LOW
 *   1–20   → 🟡 MEDIUM
 *   21+    → 🔴 HIGH
 */
const calculateRiskLevel = (score) => {
  if (score <= 0) return 'low';
  if (score <= 20) return 'medium';
  return 'high';
};

const analyzeLoginRisk = async (user, ip, userAgent) => {
  let score = 30; // Start high — subtract if familiar signals found

  // Check: known IP  
  const ipKnown = user.knownDevices.some((d) => d.ip === ip);
  if (ipKnown) score -= 20;

  // Check: known device (user agent)
  const deviceKnown = user.knownDevices.some((d) => d.userAgent === userAgent);
  if (deviceKnown) score -= 20;

  // Check: login hour (IST — adjust to UTC offset +5:30)
  const loginHour = new Date().getUTCHours() + 5; // rough India time approximation
  const normalHours = loginHour >= 8 && loginHour <= 22;
  if (normalHours) score -= 10;

  const riskLevel = calculateRiskLevel(score);

  return { riskLevel, score, ipKnown, deviceKnown, normalHours };
};

/**
 * Log a login event to LoginHistory
 */
const logLoginEvent = async (userId, ip, device, browser, os, userAgent, riskLevel) => {
  await LoginHistory.create({
    userId,
    ipAddress: ip,
    device,
    browser,
    os,
    userAgent,
    riskLevel,
    loginTime: new Date(),
  });
};

module.exports = { analyzeLoginRisk, logLoginEvent };
