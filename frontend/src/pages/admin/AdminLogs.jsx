import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Download, ChevronLeft, ChevronRight, Activity, ShieldAlert, Monitor, User, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [riskTrend, setRiskTrend] = useState([]);
  
  const [filterAction, setFilterAction] = useState('');
  const LIMIT = 20;

  const loadData = async () => {
    setLoading(true);
    try {
      // Parallel fetch for logs and risk trends
      const [logsRes, riskRes] = await Promise.all([
        api.get(`/admin/activity-logs?page=${page}&limit=${LIMIT}${filterAction ? `&action=${filterAction}` : ''}`),
        api.get('/admin/risk-logs?limit=1')
      ]);

      setLogs(logsRes.data.logs);
      setTotal(logsRes.data.pagination.total);
      
      // Transform risk trend data for BarChart
      if (riskRes.data.trendData) {
        const grouped = riskRes.data.trendData.reduce((acc, curr) => {
          const date = curr._id.date;
          if (!acc[date]) acc[date] = { date, low: 0, medium: 0, high: 0 };
          acc[date][curr._id.risk] = curr.count;
          return acc;
        }, {});
        setRiskTrend(Object.values(grouped).slice(-7));
      }
    } catch (err) {
      console.error('Failed to load audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [page, filterAction]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Date', 'Action', 'User', 'IP', 'Details'];
    const rows = logs.map(log => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.userId?.name || 'System',
      log.ip || 'N/A',
      JSON.stringify(log.meta || {}).replace(/,/g, ';') // evade CSV comma breaks
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `secure_files_audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getLogIcon = (action) => {
    if (action.includes('ADMIN')) return <ShieldAlert className="w-4 h-4 text-warning" />;
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Monitor className="w-4 h-4 text-info" />;
    if (action.includes('FILE_DELETE') || action.includes('DELETE')) return <Trash2 className="w-4 h-4 text-danger" />;
    if (action.includes('USER') || action.includes('PROFILE')) return <User className="w-4 h-4 text-brand-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const getLogColor = (action) => {
    if (action.includes('ADMIN')) return 'bg-warning/10 text-warning border-warning/20';
    if (action.includes('FILE_DELETE') || action.includes('FAILED')) return 'bg-danger/10 text-danger border-danger/20';
    if (action.includes('LOGIN')) return 'bg-info/10 text-info border-info/20';
    return 'bg-white/5 text-slate-300 border-white/10';
  };

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGIN_FAILED', label: 'Login Failed' },
    { value: 'FILE_UPLOAD', label: 'File Upload' },
    { value: 'FILE_DELETE', label: 'File Delete' },
    { value: 'ADMIN_BLOCK_USER', label: 'Admin Blocked User' },
    { value: 'ADMIN_UPDATE_STORAGE', label: 'Admin Storage Update' },
    { value: 'ADMIN_DELETE_USER', label: 'Admin Deleted User' },
    { value: 'ADMIN_CREATE_USER', label: 'Admin Created User' }
  ];

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2"><FileText className="w-6 h-6 text-warning" /> System Audit Logs</h2>
          <p className="text-slate-400 text-sm mt-1">{total} recorded activities</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1); }} className="input-field py-2 px-3 text-sm min-w-[160px]">
             {actionTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 py-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
           <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-warning" /> System Risk Trends (Last 7 Days)</h3>
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={riskTrend}>
                 <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(d) => format(new Date(d), 'MMM dd')} />
                 <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                 <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                 <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={30} />
                 <Bar dataKey="medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={30} />
                 <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-center">
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Latest Audit Event</h4>
            <div className="text-2xl font-bold text-slate-100 truncate">
               {logs.length > 0 ? (logs[0].action?.replace(/_/g, ' ') || 'N/A') : 'No logs'}
            </div>
            <p className="text-xs text-warning mt-2 flex items-center gap-1"><Monitor className="w-3 h-3" /> Real-time activity monitoring enabled</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden flex flex-col min-h-[600px]">
        {loading ? (
           <div className="flex-1 flex items-center justify-center"><LoadingSpinner size="md" /></div>
        ) : (
          <>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Timestamp</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Action</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Details / Meta</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-slate-300">{format(new Date(log.createdAt), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-slate-500">{format(new Date(log.createdAt), 'h:mm:ss a')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getLogColor(log.action)}`}>
                          {getLogIcon(log.action)} {log.action.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {log.userId ? (
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded bg-brand-gradient flex items-center justify-center text-white text-[10px] font-bold">
                               {log.userId.name?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <p className="text-sm text-slate-200">{log.userId.name}</p>
                               <p className="text-[10px] text-slate-500">{log.userId.email}</p>
                             </div>
                           </div>
                        ) : (
                           <span className="text-sm text-slate-500 italic">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                         <div className="text-xs text-slate-400 font-mono bg-dark-200 p-1.5 rounded max-w-[280px] truncate" title={JSON.stringify(log.meta)}>
                           {Object.keys(log.meta || {}).length > 0 ? JSON.stringify(log.meta) : 'None'}
                         </div>
                         {log.performedBy && <p className="text-[10px] text-warning mt-1">Admin ID: {log.performedBy._id}</p>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-slate-500 whitespace-nowrap">
                        {log.ip}
                      </td>
                    </motion.tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-500">No activity logs found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
