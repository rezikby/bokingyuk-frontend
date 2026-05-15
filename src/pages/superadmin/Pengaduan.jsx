import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Search, ChevronDown, Eye, CheckCircle2, XCircle, Loader2, Trash2,
  Paperclip, Tag, FileText, ExternalLink, Bell, X, ChevronLeft, ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import api from '../../lib/axios';

const fetchPengaduan      = (params) => api.get('/v1/super-admin/pengaduan', { params }).then((r) => r.data.data);
const updateStatus        = ({ id, status }) => api.patch(`/v1/super-admin/pengaduan/${id}`, { status }).then((r) => r.data);
const deletePengaduan     = (id) => api.delete(`/v1/super-admin/pengaduan/${id}`).then((r) => r.data);
const bulkDeletePengaduan = (ids) => api.post('/v1/super-admin/pengaduan/bulk-delete', { ids }).then((r) => r.data);

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '')
  ?? import.meta.env.VITE_BACKEND_URL
  ?? 'http://localhost:8000';

const buildLampiranUrl = (raw) => {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${BACKEND_URL}/storage/${raw.replace(/^\/?( storage\/)?/, '')}`;
};

const PAGE_SIZE = 10;

const STATUS_CFG = {
  pending: { label: 'Pending',  className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  proses:  { label: 'Diproses', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  selesai: { label: 'Selesai',  className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ditolak: { label: 'Ditolak',  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  } catch (_) {}
}

const NOTIF_DURATION = 10_000;

function NotificationToast({ notif, onClose }) {
  const [countdown, setCountdown] = useState(NOTIF_DURATION / 1000);
  const [progress, setProgress]   = useState(100);
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

  return (
    <div
      className="relative flex items-start gap-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-5 pr-12 w-96 overflow-hidden"
      style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 shrink-0">
        <Bell size={20} className="text-purple-600 dark:text-purple-400" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-snug">Pengaduan Baru!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notif.message}</p>
      </div>
      <span className="absolute top-4 right-9 text-xs font-bold text-purple-500 tabular-nums">{countdown}s</span>
      <button onClick={() => onClose(notif.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-300 hover:text-gray-500 transition-colors">
        <X size={15} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-b-2xl overflow-hidden">
        <div className="h-full bg-purple-500 transition-none rounded-b-2xl" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function NotificationStack({ notifications, onClose }) {
  if (notifications.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(80px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
      {notifications.map((n) => (
        <NotificationToast key={n.id} notif={n} onClose={onClose} />
      ))}
    </div>
  );
}

function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const push = useCallback((message) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message }]);
    playNotifSound();
  }, []);
  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);
  return { notifications, push, remove };
}

function ConfirmDeleteModal({ item, onClose, onConfirm, deleting }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
          <Trash2 size={22} className="text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Hapus Pengaduan?</h3>
          <p className="text-sm text-gray-500 mt-1">
            Pengaduan dari <span className="font-medium text-gray-700 dark:text-gray-300">{item.user?.name}</span> akan dihapus permanen.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
            Batal
          </button>
          <button
            onClick={() => onConfirm(item.id)}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmBulkDeleteModal({ count, onClose, onConfirm, deleting }) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Hapus {count} Pengaduan?</h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-medium text-red-600">{count} pengaduan</span> yang dipilih akan dihapus permanen.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Hapus Semua
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose, onUpdateStatus, saving }) {
  if (!item) return null;
  const lampiranUrl  = buildLampiranUrl(item.lampiran_url ?? item.lampiran ?? null);
  const isImage      = lampiranUrl && /\.(png|jpe?g|gif|webp)$/i.test(lampiranUrl);
  const isPdf        = lampiranUrl && /\.pdf$/i.test(lampiranUrl);
  const lampiranName = lampiranUrl ? lampiranUrl.split('/').pop() : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg leading-snug">{item.judul ?? item.subject ?? 'Detail Pengaduan'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{item.id}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="text-sm space-y-2.5 border-t border-b border-gray-100 dark:border-slate-800 py-4">
          {[
            { label: 'Pelapor', value: item.user?.name ?? '-' },
            { label: 'Email',   value: item.user?.email ?? '-' },
            { label: 'No. HP',  value: item.user?.phone ?? '-' },
            { label: 'Tanggal', value: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {item.kategori && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <Tag size={15} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Kategori</p>
                <p className="text-sm font-medium">{item.kategori}</p>
              </div>
            </div>
          )}
          {(item.judul ?? item.subject) && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <FileText size={15} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Judul Pengaduan</p>
                <p className="text-sm font-medium">{item.judul ?? item.subject}</p>
              </div>
            </div>
          )}
          {lampiranUrl ? (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <Paperclip size={15} className="text-purple-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-2">Lampiran</p>
                {isImage && (
                  <a href={lampiranUrl} target="_blank" rel="noreferrer" className="block mb-2">
                    <img src={lampiranUrl} alt="Lampiran" className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-700 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                  </a>
                )}
                <a href={lampiranUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium underline underline-offset-2 transition-colors">
                  <ExternalLink size={13} />
                  {isPdf ? 'Buka PDF' : isImage ? 'Lihat ukuran penuh' : lampiranName ?? 'Lihat lampiran'}
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400">
              <Paperclip size={15} className="shrink-0" />
              <p className="text-xs">Tidak ada lampiran</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          {item.status !== 'selesai' && (
            <button
              onClick={() => onUpdateStatus(item.id, 'selesai')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              Tandai Selesai
            </button>
          )}
          {item.status !== 'ditolak' && item.status !== 'selesai' && (
            <button
              onClick={() => onUpdateStatus(item.id, 'ditolak')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 text-sm font-medium transition-colors disabled:opacity-60"
            >
              <XCircle size={15} /> Tolak
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end   = Math.min(currentPage * PAGE_SIZE, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-800">
      <p className="text-xs text-gray-500">
        Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{start}–{end}</span> dari <span className="font-semibold text-gray-700 dark:text-gray-300">{totalItems}</span> pengaduan
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                currentPage === page
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function PengaduanSuperAdmin() {
  const qc = useQueryClient();
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected]         = useState(null);
  const [toDelete, setToDelete]         = useState(null);
  const [lastUpdated, setLastUpdated]   = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const prevCountRef    = useRef(null);
  const isFirstFetchRef = useRef(true);
  const { notifications, push: pushNotif, remove: removeNotif } = useNotifications();

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-pengaduan', search, statusFilter],
    queryFn: () => fetchPengaduan({ search, status: statusFilter }),
    keepPreviousData: true,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, statusFilter]);

  useEffect(() => {
    if (!data) return;
    setLastUpdated(new Date());
    const items = Array.isArray(data) ? data : [];
    const count = items.length;
    if (isFirstFetchRef.current) {
      isFirstFetchRef.current = false;
      prevCountRef.current = count;
      return;
    }
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      const diff = count - prevCountRef.current;
      pushNotif(diff === 1 ? 'Ada 1 pengaduan baru masuk!' : `Ada ${diff} pengaduan baru masuk!`);
    }
    prevCountRef.current = count;
  }, [data, pushNotif]);

  const { mutate: changeStatus, isPending: saving } = useMutation({
    mutationFn: updateStatus,
    onSuccess: () => {
      qc.invalidateQueries(['super-admin-pengaduan']);
      setSelected(null);
    },
  });

  const { mutate: hapus, isPending: deleting } = useMutation({
    mutationFn: deletePengaduan,
    onSuccess: () => {
      qc.invalidateQueries(['super-admin-pengaduan']);
      setToDelete(null);
    },
  });

  const { mutate: bulkHapus, isPending: bulkDeleting } = useMutation({
    mutationFn: bulkDeletePengaduan,
    onSuccess: () => {
      qc.invalidateQueries(['super-admin-pengaduan']);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
    },
  });

  const allList    = Array.isArray(data) ? data : [];
  const totalItems = allList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageItems  = allList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageIds       = pageItems.map((i) => i.id);
  const allOnPageSel  = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSel = pageIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSel) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds(new Set());
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pengaduan</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola semua pengaduan dari user</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block self-center">
              Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, atau email..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-9 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="proses">Diproses</option>
              <option value="selesai">Selesai</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              {selectedIds.size} pengaduan dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Batalkan
              </button>
              <button
                onClick={() => setShowBulkConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
              >
                <Trash2 size={13} />
                Hapus {selectedIds.size} Data
              </button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800">
                  <th className="px-4 py-3 pl-6 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSel}
                      ref={(el) => { if (el) el.indeterminate = someOnPageSel && !allOnPageSel; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                  </th>
                  {['PELAPOR', 'EMAIL', 'SUBJEK', 'STATUS', 'TANGGAL', 'AKSI'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 tracking-wide px-4 py-3 last:pr-6">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {isLoading ? (
                  [...Array(PAGE_SIZE)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="px-4 py-3 first:pl-6 last:pr-6">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-12">
                      Tidak ada pengaduan ditemukan
                    </td>
                  </tr>
                ) : pageItems.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${isChecked ? 'bg-purple-50/60 dark:bg-purple-900/10' : ''}`}
                    >
                      <td className="px-4 py-3 pl-6">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(item.id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(item.user?.name ?? '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium">{item.user?.name ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.user?.email ?? '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(item)}
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:hover:text-purple-400 font-medium transition-colors"
                        >
                          <Eye size={11} />
                          {item.judul ?? item.subject ?? 'Lihat'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 pr-6">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            title="Lihat detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setToDelete(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && totalItems > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <DetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onUpdateStatus={(id, status) => changeStatus({ id, status })}
        saving={saving}
      />

      <ConfirmDeleteModal
        item={toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={(id) => hapus(id)}
        deleting={deleting}
      />

      {showBulkConfirm && (
        <ConfirmBulkDeleteModal
          count={selectedIds.size}
          onClose={() => setShowBulkConfirm(false)}
          onConfirm={() => bulkHapus([...selectedIds])}
          deleting={bulkDeleting}
        />
      )}

      <NotificationStack notifications={notifications} onClose={removeNotif} />
    </SuperAdminLayout>
  );
}
