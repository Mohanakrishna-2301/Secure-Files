import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Shield, HardDrive, MapPin, Monitor, Globe, Clock, ChevronLeft, Flag, Ban } from 'lucide-react';
import api from '../../api/axios';
import RiskBadge from '../../components/ui/RiskBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const fmtSize = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(0)} MB`;

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      setData(response.data);
    } catch {
      toast.error('Failed to load user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const toggleBlock = async () => {
    try {
      const res = await api.post(`/admin/block-user/${id}`);
      setData(prev => ({ ...prev, user: { ...prev.user, isBlocked: res.data.isBlocked } }));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to toggle block'); }
  };

  const toggleFlag = async () => {
    try {
      const res = await api.post(`/admin/flag-user/${id}`);
      setData(prev => ({ ...prev, user: { ...prev.user, flagged: res.data.flagged } }));
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to toggle flag'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" text="Loading user details…" /></div>;
  if (!data) return null;

  const { user, loginHistory } = data;
  const storagePct = Math.min((user.storageUsed / user.storageLimit) * 100, 100);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* User Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-brand">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {user.name}
              {user.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning font-medium">Admin</span>}
              {user.isBlocked && <span className="text-xs px-2 py-0.5 rounded border border-danger/30 bg-danger/10 text-danger font-medium flex items-center gap-1"><Ban className="w-3 h-3"/> Blocked</span>}
              {user.flagged && <span className="text-xs px-2 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning font-medium flex items-center gap-1"><Flag className="w-3 h-3"/> Flagged</span>}
            </h2>
            <p className="text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-500 mt-1">Joined {format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
          </div>
        </div>

        {user.role !== 'admin' && (
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={toggleFlag} className={`flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 ${user.flagged ? 'text-warning border-warning/50' : ''}`}>
              <Flag className="w-4 h-4" /> {user.flagged ? 'Unflag User' : 'Flag User'}
            </button>
            <button onClick={toggleBlock} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-colors font-semibold ${user.isBlocked ? 'bg-white/10 text-slate-200 hover:bg-white/20' : 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20'}`}>
              <Ban className="w-4 h-4" /> {user.isBlocked ? 'Unblock User' : 'Block User'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage & Security Specs */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><HardDrive className="w-4 h-4 text-info" /> Storage Usage</h3>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Used</span>
              <span className="text-slate-200 font-medium">{fmtSize(user.storageUsed)} of {fmtSize(user.storageLimit)}</span>
            </div>
            <div className="progress-track h-2 mb-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${storagePct}%` }} className={`h-full rounded-full ${storagePct > 90 ? 'bg-danger' : 'bg-info'}`} />
            </div>
            <p className="text-xs text-slate-500 text-right">{storagePct.toFixed(1)}% full</p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-success" /> Security Settings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Email Verification</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.verified ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{user.verified ? 'Verified' : 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-slate-400">Two Factor Auth</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.twoFactorEnabled ? 'bg-success/10 text-success' : 'bg-slate-500/10 text-slate-400'}`}>{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-400">Known Devices</span>
                <span className="text-sm text-slate-200 font-medium">{user.knownDevices?.length || 0} saved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Login History */}
        <div className="glass-card p-0 lg:col-span-2 flex flex-col h-[500px]">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Clock className="w-4 h-4 text-brand-400" /> Recent Login History</h3>
          </div>
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full">
              <thead className="sticky top-0 bg-dark-200/90 backdrop-blur z-10">
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-semibold text-slate-500 tracking-wider px-6 py-3">Location & IP</th>
                  <th className="text-left text-xs font-semibold text-slate-500 tracking-wider px-4 py-3">Device</th>
                  <th className="text-left text-xs font-semibold text-slate-500 tracking-wider px-4 py-3">Time</th>
                  <th className="text-left text-xs font-semibold text-slate-500 tracking-wider px-6 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((log, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300"><MapPin className="w-3 h-3 text-slate-500" /> {log.location}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1"><Globe className="w-3 h-3" /> {log.ipAddress}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300"><Monitor className="w-3 h-3 text-slate-500" /> {log.device}</div>
                      <div className="text-xs text-slate-500 mt-1">{log.browser} on {log.os}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-300">{format(new Date(log.loginTime), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-slate-500 mt-1">{format(new Date(log.loginTime), 'h:mm:ss a')}</div>
                    </td>
                    <td className="px-6 py-3">
                      <RiskBadge level={log.riskLevel} />
                    </td>
                  </tr>
                ))}
                {loginHistory.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-10 text-slate-500">No login history available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;
