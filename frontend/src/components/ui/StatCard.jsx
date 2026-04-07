import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand', trend }) => {
  const colors = {
    brand:   'from-brand-500/20 to-brand-600/10 border-brand-500/20 text-brand-400',
    success: 'from-success/20 to-success/10 border-success/20 text-success',
    warning: 'from-warning/20 to-warning/10 border-warning/20 text-warning',
    danger:  'from-danger/20 to-danger/10 border-danger/20 text-danger',
    info:    'from-info/20 to-info/10 border-info/20 text-info',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 bg-gradient-to-br ${colors[color]} border`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold font-display text-slate-100 mt-1">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-3 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% from last week
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
