import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import LogsPage from './pages/LogsPage';
import HelpPage from './pages/HelpPage';
import CalendarPage from './pages/CalendarPage';
import ArchitecturePage from './pages/ArchitecturePage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';
import ToastContainer from './components/Toast';

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
