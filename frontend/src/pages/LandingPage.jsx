import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Lock, Shield, Zap, Cloud, Eye, Users, ChevronRight,
  CheckCircle, Star, Globe, Cpu, FileKey, AlertTriangle, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const features = [
  { icon: FileKey,      title: 'AES-256 Encryption',    desc: 'Every file is encrypted before leaving your device. Only you can decrypt it.' },
  { icon: Shield,       title: 'Login Risk Detection',   desc: 'AI-powered analysis of IP, device, and time patterns detects suspicious logins.' },
  { icon: Cpu,          title: 'Two-Factor Auth',        desc: 'TOTP-based 2FA compatible with Google Authenticator and Authy.' },
  { icon: Cloud,        title: 'Cloud Storage',          desc: 'Files stored on Cloudinary CDN with signed-URL access control.' },
  { icon: Eye,          title: 'Access Logs',            desc: 'Full login history with device, IP, and risk level for every session.' },
  { icon: Globe,        title: 'Multi-device Sessions',  desc: 'View and terminate active sessions across all your devices instantly.' },
];

const plans = [
  { name: 'Free',    price: '$0',  storage: '100 MB', color: 'border-white/10',     features: ['5 file uploads', 'Basic encryption', 'Email OTP', '1 device session'] },
  { name: 'Pro',     price: '$9',  storage: '1 GB',   color: 'border-brand-500/50', features: ['Unlimited uploads', 'AES-256 encryption', '2FA support', '5 device sessions'], popular: true },
  { name: 'Premium', price: '$29', storage: '10 GB',  color: 'border-violet-500/50', features: ['Unlimited uploads', 'Priority support', 'File sharing links', 'Unlimited sessions'] },
];

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);

  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-400 transition-colors duration-300 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-dark-400/70 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">Secure-Files</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <a href="#security" className="hover:text-slate-200 transition-colors">Security</a>
          <a href="#pricing"  className="hover:text-slate-200 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/login"    className="text-sm text-slate-400 hover:text-slate-200 transition-colors px-4 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center text-center px-4 pt-20 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px] pointer-events-none" />

        <motion.div style={{ y }} className="relative z-10 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Military-grade file encryption
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-display font-black text-slate-100 leading-tight mb-6"
          >
            Your Files,{' '}
            <span className="gradient-text">Fortress-Level</span>{' '}
            Secure
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10"
          >
            AES-256 encrypted cloud storage with intelligent login risk detection,
            Two-Factor Authentication, and real-time security monitoring.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 animate-glow">
              Start Free Today <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
              Sign In
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-12 text-slate-500 text-sm"
          >
            {['AES-256 Encrypted', 'Zero-knowledge', 'GDPR Ready', 'SOC2 Aligned'].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-success" /> {b}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
        >
          <div className="w-0.5 h-8 bg-gradient-to-b from-brand-500 to-transparent" />
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-100 mb-4">
              Everything You Need to Stay <span className="gradient-text">Secure</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Enterprise-grade security features wrapped in a beautifully simple interface.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                {...fadeUp}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-card p-6 hover:border-brand-500/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 group-hover:shadow-brand transition-shadow duration-300">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-900/10 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-warning/10 border border-warning/20 rounded-full text-warning text-sm font-medium mb-4">
                <AlertTriangle className="w-4 h-4" /> Risk Detection Engine
              </span>
              <h2 className="text-4xl font-display font-bold text-slate-100 mb-5">
                We Know When Something Feels <span className="gradient-text">Wrong</span>
              </h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Every login is scored against your known patterns — IP address, device fingerprint, and time of day.
                Suspicious logins trigger instant email alerts.
              </p>
              <div className="space-y-3">
                {[
                  { color: 'bg-success', label: 'Low Risk',    desc: 'Known device + IP, normal hours' },
                  { color: 'bg-warning', label: 'Medium Risk', desc: 'New device or unfamiliar IP' },
                  { color: 'bg-danger',  label: 'High Risk',   desc: 'New device + unusual login time' },
                ].map(({ color, label, desc }) => (
                  <div key={label} className="flex items-center gap-4 glass-card p-4">
                    <div className={`w-3 h-3 rounded-full ${color} flex-shrink-0 animate-pulse`} />
                    <div>
                      <p className="text-slate-200 text-sm font-medium">{label}</p>
                      <p className="text-slate-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="glass-card p-8">
              <div className="font-mono text-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-4">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>Risk Analysis Engine — Live</span>
                </div>
                {[
                  { key: 'IP Address',    val: '192.168.1.42', match: true  },
                  { key: 'Device',        val: 'Chrome / Windows', match: true },
                  { key: 'Login Time',    val: '10:23 AM IST', match: true },
                  { key: 'Risk Score',    val: '0 / 30',       match: true },
                  { key: 'Risk Level',    val: '🟢 LOW',       match: true },
                ].map(({ key, val, match }) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-slate-500">{key}</span>
                    <span className={match ? 'text-success' : 'text-danger'}>{val}</span>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg text-success text-xs">
                  ✓ Login approved — all signals normal
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-100 mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-slate-400">No hidden fees. Upgrade or downgrade anytime.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-8 border-2 relative ${plan.color} ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-gradient rounded-full text-white text-xs font-bold shadow-brand">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-100 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-display font-black gradient-text">{plan.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.storage} storage included</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-brand-500" />
          <span className="font-display font-semibold text-slate-400">Secure-Files</span>
        </div>
        <p>© {new Date().getFullYear()} Secure-Files. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
