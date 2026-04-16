import Dashboard from '@pages/dashboard';
import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import Settings from '@pages/settings';
import LoginPage from '@pages/auth/Login';
import { LocaleProvider } from '@contexts/LocaleContext';
import { AuthProvider, useAuth } from '@contexts/AuthContext';
import LoadingSpinner from '@components/common/LoadingSpinner';
import '@i18n/index';
import './styles.css';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LocaleProvider>
  );
}
