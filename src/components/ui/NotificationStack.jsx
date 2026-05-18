import { useState, useRef, useEffect } from 'react';
import { Bell, CreditCard, CalendarCheck, X, Zap } from 'lucide-react';

const NOTIF_DURATION = 10_000;

// ── Tema per type ─────────────────────────────────────────────────────────────
const THEME = {
  payment: {
    iconBg:   'bg-green-100 dark:bg-green-900/40',
    iconColor:'text-green-600 dark:text-green-400',
    bar:      'bg-green-500',
    count:    'text-green-500',
    Icon:     CreditCard,
  },
  booking: {
    iconBg:   'bg-blue-100 dark:bg-blue-900/40',
    iconColor:'text-blue-600 dark:text-blue-400',
    bar:      'bg-blue-500',
    count:    'text-blue-500',
    Icon:     CalendarCheck,
  },
  checkin: {
    iconBg:   'bg-purple-100 dark:bg-purple-900/40',
    iconColor:'text-purple-600 dark:text-purple-400',
    bar:      'bg-purple-500',
    count:    'text-purple-500',
    Icon:     Zap,
  },
  default: {
    iconBg:   'bg-gray-100 dark:bg-gray-800',
    iconColor:'text-gray-600 dark:text-gray-400',
    bar:      'bg-gray-400',
    count:    'text-gray-500',
    Icon:     Bell,
  },
};

// ── Single Toast ──────────────────────────────────────────────────────────────
export function NotificationToast({ notif, onClose }) {
  const [countdown, setCountdown] = useState(NOTIF_DURATION / 1000);
  const [progress,  setProgress]  = useState(100);
  const intervalRef  = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed   = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, NOTIF_DURATION - elapsed);
      setProgress((remaining / NOTIF_DURATION) * 100);
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        onClose(notif.id);
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [notif.id, onClose]);

  const t    = THEME[notif.type] ?? THEME.default;
  const Icon = t.Icon;

  return (
    <div
      className="relative flex items-start gap-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-5 pr-12 w-96 overflow-hidden"
      style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${t.iconBg}`}>
        <Icon size={20} className={t.iconColor} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-snug">
          {notif.title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {notif.message}
        </p>
        {notif.time && (
          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
        )}
      </div>
      <span className={`absolute top-4 right-9 text-xs font-bold tabular-nums ${t.count}`}>
        {countdown}s
      </span>
      <button
        onClick={() => onClose(notif.id)}
        className="absolute top-3 right-3 p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors"
      >
        <X size={15} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-b-2xl overflow-hidden">
        <div className={`h-full transition-none rounded-b-2xl ${t.bar}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ── Stack ─────────────────────────────────────────────────────────────────────
export function NotificationStack({ notifications = [], onClose }) {
  if (notifications.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(80px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast notif={n} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}