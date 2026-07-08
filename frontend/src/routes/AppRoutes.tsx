import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import { InboxPage } from '../pages/InboxPage';
import KanbanPage from '../pages/KanbanPage';
import TicketsPage from '../pages/TicketsPage';
import ClientsPage from '../pages/ClientsPage';
import { AiAssistantPage } from '../pages/AiAssistantPage';
import { ChannelsPage } from '../pages/ChannelsPage';
import { BillingPage } from '../pages/BillingPage';
import Onboarding from '../pages/Onboarding';
import DesignSystem from '../pages/DesignSystem';

import DashboardLayout from '../components/layout/DashboardLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Rutas Protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <InboxPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <KanbanPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TicketsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ClientsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-assistant"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AiAssistantPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/channels"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ChannelsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <BillingPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
