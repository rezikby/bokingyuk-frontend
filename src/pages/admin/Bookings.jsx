import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetBookingsApi, adminCancelBookingApi,
  adminConfirmPaymentApi, adminCheckInApi,
} from '../../api/booking';
import { adminGetFieldsApi } from '../../api/field';
import AdminLayout from '../../components/layout/AdminLayout';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Search, Filter, XCircle, CheckCircle, RefreshCw,
  Bell, Volume2, VolumeX, X, Calendar, CreditCard, Zap,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';
import { useBooking } from '../../contexts/BookingContext';

const STATUSES       = ['', 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'];
const POLL_INTERVAL  = 10_000;
const PAGE_SIZE      = 10;
const NOTIF_DURATION = 8_000;

// ─── AudioContext singleton ───────────────────────────────────────────────────
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

function playSound(type = 'booking') {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeList(raw) {
  if (Array.isArray(raw))             return raw;
  if (Array.isArray(raw?.data))       return raw.data;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}
function isTimeToCheckIn(b) {
  try { return new Date() >= new Date(`${b.booking_date}T${b.start_time}`); }
  catch { return false; }
}

// ─── Toast styles ─────────────────────────────────────────────────────────────
const TS = {
  payment: { wrap: 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700', icon: 'bg-green-500 text-white', title: 'text-green-800 dark:text-green-200', msg: 'text-green-600 dark:text-green-300', bar: 'bg-green-500', cnt: 'text-green-500' },
  checkin: { wrap: 'bg-purple-50 dark:bg-purple-900/90 border-purple-200 dark:border-purple-700', icon: 'bg-purple-500 text-white', title: 'text-purple-800 dark:text-purple-200', msg: 'text-purple-600 dark:text-purple-300', bar: 'bg-purple-500', cnt: 'text-purple-500' },
  booking: { wrap: 'bg-blue-50 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700', icon: 'bg-blue-500 text-white', title: 'text-blue-800 dark:text-blue-200', msg: 'text-blue-600 dark:text-blue-300', bar: 'bg-blue-500', cnt: 'text-blue-500' },
};
const TI = { payment: <CreditCard size={18} />, checkin: <Zap size={18} />, booking: <Calendar size={18} /> };

// ─── NotificationToast ────────────────────────────────────────────────────────
function NotificationToast({ notif, onClose }) {
  const [progress,  setProgress]  = useState(100);
  const [countdown, setCountdown] = useState(Math.ceil(NOTIF_DURATION / 1000));
  const startRef = useRef(Date.now());
  const rafRef   = useRef(null);

  useEffect(() => {
    const tick = () => {
      const elapsed   = Date.now() - startRef.current;
      const remaining = Math.max(0, NOTIF_DURATION - elapsed);
      setProgress((remaining / NOTIF_DURATION) * 100);
      setCountdown(Math.ceil(remaining / 1000));
      if (remaining <= 0) { onClose(notif.id); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const s = TS[notif.type] || TS.booking;
  return (
    <div
      className={`relative flex items-start gap-3 p-4 pr-10 rounded-2xl shadow-2xl border backdrop-blur-sm w-80 overflow-hidden ${s.wrap}`}
      style={{ animation: 'toastIn .35s cubic-bezier(.34,1.56,.64,1) forwards' }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.icon}`}>
        {TI[notif.type] || TI.booking}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm font-bold leading-snug ${s.title}`}>{notif.title}</p>
        <p className={`text-xs mt-0.5 ${s.msg}`}>{notif.message}</p>
        {notif.time && <p className="text-xs text-gray-400 mt-1">{notif.time}</p>}
      </div>
      <span className={`absolute top-3 right-8 text-[10px] font-bold tabular-nums ${s.cnt}`}>{countdown}s</span>
      <button onClick={() => onClose(notif.id)} className="absolute top-3 right-3 p-0.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
        <X size={14} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div className={`h-full ${s.bar}`} style={{ width: `${progress}%`, transition: 'none' }} />
      </div>
    </div>
  );
}

// ─── NotificationStack ────────────────────────────────────────────────────────
function NotificationStack({ notifications = [], onDismiss, onDismissAll }) {
  if (!notifications.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 items-end pointer-events-none">
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(90px) scale(.88)}to{opacity:1;transform:translateX(0) scale(1)}}`}</style>
      {notifications.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast notif={n} onClose={onDismiss} />
        </div>
      ))}
      {notifications.length > 1 && (
        <button onClick={onDismissAll} className="pointer-events-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline mt-1">
          Tutup semua ({notifications.length})
        </button>
      )}
    </div>
  );
}

// ─── LiveIndicator ────────────────────────────────────────────────────────────
function LiveIndicator({ isFetching, lastUpdate, soundEnabled, onToggleSound }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inset-0 rounded-full bg-green-400 opacity-75 ${isFetching ? 'animate-ping' : ''}`} />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-semibold text-green-700 dark:text-green-400">LIVE</span>
      </div>
      {lastUpdate && <span className="text-xs text-gray-400 hidden sm:block">{lastUpdate}</span>}
      <button onClick={onToggleSound} title={soundEnabled ? 'Matikan suara' : 'Aktifkan suara'}
        className={`p-1.5 rounded-lg border transition-colors ${soundEnabled
          ? 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      >
        {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('force-refresh-bookings'))}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs transition-colors"
      >
        <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;
  const s = (currentPage - 1) * PAGE_SIZE + 1;
  const e = Math.min(currentPage * PAGE_SIZE, totalItems);
  const pages = (() => {
    const d = 2, mid = [];
    for (let i = Math.max(2, currentPage - d); i <= Math.min(totalPages - 1, currentPage + d); i++) mid.push(i);
    const r = currentPage - d > 2 ? [1, '...'] : [1];
    r.push(...mid);
    if (currentPage + d < totalPages - 1) r.push('...', totalPages);
    else if (totalPages > 1) r.push(totalPages);
    return r;
  })();
  const nb = 'p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{s}–{e}</span> dari <span className="font-semibold text-gray-700 dark:text-gray-300">{totalItems}</span> booking
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={nb}><ChevronsLeft size={14} /></button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={nb}><ChevronLeft size={14} /></button>
        {pages.map((p, i) => p === '...'
          ? <span key={`d${i}`} className="px-2 text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium border transition-colors ${currentPage === p ? 'bg-indigo-600 text-white border-primary-600 shadow-sm' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >{p}</button>
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={nb}><ChevronRight size={14} /></button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={nb}><ChevronsRight size={14} /></button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminBookings() {
  const queryClient     = useQueryClient();
  const { clearUnread } = useBooking();

  const [filters,       setFilters]       = useState({ status: '', field_id: '', date: '', search: '' });
  const [currentPage,   setCurrentPage]   = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [soundEnabled,  setSoundEnabled]  = useState(true);

  const soundEnabledRef  = useRef(true);
  const prevBookingsRef  = useRef(null);
  const isFirstFetchRef  = useRef(true);
  const filterChangeRef  = useRef(false);
  const autoCheckedInRef = useRef(new Set());

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundEnabledRef.current = !prev;
      return !prev;
    });
  }, []);

  // Clear badge saat masuk halaman
  useEffect(() => { clearUnread(); }, [clearUnread]);

  // Reset auto-checkin set tengah malam
  useEffect(() => {
    const now = new Date();
    const ms  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const t   = setTimeout(() => { autoCheckedInRef.current = new Set(); }, ms);
    return () => clearTimeout(t);
  }, []);

  // Force-refresh dari event global
  useEffect(() => {
    const h = () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    window.addEventListener('force-refresh-bookings', h);
    return () => window.removeEventListener('force-refresh-bookings', h);
  }, [queryClient]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: rawData, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn:  () => adminGetBookingsApi(filters).then(r => r.data),
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const { data: rawFields } = useQuery({
    queryKey: ['admin-fields'],
    queryFn:  () => adminGetFieldsApi().then(r => r.data),
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const applyOptimisticCheckIn = useCallback((qrToken) => {
    queryClient.setQueriesData({ queryKey: ['admin-bookings'] }, old => {
      if (!old) return old;
      const patch = list => Array.isArray(list)
        ? list.map(b => b.qr_token === qrToken ? { ...b, status: 'checked_in' } : b)
        : list;
      if (Array.isArray(old))             return patch(old);
      if (Array.isArray(old?.data))       return { ...old, data: patch(old.data) };
      if (Array.isArray(old?.data?.data)) return { ...old, data: { ...old.data, data: patch(old.data.data) } };
      return old;
    });
  }, [queryClient]);

  const autoCheckInMutation = useMutation({
    mutationFn: adminCheckInApi,
    onSuccess: (res, qrToken) => {
      const code = res.data?.data?.booking_code || qrToken;
      applyOptimisticCheckIn(qrToken);
      toast.success(`⚡ Auto Check-In: ${code}`, { duration: 4000 });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }), 1000);
    },
    onError: (_, qrToken) => { autoCheckedInRef.current.delete(qrToken); },
  });

  const cancelMutation = useMutation({
    mutationFn: adminCancelBookingApi,
    onSuccess: () => { toast.success('Booking dibatalkan'); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }); },
    onError: err => toast.error(err.response?.data?.message || 'Gagal'),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: adminConfirmPaymentApi,
    onSuccess: () => { toast.success('✅ Pembayaran dikonfirmasi!'); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }); },
    onError: err => toast.error(err.response?.data?.message || 'Gagal konfirmasi'),
  });

  const setFilter = useCallback((key, value) => {
    filterChangeRef.current = true;
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  // ── CORE: deteksi perubahan data → toast + suara ──────────────────────────
  useEffect(() => {
    const bookings = normalizeList(rawData);
    if (!bookings.length) return;

    // Auto check-in
    bookings.forEach(b => {
      if (
        b.status === 'confirmed' &&
        b.payment_status === 'paid' &&
        b.qr_token &&
        !autoCheckedInRef.current.has(b.qr_token) &&
        isTimeToCheckIn(b)
      ) {
        autoCheckedInRef.current.add(b.qr_token);
        autoCheckInMutation.mutate(b.qr_token);
        const notif = {
          id:      `checkin-auto-${b.id}-${Date.now()}`,
          type:    'checkin',
          title:   '⚡ Auto Check-In!',
          message: `${b.booking_code} · ${b.user?.name} · ${b.field?.name}`,
          time:    new Date().toLocaleTimeString('id-ID'),
        };
        setNotifications(prev => [notif, ...prev].slice(0, 10));
        if (soundEnabledRef.current) playSound('checkin');
      }
    });

    // Load pertama / filter baru → init snapshot saja, jangan notif
    if (isFirstFetchRef.current || filterChangeRef.current) {
      isFirstFetchRef.current = false;
      filterChangeRef.current = false;
      prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
      return;
    }

    if (!prevBookingsRef.current) {
      prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
      return;
    }

    // Diff: cari booking baru & pembayaran masuk
    const prevMap   = new Map(prevBookingsRef.current.map(b => [b.id, b]));
    const newNotifs = [];

    bookings.forEach(b => {
      const prev = prevMap.get(b.id);
      if (!prev) {
        newNotifs.push({
          id:      `booking-${b.id}-${Date.now()}`,
          type:    'booking',
          title:   '📋 Booking Baru!',
          message: `${b.booking_code} · ${b.user?.name} · ${b.field?.name}`,
          time:    new Date().toLocaleTimeString('id-ID'),
        });
      } else if (prev.payment_status !== 'paid' && b.payment_status === 'paid') {
        newNotifs.push({
          id:      `payment-${b.id}-${Date.now()}`,
          type:    'payment',
          title:   '💰 Pembayaran Diterima!',
          message: `${b.booking_code} · ${b.user?.name} · ${b.total_formatted || formatPrice(b.total_price)}`,
          time:    new Date().toLocaleTimeString('id-ID'),
        });
      }
    });

    if (newNotifs.length > 0) {
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 10));
      if (soundEnabledRef.current) {
        playSound(newNotifs.some(n => n.type === 'payment') ? 'payment' : 'booking');
      }
    }

    prevBookingsRef.current = bookings.map(({ id, payment_status, status }) => ({ id, payment_status, status }));
  }, [rawData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const allBookings   = normalizeList(rawData);
  const fields        = normalizeList(rawFields);
  const totalItems    = allBookings.length;
  const totalPages    = Math.ceil(totalItems / PAGE_SIZE);
  const pagedBookings = allBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const lastUpdate    = dataUpdatedAt ? `Update: ${new Date(dataUpdatedAt).toLocaleTimeString('id-ID')}` : null;

  const dismissNotif = useCallback((id) => setNotifications(prev => prev.filter(n => n.id !== id)), []);
  const dismissAll   = useCallback(() => setNotifications([]), []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <NotificationStack notifications={notifications} onDismiss={dismissNotif} onDismissAll={dismissAll} />

      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Manajemen Booking</h1>
          <LiveIndicator
            isFetching={isFetching}
            lastUpdate={lastUpdate}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        </div>

        {/* Banner notifikasi aktif */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Bell size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex-1">
              <span className="font-bold">{notifications.length}</span> notifikasi aktif
              {notifications.filter(n => n.type === 'booking').length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 ml-2">
                  · {notifications.filter(n => n.type === 'booking').length} booking baru
                </span>
              )}
              {notifications.filter(n => n.type === 'payment').length > 0 && (
                <span className="text-green-600 dark:text-green-400 ml-2">
                  · {notifications.filter(n => n.type === 'payment').length} pembayaran
                </span>
              )}
              {notifications.filter(n => n.type === 'checkin').length > 0 && (
                <span className="text-purple-600 dark:text-purple-400 ml-2">
                  · {notifications.filter(n => n.type === 'checkin').length} auto check-in
                </span>
              )}
            </p>
            <button onClick={dismissAll} className="text-xs text-amber-500 hover:text-amber-700 underline shrink-0">
              Tutup semua
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Cari kode / nama..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STATUSES.map(s => <option key={s} value={s}>{s || 'Semua Status'}</option>)}
          </select>
          <select value={filters.field_id} onChange={e => setFilter('field_id', e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Semua Lapangan</option>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="relative">
            <input type="date" value={filters.date} onChange={e => setFilter('date', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
            />
            {filters.date && (
              <button onClick={() => setFilter('date', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabel */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-4"><TableSkeleton rows={10} cols={10} /></div>
          ) : allBookings.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Filter size={36} className="mx-auto mb-2 opacity-40" />
              <p>Tidak ada booking ditemukan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                    <tr>
                      {['No', 'Kode', 'Customer', 'Lapangan', 'Tanggal', 'Waktu', 'Total', 'Status', 'Bayar', 'Aksi'].map(h => (
                        <th key={h} className="text-left py-3 px-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pagedBookings.map((b, idx) => {
                      const isNewBooking  = notifications.some(n => n.id.startsWith(`booking-${b.id}-`));
                      const isNewlyPaid   = notifications.some(n => n.id.startsWith(`payment-${b.id}-`));
                      const isAutoCheckin = notifications.some(n => n.id.startsWith(`checkin-auto-${b.id}-`));
                      const rowNo         = (currentPage - 1) * PAGE_SIZE + idx + 1;

                      return (
                        <tr
                          key={b.id}
                          className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            isAutoCheckin ? 'bg-purple-50/70 dark:bg-purple-900/10' :
                            isNewlyPaid   ? 'bg-green-50/70 dark:bg-green-900/10'   :
                            isNewBooking  ? 'bg-blue-50/70 dark:bg-blue-900/10'     : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-gray-400 text-xs">{rowNo}</td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-xs">{b.booking_code}</span>
                              {isNewBooking && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700">
                                  NEW
                                </span>
                              )}
                              {isNewlyPaid && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300 ring-1 ring-green-300 dark:ring-green-700">
                                  PAID
                                </span>
                              )}
                              {isAutoCheckin && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700">
                                  AUTO ⚡
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <p className="font-medium">{b.user?.name}</p>
                            <p className="text-xs text-gray-400">{b.user?.phone}</p>
                          </td>
                          <td className="py-2.5 px-3">{b.field?.name}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{formatDate(b.booking_date)}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{formatTime(b.start_time)}–{formatTime(b.end_time)}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold">{b.total_formatted || formatPrice(b.total_price)}</td>
                          <td className="py-2.5 px-3"><Badge status={b.status} /></td>
                          <td className="py-2.5 px-3"><Badge status={b.payment_status} /></td>

                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1">
                              {b.payment_status !== 'paid' && !['cancelled', 'completed', 'checked_in'].includes(b.status) && (
                                <button
                                  onClick={() => { if (confirm(`Konfirmasi pembayaran ${b.booking_code}?`)) confirmPaymentMutation.mutate(b.booking_code); }}
                                  disabled={confirmPaymentMutation.isPending}
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded-lg hover:bg-green-50 disabled:opacity-50 font-medium transition-colors"
                                >
                                  <CheckCircle size={13} /> Konfirmasi Lunas
                                </button>
                              )}
                              {!['cancelled', 'completed'].includes(b.status) && (
                                <button
                                  onClick={() => { if (confirm('Batalkan booking ini?')) cancelMutation.mutate(b.booking_code); }}
                                  disabled={cancelMutation.isPending}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                                >
                                  <XCircle size={13} /> Batal
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}