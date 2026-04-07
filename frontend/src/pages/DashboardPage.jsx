import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  HardDrive, Shield, Clock, AlertTriangle, Monitor,
  Download, Upload, FileText, Wifi
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import RiskBadge from '../components/ui/RiskBadge';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { formatDistanceToNow, format } from 'date-fns';

const StorageBar = ({ used, limit }) => {
  const pct = Math.min((used / limit) * 100, 100);
  const fmt = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(0)} MB`;
  const color = pct > 90 ? 'bg-danger' : pct > 70 ? 'bg-warning' : 'bg-brand-gradient';
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>{fmt(used)} used</span>
        <span>{fmt(limit)} total</span>
      </div>
      <div className="progress-track">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{pct.toFixed(1)}% used</p>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, filesRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/files?limit=5'),
        ]);
        setData({ ...profileRes.data, files: filesRes.data.files });
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" text="Loading dashboard…" /></div>;

  const { loginHistory = [], activeSessions = [], files = [] } = data || {};

  const riskCounts = loginHistory.reduce((a, l) => {
    a[l.riskLevel] = (a[l.riskLevel] || 0) + 1; return a;
  }, {});

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-brand-600/20 to-violet-600/10 border-brand-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-100">
            Good morning, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">Your vault is secure. Last login: {user?.lastLoginAt ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true }) : 'N/A'}</p>
        </div>
        <RiskBadge level={user?.lastLoginRisk || 'low'} />
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield}       label="Login Risk"      value={(user?.lastLoginRisk || 'Low').toUpperCase()} color={user?.lastLoginRisk === 'high' ? 'danger' : user?.lastLoginRisk === 'medium' ? 'warning' : 'success'} />
        <StatCard icon={Monitor}      label="Active Sessions" value={activeSessions.length}                        color="brand" />
        <StatCard icon={FileText}     label="Stored Files"    value={data?.files?.length ?? 0}                    color="info" />
        <StatCard icon={HardDrive}    label="Storage Used"    value={`${((user?.storageUsed||0)/1e6).toFixed(0)} MB`} color="brand" />
      </div>

      {/* Storage + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage */}
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-400" /> Storage Usage
          </h3>
          <StorageBar used={user?.storageUsed || 0} limit={user?.storageLimit || 104857600} />
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500">Plan: <span className="text-slate-300 capitalize">{user?.storageLimit >= 1e10 ? 'Premium' : user?.storageLimit >= 1e9 ? 'Pro' : 'Free'}</span></p>
          </div>
        </div>

        {/* Risk History */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Recent Login History
          </h3>
          <div className="space-y-3">
            {loginHistory.slice(0, 5).map((l, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-200">{l.device} · {l.browser}</p>
                    <p className="text-xs text-slate-500">{l.ipAddress} · {format(new Date(l.loginTime), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <RiskBadge level={l.riskLevel} />
              </div>
            ))}
            {loginHistory.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No login history yet.</p>}
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-brand-400" /> Active Sessions ({activeSessions.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeSessions.map((s, i) => (
            <div key={s.id || i} className="bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Monitor className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{s.deviceInfo}</p>
                  <p className="text-xs text-slate-500">{s.browser} · {s.os}</p>
                  <p className="text-xs text-slate-600 mt-1">{s.ipAddress}</p>
                  <p className="text-xs text-slate-600">Active {formatDistanceToNow(new Date(s.lastActive), { addSuffix: true })}</p>
                </div>
              </div>
            </div>
          ))}
          {activeSessions.length === 0 && <p className="text-slate-500 text-sm">No active sessions found.</p>}
        </div>
      </div>

      {/* Security Alerts */}
      {user?.lastLoginRisk !== 'low' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className={`glass-card p-5 border ${user.lastLoginRisk === 'high' ? 'border-danger/30 bg-danger/5' : 'border-warning/30 bg-warning/5'}`}>
          <div className="flex items-start gap-4">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${user.lastLoginRisk === 'high' ? 'text-danger' : 'text-warning'}`} />
            <div>
              <p className="font-semibold text-slate-200">Security Alert</p>
              <p className="text-sm text-slate-400 mt-1">
                Your last login was flagged as <strong>{user.lastLoginRisk}</strong> risk.
                {user.lastLoginRisk === 'high' ? ' Consider changing your password and reviewing active sessions.' : ' Check your login history for any unfamiliar activity.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DashboardPage;
