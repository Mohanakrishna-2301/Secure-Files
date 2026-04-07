import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Trash2, ShieldCheck, HardDrive, Users, X,
  CheckCircle, AlertCircle, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import RiskBadge from '../../components/ui/RiskBadge';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const fmtSize = (b) => b > 1e9 ? `${(b/1e9).toFixed(1)} GB` : `${(b/1e6).toFixed(0)} MB`;

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('user');
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [storageModal, setStorageModal] = useState(null);
  const [createModal, setCreateModal]   = useState(false);
  const [newLimit, setNewLimit] = useState('');
  const [newUser, setNewUser]   = useState({ name: '', email: '', password: '', role: 'user', storageLimit: 50 });
  const LIMIT = 10;

  const load = async () => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${page}&limit=${LIMIT}&search=${search}&role=${roleFilter}`;
      if (riskFilter) url += `&riskLevel=${riskFilter}`;
      const { data } = await api.get(url);
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search, roleFilter, riskFilter]);

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/user/${deleteTarget._id}`);
      toast.success(`${deleteTarget.name} deleted.`);
      setDeleteTarget(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed.'); }
  };

  const handlePromote = async (user) => {
    if (!window.confirm(`Promote ${user.name} to admin?`)) return;
    try {
      await api.put(`/admin/promote/${user._id}`);
      toast.success(`${user.name} promoted to admin.`);
      load();
    } catch { toast.error('Promotion failed.'); }
  };

  const handleUpdateStorage = async () => {
    const bytes = parseFloat(newLimit) * 1024 * 1024;
    if (!bytes || bytes <= 0) return toast.error('Enter a valid MB value.');
    try {
      await api.put('/admin/storage-limit', { userId: storageModal._id, storageLimit: bytes });
      toast.success(`Storage updated to ${newLimit} MB.`);
      setStorageModal(null);
      setNewLimit('');
      load();
    } catch { toast.error('Update failed.'); }
  };
  
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-user', newUser);
      toast.success('User created successfully!');
      setCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'user', storageLimit: 50 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title flex items-center gap-2"><Users className="w-6 h-6 text-brand-400" /> User Management</h2>
          <p className="text-slate-400 text-sm mt-1">{total} registered users</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button onClick={() => setCreateModal(true)} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2 whitespace-nowrap">
            <Users className="w-4 h-4" /> Create User
          </button>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input-field py-1.5 px-3 max-w-[120px]">
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }} className="input-field py-1.5 px-3 max-w-[140px]">
            <option value="">All Risks</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9 w-64" placeholder="Search users…" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><LoadingSpinner size="lg" text="Loading users…" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['User', 'Email', 'Role', 'Verified', roleFilter !== 'admin' ? 'Storage' : null, 'Last Login', 'Risk Status', 'Actions'].filter(Boolean).map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-200 font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-warning/10 text-warning border border-warning/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.verified
                        ? <CheckCircle className="w-4 h-4 text-success" />
                        : <AlertCircle className="w-4 h-4 text-danger" />}
                    </td>
                    {roleFilter !== 'admin' && (
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs text-slate-300">{fmtSize(u.storageUsed)} / {fmtSize(u.storageLimit)}</p>
                          <div className="w-20 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-brand-gradient rounded-full" style={{ width: `${Math.min((u.storageUsed/u.storageLimit)*100, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-slate-500">{u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy h:mm a') : 'Never'}</td>
                    <td className="px-4 py-3"><RiskBadge level={u.lastLoginRisk || 'low'} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/user/${u._id}`} title="View Details"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-info/10 hover:bg-info/20 text-info border border-info/20 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {u.role === 'user' && (
                          <button onClick={() => setStorageModal(u)} title="Edit Storage"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 transition-colors">
                            <HardDrive className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {u.role === 'user' && (
                          <button onClick={() => handlePromote(u)} title="Promote to Admin"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 transition-colors">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {u._id !== currentUser?._id && (
                          <button onClick={() => setDeleteTarget(u)} title="Delete User"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-xs text-slate-500">Showing {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, total)} of {total}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-300">{page} / {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p+1))} disabled={page === pages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card p-8 max-w-sm w-full text-center">
              <Trash2 className="w-12 h-12 text-danger mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Delete {deleteTarget.name}?</h3>
              <p className="text-slate-400 text-sm mb-6">This removes the user and ALL their files from Cloudinary permanently.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-danger/80 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Storage Modal */}
      <AnimatePresence>
        {storageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="glass-card p-8 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Update Storage Limit</h3>
              <p className="text-slate-400 text-sm mb-4">User: <strong className="text-slate-200">{storageModal.name}</strong></p>
              <p className="text-slate-500 text-xs mb-4">Current: {fmtSize(storageModal.storageLimit)}</p>
              <div className="relative mb-4">
                <input value={newLimit} onChange={(e) => setNewLimit(e.target.value)} type="number" min="1"
                  className="input-field pr-14" placeholder="e.g. 500" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">MB</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStorageModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleUpdateStorage} className="btn-primary flex-1">Update</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {createModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display font-bold text-slate-100">Create New Account</h3>
                <button onClick={() => setCreateModal(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="form-label">Full Name</label>
                  <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="input-field" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <input required minLength="8" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="input-field" placeholder="••••••••" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Account Role</label>
                    <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="input-field">
                      <option value="user">Standard User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {newUser.role !== 'admin' && (
                    <div>
                      <label className="form-label">Storage Limit (MB)</label>
                      <input type="number" min="1" value={newUser.storageLimit} onChange={e => setNewUser({...newUser, storageLimit: e.target.value})} className="input-field" />
                    </div>
                  )}
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Create User</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
