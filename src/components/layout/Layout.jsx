import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import RouteGate from '../auth/RouteGate';
import { useIdleLogout } from '../../hooks/useIdleLogout';
import { useLocation } from 'react-router-dom';

export default function Layout() {
  useIdleLogout();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  // The mobile menu is open for one path only, so it closes by itself when the route changes.
  const [mobileOpenAt, setMobileOpenAt] = useState(null);
  const mobileOpen = mobileOpenAt === location.pathname;
  const setMobileOpen = (open) => setMobileOpenAt(open ? location.pathname : null);

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="app-main">
        <Header onMobileToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="app-content">
          <RouteGate />
        </main>
      </div>
    </div>
  );
}
