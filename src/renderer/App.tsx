import Dashboard from '@pages/dashboard';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Settings from '@pages/settings';
import { LocaleProvider } from '@contexts/LocaleContext';
import '@i18n/index';
import './styles.css';

export default function App() {
  return (
    <LocaleProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </LocaleProvider>
  );
}
