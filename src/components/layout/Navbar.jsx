import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCountApi } from '../../api/notification';
import {
  Calendar, Home, BookOpen, LogOut, User,
  Menu, X, Settings, ChevronDown, ChevronRight,
  MessageSquareWarning, ShieldCheck, ClipboardList,
  Sun, Moon, Bell, CreditCard,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef(null);

  // ── FIX #1: key adalah unread_count (bukan count), polling 10 detik ──────
  const { data: unreadData } = useQuery({
    queryKey: ['notification-unread'],
    queryFn: () => getUnreadCountApi().then(r => r.data.data?.unread_count || 0),
    refetchInterval: 10_000,          // dipercepat dari 30s → 10s
    refetchIntervalInBackground: true, // tetap poll meski tab di background
    enabled: !!user,
  });
  const unreadCount = unreadData || 0;

  // ── FIX #3: badge orange dot muncul saat pengguna di halaman LAIN ────────
  const isOnNotifPage = location.pathname === '/notifications';

  const handleLogout = async () => { await logout(); navigate('/login'); };

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeAll = () => {
    setDropdownOpen(false);
    setSettingsOpen(false);
    setMobileOpen(false);
  };

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar size={15} className="text-white" />
          </div>
          BokingYuk
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Home size={15} /> Beranda
          </Link>
          <Link to="/bookings" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors">
            <BookOpen size={15} /> Booking Saya
          </Link>

          <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200 dark:border-slate-700">
            {/* Notification bell dengan badge */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell size={17} />
              {/* FIX #3: angka jika ada unread, dot orange jika di halaman lain */}
              {unreadCount > 0 && !isOnNotifPage && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {unreadCount > 0 && isOnNotifPage && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* User dropdown */}
            <div className="relative ml-1" ref={menuRef}>
              <button
                onClick={() => { setDropdownOpen((v) => !v); if (dropdownOpen) setSettingsOpen(false); }}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">{user?.name}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <div className={`
                  absolute right-0 top-[calc(100%+6px)] w-56
                  bg-white dark:bg-[#111827]
                  border border-slate-200 dark:border-slate-700
                  rounded-2xl shadow-[0_8px_24px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_24px_0_rgba(0,0,0,0.4)]
                  overflow-hidden
                  transition-all duration-150 origin-top-right
                  ${dropdownOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}
                `}
              >
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.email}</p>
                </div>

                {[
                  { to: '/profile',         icon: User,       label: 'Profil Saya' },
                  { to: '/payment-history', icon: CreditCard, label: 'Riwayat Pembayaran' },
                ].map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to} onClick={closeAll}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <Icon size={15} className="text-slate-400 shrink-0" /> {label}
                  </Link>
                ))}

                {/* Settings submenu */}
                <div>
                  <button
                    onClick={() => setSettingsOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Settings size={15} className="text-slate-400" /> Pengaturan
                    </span>
                    <ChevronRight size={12} className={`text-slate-400 transition-transform duration-200 ${settingsOpen ? 'rotate-90' : ''}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 bg-slate-50 dark:bg-slate-800/50 ${settingsOpen ? 'max-h-40' : 'max-h-0'}`}>
                    {[
                      { to: '/settings/pengaduan',       icon: MessageSquareWarning, label: 'Pengaduan' },
                      { to: '/settings/pengajuan-admin', icon: ShieldCheck,          label: 'Pengajuan Admin' },
                      { to: '/settings/log-aktivitas',   icon: ClipboardList,        label: 'Log Aktivitas' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={closeAll}
                        className="flex items-center gap-3 pl-10 pr-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Icon size={13} /> {label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} /> Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: dark toggle + burger */}
        <div className="md:hidden flex items-center gap-1">
          {/* FIX #3: bell icon dengan badge di mobile */}
          <Link to="/notifications" className="relative p-2 text-slate-500 dark:text-slate-400">
            <Bell size={19} />
            {unreadCount > 0 && !isOnNotifPage && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {unreadCount > 0 && isOnNotifPage && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </Link>
          <button onClick={toggle} className="p-2 text-slate-500 dark:text-slate-400">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-3 space-y-0.5">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-0.5">
            {[
              { to: '/settings/pengaduan',         icon: MessageSquareWarning, label: 'Pengaduan' },
              { to: '/settings/pengajuan-admin',   icon: ShieldCheck,          label: 'Pengajuan Admin' },
              { to: '/settings/log-aktivitas',     icon: ClipboardList,        label: 'Log Aktivitas' },
            ].map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} onClick={closeAll}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Icon size={15} /> {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}