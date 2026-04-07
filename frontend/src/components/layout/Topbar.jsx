import React from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import RiskBadge from '../ui/RiskBadge';

const Topbar = ({ title }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-dark-100/60 backdrop-blur-xl sticky top-0 z-10">
      {/* Page Title */}
      <h1 className="text-lg font-semibold font-display text-slate-100">{title}</h1>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Risk Level Badge */}
        {user?.lastLoginRisk && (
          <RiskBadge level={user.lastLoginRisk} showLabel={false} />
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all relative">
          <Bell className="w-4 h-4" />
          {user?.lastLoginRisk === 'high' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-sm font-bold shadow-brand">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
