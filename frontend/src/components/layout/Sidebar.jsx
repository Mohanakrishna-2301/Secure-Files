import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderLock, User, Zap, LogOut,
  Shield, Users, AlertTriangle, ChevronLeft, ChevronRight,
  Lock, CreditCard, HardDrive, FileText
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const userNav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/secure-folder', icon: FolderLock,       label: 'Secure Folder' },
  { to: '/profile',       icon: User,             label: 'Profile' },
  { to: '/upgrade',       icon: Zap,              label: 'Upgrade Plan' },
];

const adminNav = [
  { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/admin/users',        icon: Users,           label: 'Users' },
  { to: '/admin/risk-monitor', icon: AlertTriangle,   label: 'Risk Monitor' },
  { to: '/admin/storage',      icon: HardDrive,       label: 'Storage' },
  { to: '/admin/logs',         icon: FileText,        label: 'Activity Logs' },
  { to: '/admin/plans',        icon: CreditCard,      label: 'Plan Management' },
];

const Sidebar = ({ collapsed, onToggle, isAdmin }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin ? adminNav : userNav;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    // AuthContext.logout() already redirects to '/' via window.location.href
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen flex flex-col bg-dark-100/80 backdrop-blur-xl border-r border-white/5 relative z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand flex-shrink-0">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-display font-bold text-lg gradient-text whitespace-nowrap"
            >
              Secure-Files
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
               ${isActive
                 ? 'bg-brand-gradient text-white shadow-brand'
                 : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-danger/10 hover:text-danger transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-dark-100 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
