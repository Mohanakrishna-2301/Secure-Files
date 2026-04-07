import React from 'react';

const riskConfig = {
  low:    { label: 'Low Risk',    dot: 'bg-success', text: 'text-success', border: 'border-success/30', bg: 'bg-success/10' },
  medium: { label: 'Medium Risk', dot: 'bg-warning', text: 'text-warning', border: 'border-warning/30', bg: 'bg-warning/10' },
  high:   { label: 'High Risk',   dot: 'bg-danger',  text: 'text-danger',  border: 'border-danger/30',  bg: 'bg-danger/10'  },
};

const RiskBadge = ({ level = 'low', showLabel = true, size = 'sm' }) => {
  const cfg = riskConfig[level] || riskConfig.low;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${textSize} ${cfg.text} ${cfg.border} ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {showLabel && cfg.label}
    </span>
  );
};

export default RiskBadge;
