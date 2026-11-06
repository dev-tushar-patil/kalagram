import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { CalendarRange, ExternalLink, Images, LayoutDashboard, Library, LogOut, Menu, MessageSquare, Settings, Sprout, Users, X } from 'lucide-react';
import { AuthProvider, useAuth } from '../../context/AuthContext.jsx';
import { Loading } from '../../components/States.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import WorkshopsAdmin from './WorkshopsAdmin.jsx';
import WorkshopEditor from './WorkshopEditor.jsx';
import RegistrationsAdmin from './RegistrationsAdmin.jsx';
import GalleryAdmin from './GalleryAdmin.jsx';
import ResourcesAdmin from './ResourcesAdmin.jsx';
import EnquiriesAdmin from './EnquiriesAdmin.jsx';
import SettingsAdmin from './SettingsAdmin.jsx';
import '../../styles/admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/workshops', label: 'Workshops', Icon: CalendarRange },
  { to: '/admin/registrations', label: 'Registrations', Icon: Users },
  { to: '/admin/enquiries', label: 'Enquiries', Icon: MessageSquare },
  { to: '/admin/gallery', label: 'Gallery', Icon: Images },
  { to: '/admin/resources', label: 'Resources', Icon: Library },
  { to: '/admin/settings', label: 'Website Settings', Icon: Settings },
];

function Shell() {
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="admin-shell">
      <aside className={`admin-side ${menuOpen ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <Sprout size={24} aria-hidden="true" />
          <span>Kalagram Admin</span>
          <button type="button" className="admin-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <nav className="admin-nav" aria-label="Admin">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}><Icon size={18} aria-hidden="true" />{label}</NavLink>
          ))}
          <a href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={18} aria-hidden="true" />View Website</a>
          <button type="button" onClick={logout}><LogOut size={18} aria-hidden="true" />Sign Out</button>
        </nav>
        <p className="admin-user">{admin.email}</p>
      </aside>
      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="workshops" element={<WorkshopsAdmin />} />
          <Route path="workshops/:id" element={<WorkshopEditor />} />
          <Route path="registrations" element={<RegistrationsAdmin />} />
          <Route path="enquiries" element={<EnquiriesAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="resources" element={<ResourcesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Gate() {
  const { admin, checking } = useAuth();
  usePageMeta('Admin', 'Kalagram admin panel');
  if (checking) return <Loading label="Checking your session" />;
  return admin ? <Shell /> : <Login />;
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
