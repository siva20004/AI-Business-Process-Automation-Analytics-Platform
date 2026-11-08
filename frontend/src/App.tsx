import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/authContextDef';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { DataUploadCenter } from './pages/DataUploadCenter';
import { DataCleaningValidationPage } from './pages/DataCleaningValidationPage';
import { SalesAnalyticsPage } from './pages/SalesAnalyticsPage';
import { InventoryAnalyticsPage } from './pages/InventoryAnalyticsPage';
import { WorkflowAutomationPage } from './pages/WorkflowAutomationPage';
import { WorkflowHistoryPage } from './pages/WorkflowHistoryPage';
import { AnomalyDetectionPage } from './pages/AnomalyDetectionPage';
import { AIBusinessInsightsPage } from './pages/AIBusinessInsightsPage';
import { ReportCenterPage } from './pages/ReportCenterPage';
import { EmailAutomationPage } from './pages/EmailAutomationPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 font-mono tracking-wider">
            FUJI FLOW INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Module 1: Executive Dashboard */}
            <Route index element={<ExecutiveDashboard />} />

            {/* Module 2: Data Sources */}
            <Route path="data-sources" element={<DataSourcesPage />} />

            {/* Module 3: Data Upload Center */}
            <Route path="upload" element={<DataUploadCenter />} />

            {/* Module 4: Data Cleaning & Validation */}
            <Route path="validation" element={<DataCleaningValidationPage />} />

            {/* Module 5: Workflow Automation */}
            <Route path="workflows" element={<WorkflowAutomationPage />} />

            {/* Module 6: Sales Analytics */}
            <Route path="sales" element={<SalesAnalyticsPage />} />

            {/* Module 7: Inventory Analytics */}
            <Route path="inventory" element={<InventoryAnalyticsPage />} />

            {/* Module 8: Anomaly Detection */}
            <Route path="anomalies" element={<AnomalyDetectionPage />} />

            {/* Module 9: AI Business Insights */}
            <Route path="insights" element={<AIBusinessInsightsPage />} />

            {/* Module 10: Report Center */}
            <Route path="reports" element={<ReportCenterPage />} />

            {/* Module 11: Email Automation */}
            <Route path="email" element={<EmailAutomationPage />} />

            {/* Module 12: Workflow History */}
            <Route path="workflow-history" element={<WorkflowHistoryPage />} />

            {/* Module 13: User Management */}
            <Route path="users" element={<UserManagementPage />} />

            {/* Module 14: Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
