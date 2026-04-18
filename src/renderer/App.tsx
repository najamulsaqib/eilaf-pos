import LoadingSpinner from '@components/common/LoadingSpinner';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import { LocaleProvider, useLocale } from '@contexts/LocaleContext';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import '@i18n/index';
import LoginPage from '@pages/auth/Login';
import BillsPage from '@pages/bills';
import Dashboard from '@pages/dashboard';
import ProductsPage from '@pages/products';
import ReportsPage from '@pages/reports';
import Settings from '@pages/settings';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
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

function ThemedToaster() {
  const { isDark } = useTheme();
  const { isRTL } = useLocale();
  return (
    <Toaster
      position={isRTL ? 'top-left' : 'top-right'}
      richColors
      closeButton
      theme={isDark ? 'dark' : 'light'}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <AppRoutes />
          <ThemedToaster />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
