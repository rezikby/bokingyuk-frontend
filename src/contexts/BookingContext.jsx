import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminGetBookingsApi, adminSyncPaymentsApi } from '../api/booking';
import { adminGetNotificationsApi } from '../api/notification';

// ── AudioContext singleton ─────────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
if (typeof window !== 'undefined') {
  ['click', 'keydown', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, () => { try { getAudioCtx(); } catch (_) {} }, { once: true })
  );
}

export function playSound(type = 'booking') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    if (type === 'checkin') {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(400, now);
      o.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.start(now); o.stop(now + 0.5);
    } else if (type === 'payment') {
      [0, 0.15, 0.30].forEach((delay, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = 880 + i * 220;
        g.gain.setValueAtTime(0.3, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
        o.start(now + delay); o.stop(now + delay + 0.4);
      });
    } else {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(600, now);
      o.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      g.gain.setValueAtTime(0.4, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.start(now); o.stop(now + 0.5);
    }
  } catch (e) { console.warn('Sound error:', e); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeList(raw) {
  if (Array.isArray(raw))             return raw;
  if (Array.isArray(raw?.data))       return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

// ── Context ───────────────────────────────────────────────────────────────────
export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const queryClient = useQueryClient();

  const [unreadCount,  setUnreadCount]  = useState(0);
  const [newEvents,    setNewEvents]    = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const soundEnabledRef    = useRef(true);
  const prevBookingsRef    = useRef(null);
  const isFirstFetchRef    = useRef(true);
  const shownNotifIdsRef   = useRef(new Set());
  const isFirstNotifRef    = useRef(true);
  const isSyncingRef       = useRef(false);
  const syncIntervalRef    = useRef(null);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundEnabledRef.current = !prev;
      return !prev;
    });
  }, []);

  // ── Polling booking list (untuk deteksi booking baru & update badge) ───────
  const { data: rawData } = useQuery({
    queryKey: ['admin-bookings-global'],
    queryFn:  () => adminGetBookingsApi({}).then(r => r.data),
    refetchInterval: 4_000,
    refetchIntervalInBackground: true,
  });

  // ── Polling notifikasi admin dari server ──────────────────────────────────
  const { data: rawNotifData } = useQuery({
    queryKey: ['admin-notifications-global'],
    queryFn:  () => adminGetNotificationsApi({ per_page: 20 }).then(r => r.data?.data),
    refetchInterval: 4_000,
    refetchIntervalInBackground: true,
  });

  // ── syncPayments: panggil backend untuk cek Midtrans & auto-confirm ───────
  const runSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const res = await adminSyncPaymentsApi();
      const confirmed = res.data?.data?.confirmed ?? [];
      if (confirmed.length > 0) {
        // Ada yang baru dikonfirmasi — invalidate semua query booking
        queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['admin-bookings-global'] });
        queryClient.invalidateQueries({ queryKey: ['admin-notifications-global'] });
        confirmed.forEach(code => {
          queryClient.invalidateQueries({ queryKey: ['booking', code] });
        });
      }
    } catch (_) {
      // Diam-diam gagal (mis. bukan admin / server mati)
    } finally {
      isSyncingRef.current = false;
    }
  }, [queryClient]);

  // Jalankan sync setiap 5 detik
  useEffect(() => {
    // Langsung jalankan sekali saat mount
    runSync();
    syncIntervalRef.current = setInterval(runSync, 5_000);
    return () => clearInterval(syncIntervalRef.current);
  }, [runSync]);

  // ── Proses notifikasi baru dari server ────────────────────────────────────
  useEffect(() => {
    const notifList = rawNotifData?.notifications?.data || [];
    const serverUnread = rawNotifData?.unread_count || 0;

    if (isFirstNotifRef.current) {
      isFirstNotifRef.current = false;
      notifList.forEach(n => shownNotifIdsRef.current.add(n.id));
      setUnreadCount(serverUnread);
      return;
    }

    const freshNotifs = notifList.filter(n => !shownNotifIdsRef.current.has(n.id));
    if (!freshNotifs.length) {
      // Update count dari server meski tidak ada notif baru
      setUnreadCount(serverUnread);
      return;
    }

    freshNotifs.forEach(n => shownNotifIdsRef.current.add(n.id));

    const newEvts = freshNotifs.map(n => ({
      id:        `server-${n.id}-${Date.now()}`,
      type:      n.type,
      title:     n.title,
      message:   n.body,
      time:      new Date(n.created_at).toLocaleTimeString('id-ID'),
      bookingId: n.data?.booking_id,
    }));

    setUnreadCount(serverUnread);
    setNewEvents(prev => [...newEvts, ...prev]);

    if (soundEnabledRef.current) {
      playSound(newEvts.some(n => n.type === 'payment') ? 'payment' : 'booking');
    }

    if (Notification.permission === 'granted') {
      newEvts.forEach(n =>
        new Notification(n.title, { body: n.message, icon: '/favicon.ico', tag: n.id })
      );
    }
  }, [rawNotifData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Deteksi booking baru lewat diff (backup — notif sudah dari server) ────
  useEffect(() => {
    const bookings = normalizeList(rawData);
    if (!bookings.length) return;

    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      prevBookingsRef.current = bookings.map(b => ({ id: b.id, status: b.status, payment_status: b.payment_status }));
      return;
    }
    if (!prevBookingsRef.current) {
      prevBookingsRef.current = bookings.map(b => ({ id: b.id, status: b.status, payment_status: b.payment_status }));
      return;
    }

    prevBookingsRef.current = bookings.map(b => ({ id: b.id, status: b.status, payment_status: b.payment_status }));
  }, [rawData]);

  const clearUnread   = useCallback(() => setUnreadCount(0), []);
  const consumeEvents = useCallback(() => setNewEvents([]), []);
  const removeNotif   = useCallback((id) => setNewEvents(prev => prev.filter(n => n.id !== id)), []);

  return (
    <BookingContext.Provider value={{
      unreadCount, clearUnread,
      newEvents, consumeEvents,
      soundEnabled, toggleSound: handleToggleSound,
      notifications: newEvents,
      removeNotif,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) return {
    unreadCount: 0, clearUnread: () => {},
    newEvents: [], consumeEvents: () => {},
    soundEnabled: true, toggleSound: () => {},
    notifications: [], removeNotif: () => {},
  };
  return ctx;
}