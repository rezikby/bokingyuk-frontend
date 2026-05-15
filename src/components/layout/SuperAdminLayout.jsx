import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, Users, UserCheck,
  LogOut, Menu, ChevronLeft, Shield,
  MessageSquareWarning, ShieldAlert, Settings2,
  BookOpen, CreditCard, BarChart3, Lock,
  Sun, Moon, Server, Bell, RefreshCw, RotateCcw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { PengaduanProvider, usePengaduan } from '../../contexts/PengaduanContext';
import { AdminRequestsProvider, useAdminRequests } from '../../contexts/AdminrequestContext';
import { NotificationStack } from '../ui/NotificationStack';

const navItems = [
  { to: '/super-admin',                  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/customers',        icon: UserCheck,       label: 'Kelola Customer' },
  { to: '/super-admin/users',            icon: Users,           label: 'Kelola Admin' },
  { to: '/super-admin/permissions',      icon: Lock,            label: 'Role & Permission' },
  { to: '/super-admin/all-bookings',     icon: BookOpen,        label: 'Semua Booking' },
  { to: '/super-admin/all-transactions', icon: CreditCard,      label: 'Semua Transaksi' },
  { to: '/super-admin/statistics',       icon: BarChart3,       label: 'Statistik' },
  { to: '/super-admin/audit-log',        icon: ShieldAlert,     label: 'Audit Log' },
  { to: '/super-admin/monitoring',       icon: Server,          label: 'Monitoring Server' },
  { to: '/super-admin/notifications',    icon: Bell,            label: 'Notification Center' },
  { to: '/super-admin/refund',           icon: RotateCcw,       label: 'Refund' },
  { to: '/super-admin/backup',           icon: RefreshCw,       label: 'Backup Database' },
  { to: '/super-admin/settings',         icon: Settings2,       label: 'Pengaturan Situs' },
];

function NavLink({ to, icon: Icon, label, collapsed, onClick, badge }) {
  const loc    = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <span className="relative shrink-0">
        <Icon size={17} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between">
          {label}
          {badge > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

function PengaduanNavLink({ collapsed, onClick }) {
  const loc             = useLocation();
  const active          = loc.pathname === '/super-admin/pengaduan';
  const { unreadCount } = usePengaduan();
  return (
    <Link
      to="/super-admin/pengaduan"
      onClick={onClick}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <span className="relative shrink-0">
        <MessageSquareWarning size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between">
          Pengaduan
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

function AdminRequestsNavLink({ collapsed, onClick }) {
  const loc             = useLocation();
  const active          = loc.pathname === '/super-admin/admin-requests';
  const { unreadCount } = useAdminRequests();
  return (
    <Link
      to="/super-admin/admin-requests"
      onClick={onClick}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <span className="relative shrink-0">
        <UserCheck size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between">
          Request Admin
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

function LayoutInner({ children }) {
  const { logout, user }                    = useAuth();
  const { dark, toggle }                    = useTheme();
  const navigate                            = useNavigate();
  const { clearUnread: clearPengaduan,     notifications: pengaduanNotifs,     removeNotif: removePengaduan }     = usePengaduan();
  const { clearUnread: clearAdminRequests, notifications: adminRequestNotifs,  removeNotif: removeAdminRequest }  = useAdminRequests();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const allNotifications = useMemo(() => [
    ...pengaduanNotifs.map((n)    => ({ ...n, type: 'pengaduan' })),
    ...adminRequestNotifs.map((n) => ({ ...n, type: 'admin-request' })),
  ], [pengaduanNotifs, adminRequestNotifs]);

  const handleCloseNotif = (id) => {
    removePengaduan(id);
    removeAdminRequest(id);
  };

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'SA';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0F172A]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static z-40 flex flex-col bg-slate-900 border-r border-slate-800 text-white transition-all duration-200
        ${collapsed ? 'w-[60px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-full
      `}>
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-800 h-14 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <Link to="/super-admin" className="flex items-center gap-2 font-bold text-base text-white">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <Shield size={14} className="text-white" />
              </div>
              <span>Super Admin</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/super-admin">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield size={15} className="text-white" />
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-auto"
          >
            <ChevronLeft size={15} className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              icon={icon}
              label={label}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          <div className="my-2 border-t border-slate-800" />

          <AdminRequestsNavLink
            collapsed={collapsed}
            onClick={() => { clearAdminRequests(); setMobileOpen(false); }}
          />
          <PengaduanNavLink
            collapsed={collapsed}
            onClick={() => { clearPengaduan(); setMobileOpen(false); }}
          />
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className={`nav-link w-full ${collapsed ? 'justify-center' : ''}`}
          >
            {dark ? <Sun size={17} className="shrink-0" /> : <Moon size={17} className="shrink-0" />}
            {!collapsed && <span className="text-sm">{dark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-indigo-400">Super Admin</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="nav-link w-full hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 h-14 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 md:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Shield size={13} className="text-white" />
            </div>
            Super Admin
          </div>
          <button onClick={toggle} className="ml-auto p-2 text-slate-500 dark:text-slate-400">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0F172A]">
          {children}
        </main>
      </div>

      <NotificationStack notifications={allNotifications} onClose={handleCloseNotif} />
    </div>
  );
}

export default function SuperAdminLayout({ children }) {
  return (
    <PengaduanProvider>
      <AdminRequestsProvider>
        <LayoutInner>{children}</LayoutInner>
      </AdminRequestsProvider>
    </PengaduanProvider>
  );
}
