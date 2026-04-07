import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Filter, RefreshCw, Wifi, Ban, Flag, Bell, TrendingUp } from 'lucide-react';
import api from '../../api/axios';
import RiskBadge from '../../components/ui/RiskBadge';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const AdminRiskMonitor = () => {
  const [logs, setLogs]         = useState([]);
  const [stats, setStats]       = useState({});
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [page, setPage]         = useState(1);
  const [actionLoading, setActionLoading] = useState(null); // store user id being acted upon

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/risk-logs?page=${page}&limit=20${filter ? `&riskLevel=${filter}` : ''}`);
      setLogs(data.logs);
      setStats(data.stats || {});
      setTrendData(data.trendData || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, filter]);

  const filters = [
    { label: 'All',    value: '' },
    { label: '🟢 Low',    value: 'low' },
    { label: '🟡 Medium', value: 'medium' },
    { label: '🔴 High',   value: 'high' },
  ];

  const handleAction = async (actionType, userId) => {
    setActionLoading(userId);
    try {
      if (actionType === 'block') {
        const res = await api.post(`/admin/block-user/${userId}`);
        toast.success(res.data.message);
      } else if (actionType === 'flag') {
        const res = await api.post(`/admin/flag-user/${userId}`);
        toast.success(res.data.message);
      }
      // Reload logs to get updated user states
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionType} user`);
    } finally {
      setActionLoading(null);
    }
  };

  // Process trend data for AreaChart (grouping high risk specifically or total over time)
  // trendData from api is `[ { _id: { date, risk }, count } ]`
  const processTrendData = () => {
    const dates = [...new Set(trendData.map(d => d._id.date))].sort();
    return dates.map(date => {
      const dayData = trendData.filter(d => d._id.date === date);
      return {
        date,
        low: dayData.find(d => d._id.risk === 'low')?.count || 0,
        medium: dayData.find(d => d._id.risk === 'medium')?.count || 0,
        high: dayData.find(d => d._id.risk === 'high')?.count || 0,
      };
    });
  };

  const chartData = processTrendData();

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-danger/10 to-warning/10 border-danger/20">
        <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning" /> Login Risk Monitor
        </h2>
        <p className="text-slate-400 text-sm mt-1">Real-time login security analysis and advanced threat mitigation.</p>
      </motion.div>

      {/* Top Section: Trend Chart + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" /> Risk Trends (7 Days)</h3>
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem' }} />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#ef4444" fill="url(#colorHigh)" />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#f59e0b" fill="url(#colorMedium)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <StatCard icon={Shield}        label="Low Risk Logins"    value={stats.low    || 0} color="success" />
          <StatCard icon={AlertTriangle} label="Medium Risk Logins" value={stats.medium || 0} color="warning" />
          <StatCard icon={AlertTriangle} label="High Risk Logins"   value={stats.high   || 0} color="danger" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-slate-400 text-sm"><Filter className="w-4 h-4" /> Filter:</div>
        {filters.map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${filter === f.value ? 'bg-brand-gradient text-white shadow-brand' : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'}`}>
            {f.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" text="Loading risk logs…" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'IP & Location', 'Device', 'Time', 'Risk', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr
                    key={log._id || i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors
                      ${log.riskLevel === 'high' ? 'bg-danger/5' : log.riskLevel === 'medium' ? 'bg-warning/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {log.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm text-slate-200 font-medium flex items-center gap-2">
                            {log.userId?.name || 'Unknown'}
                            {log.userId?.isBlocked && <Ban className="w-3 h-3 text-danger" title="Blocked" />}
                            {log.userId?.flagged && <Flag className="w-3 h-3 text-warning" title="Flagged" />}
                          </p>
                          <p className="text-xs text-slate-500">{log.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-slate-500" /><span className="text-sm text-slate-300 font-mono">{log.ipAddress}</span></div>
                      <p className="text-xs text-slate-500 mt-0.5 ml-5">{log.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-300">{log.device}</p>
                      <p className="text-xs text-slate-500">{log.browser} · {log.os}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-300">{format(new Date(log.loginTime), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-slate-500">{format(new Date(log.loginTime), 'h:mm:ss a')}</p>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={log.riskLevel} /></td>
                    <td className="px-4 py-3">
                      {log.userId && (
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={actionLoading === log.userId._id}
                            onClick={() => handleAction('flag', log.userId._id)}
                            title={log.userId.flagged ? "Unflag User" : "Flag Suspicious"}
                            className={`w-7 h-7 flex items-center justify-center rounded bg-warning/10 border ${log.userId.flagged ? 'border-warning text-warning' : 'border-warning/20 text-warning hover:bg-warning/20'} transition-colors disabled:opacity-50`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            disabled={actionLoading === log.userId._id}
                            onClick={() => handleAction('block', log.userId._id)}
                            title={log.userId.isBlocked ? "Unblock User" : "Block User"}
                            className={`w-7 h-7 flex items-center justify-center rounded bg-danger/10 border ${log.userId.isBlocked ? 'border-danger text-danger' : 'border-danger/20 text-danger hover:bg-danger/20'} transition-colors disabled:opacity-50`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            title="Send Warning Email - Coming Soon"
                            className="w-7 h-7 flex items-center justify-center rounded bg-info/10 text-info border border-info/20 hover:bg-info/20 transition-colors opacity-50 cursor-not-allowed"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-500">No logs found with this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRiskMonitor;
