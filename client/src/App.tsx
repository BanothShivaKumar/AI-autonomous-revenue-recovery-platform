import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomerIntelligencePage } from './pages/CustomerIntelligencePage';
import { CustomerGridPage } from './pages/CustomerGridPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { AIAgentPage } from './pages/AIAgentPage';
import { ActionCenterPage } from './pages/ActionCenterPage';
import { RemindersPage } from './pages/RemindersPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DemoSimulatorPage } from './pages/DemoSimulatorPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated / App Layout Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/customer-intelligence" element={<CustomerIntelligencePage />} />
            <Route path="/customers" element={<CustomerGridPage />} />
            <Route path="/customers/:id" element={<CustomerProfilePage />} />
            <Route path="/ai-agent" element={<AIAgentPage />} />
            <Route path="/action-center" element={<ActionCenterPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/demo-simulator" element={<DemoSimulatorPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
