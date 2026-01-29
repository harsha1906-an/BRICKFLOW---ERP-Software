import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Purchases from './pages/Purchases';
import Labour from './pages/Labour';
import Customer from './pages/Customer';
import PurchaseOrder from './pages/PurchaseOrder';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import PaymentRequests from './pages/PaymentRequests';
import PettyCash from './pages/PettyCash';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="payments" element={<Payments />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="labour" element={<Labour />} />
            <Route path="customers" element={<Customer />} />
            <Route path="purchase-orders" element={<PurchaseOrder />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="payment-requests" element={<PaymentRequests />} />
            <Route path="petty-cash" element={<PettyCash />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
