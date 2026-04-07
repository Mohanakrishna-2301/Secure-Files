import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Plus, Pencil, Trash2, CheckCircle, X,
  HardDrive, DollarSign, Star, Zap, Crown, Save, Shield
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const MB  = 1024 * 1024;
const GB  = 1024 * MB;

const fmtStorage = (bytes) => {
  if (bytes >= GB) return `${(bytes / GB).toFixed(0)} GB`;
  return `${(bytes / MB).toFixed(0)} MB`;
};

const EMPTY_FORM = {
  name: '',
  price: '',
  billingCycle: 'monthly',
  storageLimitBytes: '',
  storageUnit: 'MB',
  features: '',
  isPopular: false,
  isActive: true,
};

const AdminPlans = () => {
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'create' | 'edit'
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data.data || []);
    } catch { toast.error('Failed to load plans.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditPlan(null);
    setModal('create');
  };

  const openEdit = (plan) => {
    const bytes = plan.storageLimitBytes;
    const unit  = bytes >= GB ? 'GB' : 'MB';
    const value = bytes >= GB ? bytes / GB : bytes / MB;
    setForm({
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle || 'monthly',
      storageLimitBytes: plan.storageLimitBytes,
      storageUnit: unit,
      storageValue: value,
      features: (plan.features || []).join('\n'),
      isPopular: plan.isPopular || false,
      isActive: plan.isActive !== false,
    });
    setEditPlan(plan);
    setModal('edit');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const computeBytes = () => {
    const v = parseFloat(form.storageValue || form.storageLimitBytes);
    if (isNaN(v)) return 0;
    return form.storageUnit === 'GB' ? v * GB : v * MB;
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Plan name is required.');
    if (form.price === '' || isNaN(Number(form.price))) return toast.error('Valid price is required.');
    const bytes = computeBytes();
    if (!bytes) return toast.error('Valid storage limit is required.');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      billingCycle: form.billingCycle,
      storageLimitBytes: bytes,
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
      isPopular: form.isPopular,
      isActive: form.isActive,
    };

    try {
      if (modal === 'create') {
        const { data } = await api.post('/plans', payload);
        setPlans(p => [...p, data.data]);
        toast.success('Plan created!');
      } else {
        const { data } = await api.put(`/plans/${editPlan._id}`, payload);
        setPlans(p => p.map(pl => pl._id === editPlan._id ? data.data : pl));
        toast.success('Plan updated!');
      }
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/plans/${deleteId}`);
      setPlans(p => p.filter(pl => pl._id !== deleteId));
      toast.success('Plan deactivated.');
    } catch { toast.error('Delete failed.'); }
    finally { setDeleteId(null); }
  };

  const planIcon = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('free') || n.includes('basic')) return <Star className="w-5 h-5 text-slate-400" />;
    if (n.includes('pro'))     return <Zap className="w-5 h-5 text-brand-400" />;
    if (n.includes('premium') || n.includes('enterprise')) return <Crown className="w-5 h-5 text-yellow-400" />;
    return <Shield className="w-5 h-5 text-violet-400" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-r from-brand-600/20 to-violet-600/10 border-brand-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" /> Plan Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">Create and manage pricing plans stored in the database.</p>
        </div>
        <button onClick={openCreate}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Plan
        </button>
      </motion.div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" text="Loading plans…" /></div>
      ) : plans.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No plans yet</p>
          <p className="text-slate-600 text-sm">Click "New Plan" to create your first pricing plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {plans.map((plan, i) => (
              <motion.div key={plan._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-6 relative border-2 transition-all ${plan.isPopular ? 'border-brand-500/50' : 'border-white/5'} ${!plan.isActive ? 'opacity-50' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-gradient rounded-full text-white text-xs font-bold shadow-brand">
                    ✦ Popular
                  </div>
                )}
                {!plan.isActive && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-danger/20 border border-danger/30 rounded-full text-danger text-xs">
                    Inactive
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {planIcon(plan.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{plan.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{plan.billingCycle}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black gradient-text">${plan.price}</span>
                  <span className="text-slate-500 text-sm">/mo</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
                  <HardDrive className="w-4 h-4 text-brand-400" />
                  {fmtStorage(plan.storageLimitBytes)} storage
                </div>

                {plan.features?.length > 0 && (
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.slice(0, 4).map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-slate-400">
                        <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />{f}
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-slate-600">+{plan.features.length - 4} more…</li>
                    )}
                  </ul>
                )}

                <div className="flex gap-2">
                  <button onClick={() => openEdit(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-sm font-medium transition-colors border border-brand-500/20">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(plan._id)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-danger/10 hover:bg-danger/20 text-danger transition-colors border border-danger/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">
                  {modal === 'create' ? 'Create New Plan' : 'Edit Plan'}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="form-label">Plan Name *</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    className="input-field" placeholder="e.g. Pro, Enterprise" />
                </div>

                {/* Price + Billing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Price ($/mo) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                        className="input-field pl-9" placeholder="9" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Billing Cycle</label>
                    <select name="billingCycle" value={form.billingCycle} onChange={handleChange}
                      className="input-field">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <label className="form-label">Storage Limit *</label>
                  <div className="flex gap-2">
                    <input name="storageValue" type="number" min="1"
                      value={form.storageValue ?? (form.storageUnit === 'GB' ? form.storageLimitBytes / GB : form.storageLimitBytes / MB)}
                      onChange={handleChange}
                      className="input-field flex-1" placeholder="50" />
                    <select name="storageUnit" value={form.storageUnit} onChange={handleChange}
                      className="input-field w-24">
                      <option value="MB">MB</option>
                      <option value="GB">GB</option>
                    </select>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="form-label">Features (one per line)</label>
                  <textarea name="features" value={form.features} onChange={handleChange} rows={4}
                    className="input-field resize-none" placeholder={"AES-256 Encryption\n5 Device Sessions\nPriority Support"} />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isPopular" checked={form.isPopular} onChange={handleChange}
                      className="w-4 h-4 rounded accent-brand-500" />
                    <span className="text-sm text-slate-300">Mark as Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                      className="w-4 h-4 rounded accent-brand-500" />
                    <span className="text-sm text-slate-300">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  {modal === 'create' ? 'Create Plan' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 max-w-sm w-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-danger/20 border border-danger/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-danger" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Deactivate Plan?</h3>
              <p className="text-slate-400 text-sm mb-6">This will mark the plan as inactive. Users on this plan will keep their current storage.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-danger text-white font-semibold hover:bg-danger/80 transition-colors">
                  Deactivate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPlans;
