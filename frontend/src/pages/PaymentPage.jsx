import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Lock, CheckCircle, ArrowLeft, Shield,
  Calendar, User, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Format card number with spaces
const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
// Format expiry MM/YY
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const { updateUser } = useAuth();

  const plan = state?.plan;

  const [form, setForm] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState(false);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-danger" />
        <p className="text-slate-300">No plan selected. Please go back and choose a plan.</p>
        <button onClick={() => navigate('/upgrade')} className="btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Plans
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'cardNumber') v = formatCard(value);
    if (name === 'expiry')     v = formatExpiry(value);
    if (name === 'cvv')        v = value.replace(/\D/g, '').slice(0, 4);
    setForm(p => ({ ...p, [name]: v }));
    setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.cardName.trim())  errs.cardName = 'Name on card is required.';
    if (form.cardNumber.replace(/\s/g, '').length !== 16) errs.cardNumber = 'Enter a valid 16-digit card number.';
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = 'Use MM/YY format.';
    if (form.cvv.length < 3)   errs.cvv = 'CVV must be 3–4 digits.';
    return errs;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setProcessing(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const { data } = await api.post('/user/upgrade', { planId: plan._id });
      updateUser({ storageLimit: data.storageLimit, plan: data.plan });
      setSuccess(true);
      toast.success(`🎉 Upgraded to ${plan.name}!`);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 rounded-full bg-success/20 border-4 border-success/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-success" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold text-slate-100 mb-2">Payment Successful!</h2>
          <p className="text-slate-400 mb-2">You've been upgraded to the <span className="text-brand-400 font-bold">{plan.name}</span> plan.</p>
          <p className="text-slate-500 text-sm">Redirecting to dashboard…</p>
          <div className="mt-6 progress-track">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }}
              className="progress-fill" />
          </div>
        </motion.div>
      </div>
    );
  }

  const fmtStorage = (bytes) => {
    const GB = 1024 ** 3;
    const MB = 1024 ** 2;
    return bytes >= GB ? `${(bytes / GB).toFixed(0)} GB` : `${(bytes / MB).toFixed(0)} MB`;
  };

  const Field = ({ label, name, placeholder, type = 'text', icon: Icon, maxLength }) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
        <input
          name={name} value={form[name]} onChange={handleChange}
          type={type} placeholder={placeholder} maxLength={maxLength}
          className={`input-field ${Icon ? 'pl-11' : ''} ${errors[name] ? 'border-danger/60' : ''}`}
        />
      </div>
      {errors[name] && (
        <p className="text-danger text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left: Payment Form */}
        <div className="lg:col-span-3 space-y-6">
          <button onClick={() => navigate('/upgrade')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to plans
          </button>

          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-100">Secure Payment</h2>
                <div className="flex items-center gap-1 text-xs text-success">
                  <Lock className="w-3 h-3" /> SSL encrypted
                </div>
              </div>
            </div>

            {/* Card preview */}
            <div className="relative mb-8 h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-violet-700 shadow-brand p-6 select-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent)]" />
              <div className="flex justify-between items-start">
                <div className="w-10 h-7 rounded bg-yellow-400/80 flex items-center justify-center text-[10px] font-bold text-yellow-900">VISA</div>
                <Shield className="w-6 h-6 text-white/40" />
              </div>
              <div className="mt-4 font-mono text-white/90 text-lg tracking-widest">
                {form.cardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Card Holder</p>
                  <p className="text-white text-sm font-medium truncate">{form.cardName || 'Your Name'}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">Expires</p>
                  <p className="text-white text-sm font-mono">{form.expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <Field label="Name on Card" name="cardName" placeholder="John Doe" icon={User} />
              <Field label="Card Number" name="cardNumber" placeholder="1234 5678 9012 3456" icon={CreditCard} maxLength={19} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry Date" name="expiry" placeholder="MM/YY" icon={Calendar} maxLength={5} />
                <Field label="CVV" name="cvv" placeholder="•••" type="password" icon={Lock} maxLength={4} />
              </div>

              <motion.button
                type="submit" disabled={processing}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base mt-2">
                {processing ? (
                  <><LoadingSpinner size="sm" /> Processing Payment…</>
                ) : (
                  <><Lock className="w-4 h-4" /> Pay ${plan.price}/mo — {plan.name}</>
                )}
              </motion.button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-5 text-slate-600 text-xs">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 256-bit SSL</span>
              <span>•</span>
              <span>Demo mode — no real charge</span>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 sticky top-6">
            <h3 className="font-semibold text-slate-200 mb-5">Order Summary</h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Plan</span>
                <span className="text-slate-200 font-medium">{plan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Storage</span>
                <span className="text-slate-200">{fmtStorage(plan.storageLimitBytes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Billing</span>
                <span className="text-slate-200 capitalize">{plan.billingCycle}</span>
              </div>
              {plan.features?.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle className="w-3 h-3 text-success flex-shrink-0" /> {f}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-medium">Total</span>
                <span className="text-2xl font-black gradient-text">${plan.price}<span className="text-slate-500 text-sm font-normal">/mo</span></span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-success/5 border border-success/20 rounded-xl">
              <p className="text-success text-xs flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> Your payment info is never stored.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentPage;
