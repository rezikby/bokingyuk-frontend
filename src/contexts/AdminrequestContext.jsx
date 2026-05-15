import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { canShowNotif, consumeNotifQuota } from '../helper/Notifquota';

// ── API ───────────────────────────────────────────────────────────────────────
const fetchRequests = () =>
  api.get('/v1/super-admin/admin-requests', { params: { per_page: 999 } }).then((r) => r.data.data);

// ── Notification Sound ────────────────────────────────────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    ctx.resume().then(() => {
      const playTone = (freq, startTime, duration, gainVal) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const now = ctx.currentTime;
      playTone(880,  now,        0.18, 0.35);
      playTone(1100, now + 0.22, 0.22, 0.30);
    });
  } catch (_) {}
}

// ── Context ───────────────────────────────────────────────────────────────────
export const AdminRequestsContext = createContext(null);

export function AdminRequestsProvider({ children }) {
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);

  const prevCountRef    = useRef(null);
  const isFirstFetchRef = useRef(true);

  const { data } = useQuery({
    queryKey: ['super-admin-requests-global'],
    queryFn: fetchRequests,
    refetchInterval: 1_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!data) return;

    const items = data?.data ?? data ?? [];
    const count = Array.isArray(items)
      ? items.filter((r) => r.status === 'pending').length
      : 0;

    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      prevCountRef.current = count;
      return;
    }

    if (prevCountRef.current !== null && count > prevCountRef.current) {
      const diff = count - prevCountRef.current;

      // ✅ Badge sidebar — selalu update tanpa peduli quota
      setUnreadCount((prev) => prev + diff);

      // ✅ Toast + suara — hanya kalau quota hari ini masih ada
      if (canShowNotif()) {
        const message = diff === 1
          ? 'Ada 1 request admin baru masuk!'
          : `Ada ${diff} request admin baru masuk!`;

        setNotifications((prev) => {
          if (prev.length >= 3) return prev; // max 3 toast sekaligus
          return [...prev, { id: Date.now() + Math.random(), message }];
        });

        consumeNotifQuota();
        playNotifSound();
      }
    }

    prevCountRef.current = count;
  }, [data]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);
  const removeNotif = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <AdminRequestsContext.Provider value={{ unreadCount, clearUnread, notifications, removeNotif }}>
      {children}
    </AdminRequestsContext.Provider>
  );
}

export function useAdminRequests() {
  const ctx = useContext(AdminRequestsContext);
  if (!ctx) return { unreadCount: 0, clearUnread: () => {}, notifications: [], removeNotif: () => {} };
  return ctx;
}