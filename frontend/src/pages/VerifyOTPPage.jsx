import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const DIGITS = 6;

const VerifyOTPPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const email     = location.state?.email || '';
  const purpose   = location.state?.purpose || 'register';

  const [otp, setOtp]         = useState(Array(DIGITS).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]     = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) { navigate('/register'); return; }
    inputRefs.current[0]?.focus();
  }, [email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleInput = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError('');
    if (idx < DIGITS - 1) inputRefs.current[idx + 1]?.focus();
    // Auto-submit when last digit entered
    if (idx === DIGITS - 1 && next.every((d) => d)) {
      submitOTP(next.join(''));
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      const next = [...otp];
      if (next[idx]) {
        next[idx] = '';
        setOtp(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGITS);
    if (pasted.length === DIGITS) {
      setOtp(pasted.split(''));
      submitOTP(pasted);
    }
  };

  const submitOTP = async (code) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code, purpose });
      
      if (purpose === 'register' && data.accessToken && data.user) {
         login(data.user, data.accessToken);
         toast.success('Email verified successfully! Welcome.');
         navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      } else {
         toast.success('Success! Please continue.');
         navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(Array(DIGITS).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose });
      toast.success('New OTP sent to your email.');
      setCountdown(60);
      setOtp(Array(DIGITS).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleManualSubmit = () => {
    const code = otp.join('');
    if (code.length === DIGITS) submitOTP(code);
    else setError('Please enter all 6 digits.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark-gradient" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className="glass-card p-10 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-brand">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Verify Your Email</h1>
          <p className="text-slate-400 text-sm mt-2">
            We sent a 6-digit code to <span className="text-brand-400 font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-danger/10 border border-danger/30 rounded-xl mb-6 text-danger text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* OTP Input Grid */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(e, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 bg-white/5 text-slate-100
                ${digit
                  ? 'border-brand-500 shadow-brand ring-1 ring-brand-500/30'
                  : 'border-white/10 focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20'
                }
                outline-none`}
            />
          ))}
        </div>

        <button onClick={handleManualSubmit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mb-4">
          {loading ? <LoadingSpinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Verify Code</>}
        </button>

        {/* Resend */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-slate-500 text-sm">Resend code in <span className="text-brand-400 font-medium">{countdown}s</span></p>
          ) : (
            <button onClick={handleResend} disabled={resending}
              className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-sm font-medium mx-auto transition-colors">
              {resending ? <LoadingSpinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              Resend Code
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-slate-500 hover:text-slate-300 text-sm">← Back to Register</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTPPage;
