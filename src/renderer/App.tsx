import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import Dashboard from '@pages/dashboard';
import BillsPage from '@pages/bills';
import ProductsPage from '@pages/products';
import ReportsPage from '@pages/reports';
import Settings from '@pages/settings';
import LoginPage from '@pages/auth/Login';
import { LocaleProvider } from '@contexts/LocaleContext';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { ThemeProvider } from '@contexts/ThemeContext';
import LoadingSpinner from '@components/common/LoadingSpinner';
import '@i18n/index';
import './styles.css';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
