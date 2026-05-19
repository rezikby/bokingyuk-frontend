import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, Building2, CalendarDays, QrCode,
  BarChart2, LogOut, Calendar, Menu, ChevronLeft,
  Wrench, Download, Star, Sun, Moon, Bell,
} from 'lucide-react';
import { BookingProvider, useBooking } from '../../contexts/BookingContext';
import { NotificationStack } from '../ui/NotificationStack';

const navItemsBefore = [
  { to: '/admin',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/fields', icon: Building2,       label: 'Lapangan Saya' },
];

const navItemsAfter = [
  { to: '/admin/check-in',    icon: QrCode,    label: 'Check-In' },
  { to: '/admin/reports',     icon: BarChart2, label: 'Laporan Saya' },
  { to: '/admin/ratings',     icon: Star,      label: 'Rating' },
  { to: '/admin/maintenance', icon: Wrench,    label: 'Maintenance' },
  { to: '/admin/export',      icon: Download,  label: 'Export' },
];

function NavLink({ to, icon: Icon, label, collapsed, onClick }) {
  const loc    = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && label}
    </Link>
  );
}

/**
 * FIX #3: BookingNavLink
 * Badge angka merah di icon dan di label "Booking Saya"
 * unreadCount = jumlah booking pending/belum lunas dari BookingContext
 */
function BookingNavLink({ collapsed, onClick }) {
  const loc             = useLocation();
  const active          = loc.pathname === '/admin/bookings';
  const { unreadCount } = useBooking();

  return (
    <Link
      to="/admin/bookings"
      onClick={onClick}
      className={`nav-link ${active ? 'nav-link-active' : ''}`}
    >
      <span className="relative shrink-0">
        <CalendarDays size={17} />
        {/* Badge angka di icon — terlihat bahkan saat sidebar collapsed */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none ring-2 ring-slate-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="flex-1 flex items-center justify-between">
          Booking Saya
          {/* Badge angka di kanan label — terlihat saat sidebar terbuka */}
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
  const { logout, user }                            = useAuth();
  const { dark, toggle }                            = useTheme();
  const navigate                                    = useNavigate();
  const { clearUnread, notifications, removeNotif, unreadCount, notifUnread } = useBooking();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'AD';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0F172A]">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static z-40 flex flex-col bg-slate-900 border-r border-slate-800 text-white transition-all duration-200
        ${collapsed ? 'w-[60px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-full
      `}>
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-800 h-14 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2 font-bold text-base text-white">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={14} className="text-white" />
              </div>
              <span>BokinYuk</span>
            </Link>
          )}
          {collapsed && (
            <Link to="/admin">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar size={15} className="text-white" />
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
          {!collapsed && (
            <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Menu</p>
          )}
          {navItemsBefore.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} icon={icon} label={label} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ))}

          {/* FIX #3: BookingNavLink dengan badge dari unreadCount */}
          <BookingNavLink collapsed={collapsed} onClick={() => { clearUnread(); setMobileOpen(false); }} />

          {navItemsAfter.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} icon={icon} label={label} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 space-y-1">
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
                <p className="text-[11px] text-indigo-400">Admin</p>
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 h-14 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 md:hidden">
          {/* FIX #3: tombol menu dengan badge di mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Menu size={20} />
            {/* Badge orange dot di tombol menu jika ada booking pending */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <Calendar size={13} className="text-white" />
            </div>
            BokinYuk Admin
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* FIX #3: Bell icon dengan badge notif unread di mobile header */}
            <Link
              to="/admin/notifications"
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Bell size={18} />
              {notifUnread > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </Link>
            <button onClick={toggle} className="p-2 text-slate-500 dark:text-slate-400">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-[#0F172A]">
          {children}
        </main>
      </div>

      <NotificationStack notifications={notifications} onClose={removeNotif} />
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <BookingProvider>
      <LayoutInner>{children}</LayoutInner>
    </BookingProvider>
  );
}