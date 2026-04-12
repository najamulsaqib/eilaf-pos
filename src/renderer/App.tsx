import Dashboard from '@pages/dashboard';
import { Route, MemoryRouter as Router, Routes } from 'react-router-dom';
import Settings from '@pages/settings';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
