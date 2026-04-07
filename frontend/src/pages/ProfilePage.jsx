import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Shield, Monitor, Trash2, CheckCircle,
  Eye, EyeOff, QrCode, AlertCircle, LogOut, Calendar, Phone,
  HardDrive, Zap, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDistanceToNow, format } from 'date-fns';

const fmtStorage = (bytes = 0) => {
  const GB = 1024 ** 3, MB = 1024 ** 2;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  return `${(bytes / MB).toFixed(1)} MB`;
};

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('profile');
  const [sessions, setSessions] = useState([]);
  const [profile, setProfile]   = useState({
    name:   user?.name   || '',
    avatar: user?.avatar || '',
    dob:    user?.dob    ? format(new Date(user.dob), 'yyyy-MM-dd') : '',
    phone:  user?.phone  || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPass, setShowPass]   = useState({ currentPassword: false, newPassword: false, confirm: false });
  const [twoFA, setTwoFA]         = useState({ secret: '', qrCode: '', token: '', step: 'idle' });
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    api.get('/user/profile').then(({ data }) => {
      setSessions(data.activeSessions || []);
      // Refresh profile fields from server
      if (data.user) {
        setProfile({
          name:   data.user.name   || '',
          avatar: data.user.avatar || '',
          dob:    data.user.dob    ? format(new Date(data.user.dob), 'yyyy-MM-dd') : '',
          phone:  data.user.phone  || '',
        });
      }
    }).catch(() => {});
  }, []);

  // ── Profile Update ──
  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/user/update', profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  // ── Password Change ──
  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match.');
    if (passwords.newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    setSaving(true);
    try {
      await api.put('/user/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  // ── 2FA ──
  const start2FA = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/user/enable-2fa');
      setTwoFA(p => ({ ...p, secret: data.secret, qrCode: data.qrCode, step: 'scan' }));
    } catch { toast.error('Failed to initialize 2FA.'); }
    finally { setLoading(false); }
  };

  const verify2FA = async () => {
    setSaving(true);
    try {
      await api.post('/user/verify-2fa', { token: twoFA.token });
      updateUser({ twoFactorEnabled: true });
      setTwoFA({ secret: '', qrCode: '', token: '', step: 'idle' });
      toast.success('2FA enabled successfully!');
    } catch { toast.error('Invalid code. Try again.'); }
    finally { setSaving(false); }
  };

  const disable2FA = async () => {
    if (!window.confirm('Disable Two-Factor Authentication?')) return;
    try {
      await api.post('/user/disable-2fa');
      updateUser({ twoFactorEnabled: false });
      toast.success('2FA disabled.');
    } catch { toast.error('Failed to disable 2FA.'); }
  };

  // ── Sessions ──
  const terminateSession = async (id) => {
    try {
      const { data } = await api.delete(`/user/sessions/${id}`);
      if (data.isCurrentSession) {
        toast.success('Current session terminated. Logging out...');
        logout();
      } else {
        setSessions(p => p.filter(s => s.id !== id));
        toast.success('Session terminated.');
      }
    } catch { toast.error('Failed to terminate session.'); }
  };

  const logoutCurrentSession = async () => {
    try {
      await logout(); // destroys cookie + session, redirects to /
    } catch {
      toast.error('Logout failed.');
    }
  };

  // Storage stats
  const usedBytes  = user?.storageUsed  || 0;
  const limitBytes = user?.storageLimit || 52428800;
  const usedPct    = Math.min(100, (usedBytes / limitBytes) * 100);

  const tabs = [
    { id: 'profile',  label: 'Profile'   },
    { id: 'security', label: 'Security'  },
    { id: 'twofa',    label: '2FA Setup' },
    { id: 'sessions', label: 'Sessions'  },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* User Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-3xl font-bold shadow-brand flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-100">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${user?.role === 'admin' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-brand-500/10 border-brand-500/30 text-brand-400'}`}>
                {user?.role?.toUpperCase()}
              </span>
              {user?.verified && <span className="text-xs px-2.5 py-1 rounded-full bg-success/10 border border-success/30 text-success">Verified</span>}
              {user?.twoFactorEnabled && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center gap-1"><Shield className="w-3 h-3" />2FA</span>}
              {user?.plan?.name && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center gap-1">
                  <Crown className="w-3 h-3" />{user.plan.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <button onClick={() => navigate('/upgrade')}
              className="btn-primary text-sm flex items-center gap-1.5 py-2 px-4">
              <Zap className="w-3.5 h-3.5" /> Upgrade Plan
            </button>
          </div>
        </div>

        {/* Storage Bar */}
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Storage</span>
            <span className={`font-medium ${usedPct > 90 ? 'text-danger' : usedPct > 70 ? 'text-warning' : 'text-slate-300'}`}>
              {fmtStorage(usedBytes)} / {fmtStorage(limitBytes)}
            </span>
          </div>
          <div className="progress-track h-2">
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${usedPct}%` }} transition={{ duration: 1, delay: 0.3 }}
              className={`h-full rounded-full ${usedPct > 90 ? 'bg-danger' : usedPct > 70 ? 'bg-warning' : 'progress-fill'}`}
            />
          </div>
          {usedPct > 90 && (
            <p className="text-danger text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Storage almost full. <button onClick={() => navigate('/upgrade')} className="underline">Upgrade now</button>
            </p>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === t.id ? 'bg-brand-gradient text-white shadow-brand' : 'text-slate-400 hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-semibold text-slate-200">Personal Information</h3>

              {/* Name */}
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="input-field pl-11" placeholder="Your name" />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={user?.email} disabled className="input-field pl-11 opacity-50 cursor-not-allowed" />
                </div>
                <p className="text-slate-600 text-xs mt-1">Email cannot be changed.</p>
              </div>

              {/* DOB */}
              <div>
                <label className="form-label">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="date" value={profile.dob}
                    onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
                    className="input-field pl-11" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="tel" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="input-field pl-11" placeholder="+91 98765 43210" />
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}

          {/* Security Tab */}
          {tab === 'security' && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-semibold text-slate-200">Change Password</h3>
              {['currentPassword', 'newPassword', 'confirm'].map((field) => (
                <div key={field}>
                  <label className="form-label">
                    {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPass[field] ? 'text' : 'password'}
                      value={passwords[field]}
                      onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                      className="input-field pl-11 pr-11" placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPass[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          )}

          {/* 2FA Tab */}
          {tab === 'twofa' && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="font-semibold text-slate-200">Two-Factor Authentication</h3>
              {user?.twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-slate-200 font-medium text-sm">2FA is Active</p>
                      <p className="text-slate-400 text-xs">Your account is protected with TOTP authentication.</p>
                    </div>
                  </div>
                  <button onClick={disable2FA} className="flex items-center gap-2 text-danger hover:text-danger/80 text-sm font-medium transition-colors">
                    <Shield className="w-4 h-4" /> Disable 2FA
                  </button>
                </div>
              ) : twoFA.step === 'idle' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <p className="text-slate-300 text-sm">2FA is not enabled. Enable it to add an extra layer of security.</p>
                  </div>
                  <button onClick={start2FA} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? <LoadingSpinner size="sm" /> : <Shield className="w-4 h-4" />}
                    Enable 2FA
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-slate-300 text-sm">Scan this QR code with <strong>Google Authenticator</strong> or <strong>Authy</strong>.</p>
                  {twoFA.qrCode && (
                    <div className="flex justify-center">
                      <img src={twoFA.qrCode} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-white/10" />
                    </div>
                  )}
                  <div className="p-3 bg-white/5 rounded-xl text-center">
                    <p className="text-xs text-slate-500 mb-1">Manual key</p>
                    <code className="text-brand-400 text-sm font-mono tracking-widest">{twoFA.secret}</code>
                  </div>
                  <div>
                    <label className="form-label">Enter 6-digit TOTP Code to Verify</label>
                    <input value={twoFA.token} onChange={e => setTwoFA(p => ({ ...p, token: e.target.value }))}
                      className="input-field text-center tracking-widest text-lg" placeholder="000 000" maxLength={6} />
                  </div>
                  <button onClick={verify2FA} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                    {saving ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
                    Confirm & Activate 2FA
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">Active Sessions ({sessions.length})</h3>
                <button onClick={logoutCurrentSession}
                  className="flex items-center gap-2 text-sm text-danger hover:text-danger/80 border border-danger/30 hover:border-danger/50 px-3 py-1.5 rounded-xl transition-all">
                  <LogOut className="w-3.5 h-3.5" /> Logout Current Session
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No active sessions found.</p>
              ) : (
                sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-200">{s.deviceInfo}</p>
                        <p className="text-xs text-slate-500">{s.browser} · {s.os} · {s.ipAddress}</p>
                        <p className="text-xs text-slate-600">Active {formatDistanceToNow(new Date(s.lastActive), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <button onClick={() => terminateSession(s.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-danger/10 hover:bg-danger/20 text-danger transition-colors border border-danger/20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
