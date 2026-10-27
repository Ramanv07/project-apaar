import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalSettingsProvider } from './context/PortalSettingsContext';

// Master Layout Architecture Components
import { Sidebar } from './components/layout/Sidebar';
import { FloatingPillHeader } from './components/layout/FloatingPillHeader';
import { Breadcrumbs } from './components/layout/Breadcrumbs';

// Pages
import { Login } from './pages/Login';
import { AicteDashboard } from './pages/aicte/AicteDashboard';
import { QuotaWaterfall } from './pages/aicte/QuotaWaterfall';
import { ReviewAudit } from './pages/aicte/ReviewAudit';
import { InstitutionDashboard } from './pages/institution/InstitutionDashboard';
import { UploadAdmission } from './pages/institution/UploadAdmission';
import { StudentList } from './pages/institution/StudentList';
import { DiscrepancyQueue } from './pages/institution/DiscrepancyQueue';
import { StudentConfirm } from './pages/student/StudentConfirm';
import { PublicVerify } from './pages/verifier/PublicVerify';
import { CertificateView } from './pages/verifier/CertificateView';
import { AuditLedger } from './pages/audit/AuditLedger';

const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'INSTITUTION_NODAL_OFFICER') return <Navigate to="/institution-dashboard" replace />;
  if (user.role === 'VERIFIER') return <Navigate to="/verify" replace />;
  return <Navigate to="/dashboard" replace />;
};

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0e11] text-zinc-900 dark:text-zinc-100 flex transition-colors duration-200">
      {/* 1. Docked Full-Height Sidebar */}
      <Sidebar />

      {/* 2. Main Content Viewport with Ambient Micro-Dot Pattern */}
      <div className="flex-1 flex flex-col min-w-0 bg-dots-light dark:bg-dots-dark">
        {/* Floating Pill Topbar */}
        <FloatingPillHeader />

        {/* Dynamic Page Viewport */}
        <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-5 max-w-7xl w-full mx-auto space-y-4">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortalSettingsProvider>
          <Routes>
            {/* Standalone Mobile-Optimized Two-Key Confirmation Screen */}
            <Route path="/confirm-admission/:token" element={<StudentConfirm />} />

            {/* Standard Portal Pages with Master Enterprise Minimalist Layout */}
            <Route
              path="/login"
              element={
                <ProtectedLayout>
                  <Login />
                </ProtectedLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <AicteDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/institution-dashboard"
              element={
                <ProtectedLayout>
                  <InstitutionDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/upload-admissions"
              element={
                <ProtectedLayout>
                  <UploadAdmission />
                </ProtectedLayout>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedLayout>
                  <StudentList />
                </ProtectedLayout>
              }
            />
            <Route
              path="/discrepancies"
              element={
                <ProtectedLayout>
                  <DiscrepancyQueue />
                </ProtectedLayout>
              }
            />
            <Route
              path="/quota-waterfall"
              element={
                <ProtectedLayout>
                  <QuotaWaterfall />
                </ProtectedLayout>
              }
            />
            <Route
              path="/review-flags"
              element={
                <ProtectedLayout>
                  <ReviewAudit />
                </ProtectedLayout>
              }
            />
            <Route
              path="/fraud-graph"
              element={
                <ProtectedLayout>
                  <ReviewAudit />
                </ProtectedLayout>
              }
            />
            <Route
              path="/verify"
              element={
                <ProtectedLayout>
                  <PublicVerify />
                </ProtectedLayout>
              }
            />
            <Route
              path="/certificate"
              element={
                <ProtectedLayout>
                  <CertificateView />
                </ProtectedLayout>
              }
            />
            <Route
              path="/audit-ledger"
              element={
                <ProtectedLayout>
                  <AuditLedger />
                </ProtectedLayout>
              }
            />
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortalSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
