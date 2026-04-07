import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const bars  = [
    'bg-danger', 'bg-warning', 'bg-warning', 'bg-success',
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? bars[score - 1] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-success' : 'text-slate-600'}`}>
            <CheckCircle className={`w-3 h-3 ${ok ? 'text-success' : 'text-slate-700'}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]         = useState({ name: '', email: '', password: '', terms: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to retrieve Google profile.');
        }

        const userProfile = await userInfoResponse.json();
        
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
        toast.success(`Welcome to Secure-Files, ${data.user.name}!`);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google authentication failed on server.');
      }
    },
    onError: () => toast.error('Google login popup was closed or failed.')
  });

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [e.target.name]: val }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError('All fields are required.');
    if (!form.terms) return setError('Please accept the Terms & Conditions.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      toast.success('Account created! Check your email for OTP.');
      navigate('/verify-otp', { state: { email: form.email, purpose: 'register' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 relative bg-dark-100 flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-10" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px]" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-6 shadow-brand-lg animate-float">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-black text-slate-100 mb-3">Join Secure-Files</h2>
          <p className="text-slate-400 max-w-xs">Create your encrypted vault in 60 seconds. No credit card required.</p>
          <div className="mt-8 glass-card p-6 text-left space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-success" /></div>
              <div><p className="text-slate-200 text-sm font-medium">OTP Email Verification</p><p className="text-slate-500 text-xs">Confirm your identity before getting started</p></div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0"><Lock className="w-4 h-4 text-brand-400" /></div>
              <div><p className="text-slate-200 text-sm font-medium">100 MB Free Storage</p><p className="text-slate-500 text-xs">All files encrypted with AES-256 before upload</p></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center"><Lock className="w-4 h-4 text-white" /></div>
            <span className="font-display font-bold gradient-text text-lg">Secure-Files</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-100 mb-1">Create Account</h1>
          <p className="text-slate-400 mb-8">Already have one? <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link></p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-xl mb-6 text-danger text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input name="name" value={form.name} onChange={handleChange}
                  className="input-field pl-11" placeholder="John Doe" />
              </div>
            </div>

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
                  className="input-field pl-11 pr-11" placeholder="Min 8 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && <PasswordStrength password={form.password} />}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-brand-500 accent-brand-500" />
              <span className="text-slate-400 text-sm">
                I agree to the <Link to="#" className="text-brand-400 hover:text-brand-300">Terms of Service</Link> and{' '}
                <Link to="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center"><span className="bg-dark-400 px-3 text-slate-500 text-sm">or</span></div>
          </div>

          <button type="button" className="btn-secondary w-full flex items-center justify-center gap-3" onClick={() => handleGoogleLogin()}>
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

export default RegisterPage;
