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

  const { data: unreadData } = useQuery({
    queryKey: ['notification-unread'],
    queryFn: () => getUnreadCountApi().then(r => r.data.data?.count || 0),
    refetchInterval: 30000,
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
                {badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
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
