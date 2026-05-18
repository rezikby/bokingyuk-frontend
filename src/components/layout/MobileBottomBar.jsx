// Mobile Bottom Navigation Bar - khusus customer, icon only
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUnreadCountApi } from '../../api/notification';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  BookOpen,
  Bell,
  User,
  CreditCard,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',                icon: Home,      label: 'Beranda' },
  { to: '/bookings',        icon: BookOpen,   label: 'Booking' },
  { to: '/notifications',   icon: Bell,       label: 'Notif',   badge: true },
  { to: '/payment-history', icon: CreditCard, label: 'Riwayat' },
  { to: '/profile',         icon: User,       label: 'Profil' },
];

export default function MobileBottomBar() {
  const location = useLocation();
  const { user } = useAuth();

  // FIX #1 + #3: key unread_count (bukan count), polling 10 detik
  const { data: unreadData } = useQuery({
    queryKey: ['notification-unread'],
    queryFn: () => getUnreadCountApi().then(r => r.data.data?.unread_count || 0),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
    enabled: !!user,
  });
  const unreadCount = unreadData || 0;

  // Hanya tampilkan untuk role customer (bukan admin/super_admin)
  if (!user || user.role === 'admin' || user.role === 'super_admin') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          // FIX #3: dot orange jika user di halaman lain (bukan di /notifications)
          const isOnThisPage = location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors
                ${isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {/* Badge angka jika unread dan TIDAK di halaman notif */}
                {badge && unreadCount > 0 && !isOnThisPage && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {/* FIX #3: Dot orange jika di halaman notif tapi masih ada unread */}
                {badge && unreadCount > 0 && isOnThisPage && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-[#111827]" />
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}