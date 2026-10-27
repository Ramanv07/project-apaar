import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortalSettingsProvider } from './context/PortalSettingsContext';

// Layout
import { TopUtilityBar } from './components/layout/TopUtilityBar';
import { PortalHeader } from './components/layout/PortalHeader';
import { Navigation } from './components/layout/Navigation';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { PortalFooter } from './components/layout/PortalFooter';

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
    <>
      <TopUtilityBar />
      <PortalHeader />
      <Navigation />
      <Breadcrumbs />
      <main id="main-content">
        {children}
      </main>
      <PortalFooter />
    </>
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

            {/* Standard Portal Pages with GIGW Government Layout */}
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
