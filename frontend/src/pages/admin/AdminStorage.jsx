import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Server, RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const fmtSize = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(0)} MB`;

const AdminStorage = () => {
  const [data, setData]       = useState({ users: [], overview: { totalUsed: 0, totalAllocated: 0 }, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [storageModal, setStorageModal] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const { data: resData } = await api.get(`/admin/storage?page=${page}&limit=${LIMIT}`);
      setData(resData);
    } catch {
      toast.error('Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  const handleUpdateStorage = async () => {
    const bytes = parseFloat(newLimit) * 1024 * 1024;
    if (!bytes || bytes <= 0) return toast.error('Enter a valid MB value.');
    try {
      await api.put('/admin/storage-limit', { userId: storageModal._id, storageLimit: bytes });
      toast.success(`Storage limit updated to ${newLimit} MB.`);
      setStorageModal(null);
      setNewLimit('');
      load();
    } catch { toast.error('Update failed.'); }
  };

  // Group top users by storage used for the bar chart
  const topUsersForChart = [...data.users]
    .sort((a, b) => b.storageUsed - a.storageUsed)
    .slice(0, 5)
    .map(u => ({
      name: u.name,
      usedMB: parseFloat((u.storageUsed / 1024 / 1024).toFixed(1)),
      limitMB: parseFloat((u.storageLimit / 1024 / 1024).toFixed(1))
    }));

  const pages = data.pagination?.pages || 1;
  const total = data.pagination?.total || 0;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-info/20 to-brand-500/10 border-info/20">
        <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-info" /> Storage Management
        </h2>
        <p className="text-slate-400 text-sm mt-1">Monitor and manage user space allocation across the platform.</p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={Server} label="Total Storage Used" value={fmtSize(data.overview.totalUsed)} color="info" />
        <StatCard icon={HardDrive} label="Total Allocated Limit" value={fmtSize(data.overview.totalAllocated)} color="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Consumers Chart */}
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 w-full text-center">Top 5 Storage Consumers</h3>
          <div className="h-64">
            {topUsersForChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersForChart} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }} />
                  <Bar dataKey="usedMB" name="Used (MB)" radius={[0, 4, 4, 0]}>
                    {topUsersForChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.usedMB > entry.limitMB * 0.9 ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-500">Not enough data</div>
            )}
          </div>
        </div>

        {/* User Storage Table */}
        <div className="glass-card overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">All Users Allocation</h3>
            <button onClick={load} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
             <div className="flex-1 flex items-center justify-center py-10"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Plan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Usage</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u, i) => {
                    const pct = Math.min((u.storageUsed / u.storageLimit) * 100, 100);
                    return (
                      <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-200 font-medium">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan?.name === 'Premium' ? 'bg-brand-500/20 text-brand-400' : u.plan?.name === 'Pro' ? 'bg-success/20 text-success' : 'bg-white/10 text-slate-300'}`}>
                            {u.plan?.name || 'Free'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                             <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                               <div className={`h-full rounded-full ${pct > 90 ? 'bg-danger' : 'bg-info'}`} style={{ width: `${pct}%` }} />
                             </div>
                             <span className="text-xs text-slate-400 w-12">{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setStorageModal(u)} className="text-sm font-medium text-brand-400 hover:text-brand-300 underline decoration-brand-400/30 underline-offset-4">
                            {fmtSize(u.storageLimit)}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {data.users.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-6 text-slate-500 text-sm">No storage data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.02]">
              <p className="text-xs text-slate-500">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, total)} of {total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-300">{page} / {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p+1))} disabled={page === pages} className="w-7 h-7 flex items-center justify-center rounded bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

       {/* Storage Update Modal */}
       <AnimatePresence>
        {storageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card p-6 max-w-sm w-full relative">
              <button onClick={() => setStorageModal(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X className="w-5 h-5"/></button>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Update Limit</h3>
              <p className="text-slate-400 text-sm mb-4">Set storage capacity for <strong className="text-slate-200">{storageModal.name}</strong></p>
              
              <div className="p-3 bg-dark-200 rounded-lg mb-4 text-sm flex justify-between items-center">
                <span className="text-slate-500">Current Limit:</span>
                <span className="text-slate-200 font-medium">{fmtSize(storageModal.storageLimit)}</span>
              </div>

              <div className="relative mb-6">
                <input value={newLimit} onChange={(e) => setNewLimit(e.target.value)} type="number" min="1"
                  className="input-field pr-14" placeholder="Enter new limit (e.g. 500)" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">MB</span>
              </div>
              <button onClick={handleUpdateStorage} className="btn-primary w-full">Save Changes</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStorage;
