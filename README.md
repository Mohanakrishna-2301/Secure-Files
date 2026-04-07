# 🔐 Secure-Files

> **Production-level secure file storage and authentication platform built with the MERN stack.**  
> AES-256 encrypted cloud storage · Login risk detection · JWT auth · Google OAuth · 2FA · Admin panel

---

## 📁 Project Structure

```
Secure-auth/
├── backend/          # Node.js + Express API
│   ├── config/       # DB, Cloudinary, Mailer config
│   ├── controllers/  # Auth, User, Files, Admin logic
│   ├── middleware/   # Auth, Admin, Rate-limit, Error, Upload
│   ├── models/       # User, LoginHistory, File, OTP, Session
│   ├── routes/       # Express routers
│   ├── services/     # Email, OTP, Risk Detection, Encryption, Token
│   ├── .env          # ← YOUR CREDENTIALS GO HERE
│   └── server.js     # Entry point
│
└── frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── api/      # Axios instance (auto token refresh)
    │   ├── components/ # UI + Layout components
    │   ├── context/  # Auth + Theme contexts
    │   ├── pages/    # All 11 pages
    │   └── routes/   # Route guards
    │   └── .env      # ← FRONTEND ENV GOES HERE
    └── vite.config.js
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS (dark mode), Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **Auth** | JWT (access + refresh tokens), Google OAuth |
| **Storage** | Cloudinary (encrypted files) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Security** | bcrypt, Helmet, express-rate-limit, AES-256, CORS |
| **2FA** | TOTP via speakeasy + QR code |

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier: 25 GB)
- Gmail account with App Password enabled
- Google Cloud Console project (for Google OAuth)

---

## 🔑 Credentials Guide — `backend/.env`

Fill in every variable in `backend/.env` before starting.

### 1. MongoDB Atlas
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0)
3. Click **Connect → Drivers → Node.js**
4. Copy the connection string and paste it as `MONGODB_URI`
5. Replace `<password>` with your Atlas DB user password

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/secure-files?retryWrites=true&w=majority
```

---

### 2. JWT Secrets
Generate two separate long secrets (run in terminal → Node.js is required):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run twice and paste each result:
```env
JWT_ACCESS_SECRET=<64-char hex string>
JWT_REFRESH_SECRET=<different 64-char hex string>
```

---

### 3. Google OAuth
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create or select a project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

```env
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
```

---

### 4. Cloudinary
1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Go to your **Dashboard**
3. Copy Cloud Name, API Key, and API Secret from the top panel

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxx
```

---

### 5. Gmail SMTP (Nodemailer)
1. Use your Gmail address as `MAIL_USER`
2. Enable **2-Step Verification** on your Google account
3. Go to **Google Account → Security → App Passwords**
4. Select app: **Mail**, Device: **Windows Computer**
5. Copy the 16-character App Password (no spaces)

```env
MAIL_USER=yourgmail@gmail.com
MAIL_PASS=abcdabcdabcdabcd
```

---

### 6. AES-256 File Encryption Key
Generate a 32-byte (64 hex chars) key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
FILE_ENCRYPTION_KEY=<64-character hex string here>
```

> ⚠️ **CRITICAL:** Keep this key safe forever! Losing it means you cannot decrypt uploaded files.

---

### 7. Application URLs
```env
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Running Locally

### Backend
```bash
cd backend
npm install
# Fill in backend/.env with your credentials
npm run dev
# → Server starts at http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → App opens at http://localhost:5173
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Push project to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Deploy — Vercel auto-detects Vite

### Backend → Render
1. Create new **Web Service** in [render.com](https://render.com)
2. Set **Root Directory** to `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Add all environment variables from `backend/.env`
6. Update `CLIENT_URL` to your Vercel frontend URL
7. Update `NODE_ENV=production`

### Database → MongoDB Atlas
- Already configured via `MONGODB_URI`
- Whitelist Render's IP or use `0.0.0.0/0` for development

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| Password hashing | bcrypt (rounds: 12) |
| JWT auth | Access (15m) + Refresh (7d) with rotation |
| File encryption | AES-256-CBC (buffer level, IV prepended) |
| Rate limiting | 10 requests/15min for auth routes |
| HTTP headers | Helmet.js |
| CORS | Locked to `CLIENT_URL` only |
| Refresh tokens | Stored hashed (bcrypt) in DB |
| OTPs | Hashed (bcrypt), TTL-indexed, 10-min expiry |
| Sessions | Auto-expire after 7 days |

---

## 📊 API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register + send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/resend-otp` | Resend OTP |
| POST | `/api/auth/login` | Login (+ 2FA) |
| POST | `/api/auth/google` | Google OAuth |
| POST | `/api/auth/refresh-token` | Rotate tokens (cookie) |
| POST | `/api/auth/logout` | Logout this device |
| POST | `/api/auth/logout-all` | Logout all devices |

### User (Protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user/profile` | Get full profile + sessions |
| PUT | `/api/user/update` | Update name/avatar |
| PUT | `/api/user/change-password` | Change password |
| POST | `/api/user/enable-2fa` | Start 2FA setup |
| POST | `/api/user/verify-2fa` | Activate 2FA |
| POST | `/api/user/disable-2fa` | Disable 2FA |
| DELETE | `/api/user/sessions/:id` | Terminate session |
| POST | `/api/user/upgrade` | Upgrade storage plan |

### Files (Protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/files/upload` | Encrypt + upload file |
| GET | `/api/files` | List files |
| GET | `/api/files/:id` | Get signed URL |
| GET | `/api/files/:id/download` | Decrypt + download |
| DELETE | `/api/files/:id` | Delete file |
| POST | `/api/files/:id/share` | Create share link |

### Admin (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform stats |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/users/:id` | User details |
| DELETE | `/api/admin/user/:id` | Delete user + files |
| PUT | `/api/admin/storage-limit` | Set storage limit |
| PUT | `/api/admin/promote/:id` | Promote to admin |
| GET | `/api/admin/risk-logs` | Login risk logs |

---

## 📄 License

MIT — built for educational/portfolio use. Add a payment provider (Stripe) before commercial deployment.
