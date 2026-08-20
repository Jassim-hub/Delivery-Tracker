import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RoleSwitcher } from '@/features/auth/RoleSwitcher';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';
import { Navbar } from '@/app/routes/shared/Navbar';

// Auth Pages
import { LoginPage } from '@/app/routes/auth/LoginPage';
import { SignupPage } from '@/app/routes/auth/SignupPage';

// Rider Routes
import { RiderDashboard } from '@/app/routes/rider/RiderDashboard';
import { RiderActiveDelivery } from '@/app/routes/rider/RiderActiveDelivery';
import { RiderChat } from '@/app/routes/rider/RiderChat';
import { RiderProfile } from '@/app/routes/rider/RiderProfile';

// Customer Routes
import { CustomerDashboard } from '@/app/routes/customer/CustomerDashboard';
import { CustomerChat } from '@/app/routes/customer/CustomerChat';
import { CustomerHistory } from '@/app/routes/customer/CustomerHistory';

// Admin Routes
import { AdminDashboard } from '@/app/routes/admin/AdminDashboard';
import { AdminDeliveries } from '@/app/routes/admin/AdminDeliveries';
import { AdminRiders } from '@/app/routes/admin/AdminRiders';
import { AdminSapSync } from '@/app/routes/admin/AdminSapSync';
import { AdminAnalytics } from '@/app/routes/admin/AdminAnalytics';
import { AdminTvDisplay } from '@/app/routes/admin/AdminTvDisplay';

// App Layout with standard Navigation bar
const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page-bg text-gray-900">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <RoleSwitcher />
      <PwaInstallPrompt />
    </div>
  );
};

// Root index redirector based on authenticated user's role
const RoleHomeRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case 'rider':
      return <Navigate to="/rider" replace />;
    case 'customer':
      return <Navigate to="/customer" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Root Role-Based Landing Redirect */}
          <Route path="/" element={<RoleHomeRedirect />} />

          {/* TV Display Ops Board (Unattended Fullscreen - No Standard Navbar) */}
          <Route
            path="/admin/tv-display"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminTvDisplay />
              </ProtectedRoute>
            }
          />

          {/* Standard Authenticated App Routes with Navbar Shell */}
          <Route element={<AppLayout />}>
            {/* Rider Protected Routes */}
            <Route
              path="/rider"
              element={
                <ProtectedRoute allowedRoles={['rider']}>
                  <RiderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/active/:id"
              element={
                <ProtectedRoute allowedRoles={['rider']}>
                  <RiderActiveDelivery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/chat"
              element={
                <ProtectedRoute allowedRoles={['rider']}>
                  <RiderChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rider/profile"
              element={
                <ProtectedRoute allowedRoles={['rider']}>
                  <RiderProfile />
                </ProtectedRoute>
              }
            />

            {/* Customer Protected Routes */}
            <Route
              path="/customer"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/chat"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/history"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerHistory />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deliveries"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDeliveries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/riders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminRiders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sap-sync"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSapSync />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
