import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Star, Crown, ArrowRight, HardDrive, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const MB = 1024 * 1024;
const GB = 1024 * MB;

const fmtStorage = (bytes) => {
  if (!bytes) return '–';
  if (bytes >= GB) return `${(bytes / GB).toFixed(0)} GB`;
  return `${(bytes / MB).toFixed(0)} MB`;
};

const planIcon = (name = '', isPopular) => {
  const n = name.toLowerCase();
  if (n.includes('free') || n.includes('basic')) return Star;
  if (n.includes('pro'))                          return Zap;
  if (n.includes('premium') || n.includes('enterprise')) return Crown;
  return isPopular ? Zap : Star;
};

const planGradient = (name = '', isPopular) => {
  const n = name.toLowerCase();
  if (n.includes('premium') || n.includes('enterprise')) return 'from-yellow-600/20 to-orange-600/15';
  if (isPopular)                                          return 'from-brand-600/30 to-violet-600/20';
  return 'from-slate-700/30 to-slate-800/20';
};

const planBorder = (name = '', isPopular) => {
  const n = name.toLowerCase();
  if (n.includes('premium') || n.includes('enterprise')) return 'border-yellow-500/40';
  if (isPopular)                                          return 'border-brand-500/40';
  return 'border-white/10';
};

const UpgradePage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plans')
      .then(({ data }) => setPlans(data.data || []))
      .catch(() => toast.error('Failed to load plans.'))
      .finally(() => setLoading(false));
  }, []);

  const currentPlanId = user?.plan?._id || user?.plan;
  const currentStorageLimit = user?.storageLimit ?? 0;

  const isCurrentPlan = (plan) => {
    if (currentPlanId && plan._id === currentPlanId.toString()) return true;
    // Fallback: match by storage bytes
    return plan.storageLimitBytes === currentStorageLimit;
  };

  const handleUpgrade = (plan) => {
    if (isCurrentPlan(plan)) return toast(`You're already on the ${plan.name} plan.`, { icon: 'ℹ️' });
    navigate('/payment', { state: { plan } });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" text="Loading plans…" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h2 className="text-4xl font-display font-bold text-slate-100 mb-3">
          Upgrade Your <span className="gradient-text">Secure Vault</span>
        </h2>
        <p className="text-slate-400">More storage, more features — always encrypted.</p>
        {user?.plan?.name && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-sm">
            Current plan: <span className="font-bold">{user.plan.name}</span>
            <span className="text-slate-500 ml-1">· {fmtStorage(currentStorageLimit)} storage</span>
          </div>
        )}
      </motion.div>

      {plans.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <RefreshCw className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No plans available. Contact an administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon     = planIcon(plan.name, plan.isPopular);
            const isCurrent = isCurrentPlan(plan);
            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative glass-card p-8 border-2 bg-gradient-to-br ${planGradient(plan.name, plan.isPopular)} ${planBorder(plan.name, plan.isPopular)} ${plan.isPopular ? 'ring-1 ring-brand-500/40' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-gradient rounded-full text-white text-xs font-bold shadow-brand whitespace-nowrap">
                    ✦ Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-4 px-3 py-1 bg-success/20 border border-success/30 rounded-full text-success text-xs font-bold">
                    Current Plan
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${plan.isPopular ? 'bg-brand-gradient shadow-brand' : 'bg-white/10'}`}>
                  <Icon className={`w-6 h-6 ${plan.isPopular ? 'text-white' : 'text-slate-300'}`} />
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-1">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-display font-black gradient-text">${plan.price}</span>
                  <span className="text-slate-500 text-sm">/{plan.billingCycle || 'mo'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-sm mb-5">
                  <HardDrive className="w-4 h-4 text-brand-400" />
                  {fmtStorage(plan.storageLimitBytes)} encrypted storage
                </div>

                <ul className="space-y-2.5 mb-7">
                  {(plan.features || []).map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-200
                    ${isCurrent
                      ? 'bg-success/20 text-success border border-success/30 cursor-default'
                      : plan.isPopular ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {isCurrent
                    ? <><CheckCircle className="w-4 h-4" /> Active</>
                    : <>{plan.price === 0 ? 'Downgrade' : 'Upgrade'} <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="glass-card p-6 text-center border-brand-500/10">
        <p className="text-slate-400 text-sm">
          🔒 Payments are processed securely. Plans are managed dynamically by the admin.
        </p>
      </motion.div>
    </div>
  );
};

export default UpgradePage;
