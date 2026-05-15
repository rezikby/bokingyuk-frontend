import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGetBookingsApi } from '../api/booking';

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
      // booking
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
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [newEvents,     setNewEvents]     = useState([]);
  // soundEnabled state + ref (ref agar tidak stale di closure)
  const [soundEnabled,  setSoundEnabled]  = useState(true);
  const soundEnabledRef = useRef(true);

  const prevBookingsRef = useRef(null);
  const isFirstFetchRef = useRef(true);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundEnabledRef.current = !prev;
      return !prev;
    });
  }, []);

  const { data: rawData } = useQuery({
    queryKey: ['admin-bookings-global'],
    queryFn:  () => adminGetBookingsApi({}).then(r => r.data),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    const bookings = normalizeList(rawData);
    if (!bookings.length) return;

    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
      return;
    }

    if (!prevBookingsRef.current) {
      prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
      return;
    }

    const prevMap   = new Map(prevBookingsRef.current.map(b => [b.id, b]));
    const newNotifs = [];

    bookings.forEach(b => {
      const prev = prevMap.get(b.id);
      if (!prev) {
        newNotifs.push({
          id:        `booking-${b.id}-${Date.now()}`,
          type:      'booking',
          title:     '📋 Booking Baru!',
          message:   `${b.booking_code} · ${b.user?.name}`,
          time:      new Date().toLocaleTimeString('id-ID'),
          bookingId: b.id,
        });
      } else if (prev.payment_status !== 'paid' && b.payment_status === 'paid') {
        newNotifs.push({
          id:        `payment-${b.id}-${Date.now()}`,
          type:      'payment',
          title:     '💰 Pembayaran Diterima!',
          message:   `${b.booking_code} · ${b.user?.name}`,
          time:      new Date().toLocaleTimeString('id-ID'),
          bookingId: b.id,
        });
      }
    });

    if (newNotifs.length > 0) {
      setUnreadCount(prev => prev + newNotifs.length);
      setNewEvents(prev => [...prev, ...newNotifs]);

      // Putar suara dari context (berlaku di semua halaman, tidak hanya /admin/bookings)
      if (soundEnabledRef.current) {
        playSound(newNotifs.some(n => n.type === 'payment') ? 'payment' : 'booking');
      }

      // Browser notification (background)
      if (Notification.permission === 'granted') {
        newNotifs.forEach(n =>
          new Notification(n.title, { body: n.message, icon: '/favicon.ico', tag: n.id })
        );
      }
    }

    prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
  }, [rawData]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearUnread   = useCallback(() => setUnreadCount(0), []);
  const consumeEvents = useCallback(() => setNewEvents([]), []);

  // Backward-compat stubs
  const notifications = [];
  const removeNotif   = useCallback(() => {}, []);

  return (
    <BookingContext.Provider value={{
      unreadCount,
      clearUnread,
      newEvents,
      consumeEvents,
      soundEnabled,
      toggleSound: handleToggleSound,
      notifications,
      removeNotif,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) return {
    unreadCount:  0,
    clearUnread:  () => {},
    newEvents:    [],
    consumeEvents: () => {},
    soundEnabled: true,
    toggleSound:  () => {},
    notifications: [],
    removeNotif:  () => {},
  };
  return ctx;
}