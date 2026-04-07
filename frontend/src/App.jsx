import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute, PublicRoute } from './routes/ProtectedRoute';
import LoadingSpinner from './components/ui/LoadingSpinner';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy-loaded pages
const LandingPage     = lazy(() => import('./pages/LandingPage'));
const LoginPage       = lazy(() => import('./pages/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/RegisterPage'));
const VerifyOTPPage   = lazy(() => import('./pages/VerifyOTPPage'));
const DashboardPage   = lazy(() => import('./pages/DashboardPage'));
const SecureFolderPage= lazy(() => import('./pages/SecureFolderPage'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage'));
const UpgradePage     = lazy(() => import('./pages/UpgradePage'));
const PaymentPage     = lazy(() => import('./pages/PaymentPage'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers'));
const AdminRiskMonitor= lazy(() => import('./pages/admin/AdminRiskMonitor'));
const AdminPlans      = lazy(() => import('./pages/admin/AdminPlans'));
const AdminUserDetails= lazy(() => import('./pages/admin/AdminUserDetails'));
const AdminStorage    = lazy(() => import('./pages/admin/AdminStorage'));
const AdminLogs       = lazy(() => import('./pages/admin/AdminLogs'));

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/register"    element={<RegisterPage />} />
          <Route path="/verify-otp"  element={<VerifyOTPPage />} />
        </Route>

        {/* Protected user routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard"      element={<DashboardPage />} />
            <Route path="/secure-folder"  element={<SecureFolderPage />} />
            <Route path="/profile"        element={<ProfilePage />} />
            <Route path="/upgrade"        element={<UpgradePage />} />
            <Route path="/payment"        element={<PaymentPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout admin />}>
            <Route path="/admin/dashboard"    element={<AdminDashboard />} />
            <Route path="/admin/users"        element={<AdminUsers />} />
            <Route path="/admin/risk-monitor" element={<AdminRiskMonitor />} />
            <Route path="/admin/storage"      element={<AdminStorage />} />
            <Route path="/admin/logs"         element={<AdminLogs />} />
            <Route path="/admin/user/:id"     element={<AdminUserDetails />} />
            <Route path="/admin/plans"        element={<AdminPlans />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
