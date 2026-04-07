require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const planRoutes = require('./routes/planRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize Express
const app = express();

// Trust Proxy (Essential for Render/Vercel rate limiters)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// ── CORS Middleware (Must be before other middleware) ───────────
app.use(cors({
  origin: 'https://secure-files-ten.vercel.app',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// ── Security Middleware ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── General Middleware ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Always use morgan for request logging in production (to see Render logs)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health Check ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Secure-Files Backend is running 🚀' });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Secure-Files API is running 🚀', env: process.env.NODE_ENV });
});

// ── API Routes ──────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);
app.use('/plans', planRoutes);

// ── Error Handling ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Secure-Files server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.CLIENT_URL}\n`);
});

module.exports = app;
