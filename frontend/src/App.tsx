import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProposalsList } from './pages/ProposalsList';
import { ProposalCreate } from './pages/ProposalCreate';
import { ProposalDetail } from './pages/ProposalDetail';
import { PrecedentSearch } from './pages/PrecedentSearch';
import { AIReportView } from './pages/AIReportView';
import { ReviewQueue } from './pages/ReviewQueue';
import { DocumentRepository } from './pages/DocumentRepository';
import { ImplementationView } from './pages/ImplementationView';
import { AdminAuditView } from './pages/AdminAuditView';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 text-sm font-medium">
        Validating secure credentials and session tokens...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/proposals"
            element={
              <ProtectedLayout>
                <ProposalsList />
              </ProtectedLayout>
            }
          />
          <Route
            path="/proposals/new"
            element={
              <ProtectedLayout>
                <ProposalCreate />
              </ProtectedLayout>
            }
          />
          <Route
            path="/proposals/:id"
            element={
              <ProtectedLayout>
                <ProposalDetail />
              </ProtectedLayout>
            }
          />
          <Route
            path="/precedents"
            element={
              <ProtectedLayout>
                <PrecedentSearch />
              </ProtectedLayout>
            }
          />
          <Route
            path="/ai-report/:id"
            element={
              <ProtectedLayout>
                <AIReportView />
              </ProtectedLayout>
            }
          />
          <Route
            path="/review-queue"
            element={
              <ProtectedLayout>
                <ReviewQueue />
              </ProtectedLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedLayout>
                <DocumentRepository />
              </ProtectedLayout>
            }
          />
          <Route
            path="/implementation"
            element={
              <ProtectedLayout>
                <ImplementationView />
              </ProtectedLayout>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedLayout>
                <AdminAuditView />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
