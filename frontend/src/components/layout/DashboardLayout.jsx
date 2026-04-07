import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/dashboard':         'Dashboard',
  '/secure-folder':     'Secure Folder',
  '/profile':           'My Profile',
  '/upgrade':           'Upgrade Plan',
  '/payment':           'Payment',
  '/admin/dashboard':   'Admin Dashboard',
  '/admin/users':       'User Management',
  '/admin/risk-monitor':'Risk Monitor',
  '/admin/storage':     'Storage Management',
  '/admin/logs':        'Activity Logs',
  '/admin/plans':       'Plan Management',
};

const DashboardLayout = ({ admin = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith('/admin/user/') 
    ? 'User Details' 
    : pageTitles[location.pathname] || 'Secure-Files';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-400">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} isAdmin={admin} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="page-container"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
