import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '', totpCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill all fields.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.requiresTwoFactor) {
        setRequires2FA(true);
        toast('Please enter your 2FA code', { icon: '🔐' });
      } else {
        login(data.user, data.accessToken);
        toast.success(`Welcome back, ${data.user.name}! Risk: ${data.riskLevel?.toUpperCase()}`);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user metadata from Google safely instead of decoding a raw ID token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to retrieve Google profile.');
        }

        const userProfile = await userInfoResponse.json();
        
        // Pass to our backend
        const { data } = await api.post('/auth/google', {
          googleId: userProfile.sub,
          email: userProfile.email,
          name: userProfile.name,
          avatar: userProfile.picture
        });

        if (data.requiresOTP) {
          toast.success(data.message);
          navigate('/verify-otp', { state: { email: data.email, purpose: 'register' } });
          return;
        }

        login(data.user, data.accessToken);
        toast.success(`Google verification successful, ${data.user.name}!`);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google authentication failed on server.');
      }
    },
    onError: () => toast.error('Google login popup was closed or failed.')
  });

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-dark-100 flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-brand-gradient opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-[60px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-violet-500/20 rounded-full blur-[60px]" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-6 shadow-brand-lg animate-glow">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-black text-slate-100 mb-3">Welcome Back</h2>
          <p className="text-slate-400 max-w-xs">Your files are encrypted and waiting. Sign in to access your secure vault.</p>
          <div className="mt-8 space-y-3 text-left">
            {['AES-256 encrypted files', 'Login risk analysis', 'Multi-device sessions'].map((t) => (
              <div key={t} className="flex items-center gap-3 glass-card px-4 py-3">
                <Shield className="w-4 h-4 text-brand-400" />
                <span className="text-slate-300 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold gradient-text text-lg">Secure-Files</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Sign In</h1>
          <p className="text-slate-400 mb-8">Don't have an account? <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one</Link></p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl mb-6 text-danger text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field pl-11" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  className="input-field pl-11 pr-11" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {requires2FA && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="form-label">2FA Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="w-4 h-4 text-slate-500" />
                  </div>
                  <input name="totpCode" type="text" value={form.totpCode} onChange={handleChange}
                    className="input-field pl-11 text-center tracking-widest text-lg" placeholder="000 000" maxLength={6} />
                </div>
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-dark-400 px-3 text-slate-500 text-sm">or continue with</span></div>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogleLogin}
            className="btn-secondary w-full flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
