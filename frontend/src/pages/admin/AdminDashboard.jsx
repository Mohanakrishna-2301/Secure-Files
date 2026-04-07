import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  HardDrive, 
  TrendingUp, 
  UserPlus, 
  Shield 
} from 'lucide-react';
import { 
  AreaChart, Area, 
  BarChart, Bar,
  LineChart, Line, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import RiskBadge from '../../components/ui/RiskBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

const fmtSize = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(0)} MB`;

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard-stats')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" text="Loading admin data…" /></div>;
  if (!data) return <div className="text-center text-slate-500 py-10">Failed to load dashboard data.</div>;

  const { stats, loginTrend, newUsersTrend, riskDistribution, highRiskAlerts } = data;

  const pieData = [
    { name: 'Low', value: riskDistribution.low || 0, color: '#22c55e' },
    { name: 'Medium', value: riskDistribution.medium || 0, color: '#f59e0b' },
    { name: 'High', value: riskDistribution.high || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-brand-600/20 to-violet-600/10 border-brand-500/20">
        <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" /> Admin Control Center
        </h2>
        <p className="text-slate-400 text-sm mt-1">Real-time platform overview and security monitoring.</p>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Users"       value={stats.totalUsers}         color="brand" />
        <StatCard icon={Activity}      label="Active (24h)"      value={stats.activeUsers}        color="success" />
        <StatCard icon={AlertTriangle} label="High-Risk Today"   value={stats.highRiskLogins}     color="danger" />
        <StatCard icon={HardDrive}     label="Storage Used"      value={fmtSize(stats.totalStorageUsed)} color="info" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" /> Login Activity (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loginTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#818cf8' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Overall Risk Distribution</h3>
          <div className="h-64 flex flex-col items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">No risk data today.</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-200">{Object.values(riskDistribution).reduce((a,b)=>a+b,0)}</span>
              <span className="text-xs text-slate-500">Logins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2"><UserPlus className="w-4 h-4 text-success" /> New Users (Last 14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newUsersTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-sm font-semibold text-danger mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-danger" /> Urgent Alerts</h3>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {highRiskAlerts.length > 0 ? highRiskAlerts.map((alert, i) => (
              <div key={i} className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200 truncate">{alert.userId?.name || 'Unknown'}</span>
                  <span className="text-xs text-danger font-semibold flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> High Risk</span>
                </div>
                <p className="text-xs text-slate-400">IP: {alert.ipAddress} | {alert.location}</p>
                <p className="text-xs text-slate-500 mt-1">{format(new Date(alert.loginTime), 'MMM d, h:mm a')}</p>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
                <Shield className="w-12 h-12 mb-2 text-success/50" />
                <p className="text-sm">No high-risk activity detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
