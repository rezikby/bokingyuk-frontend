import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClipboardList, LogIn, LogOut, BookOpen, UserCog,
  ShieldCheck, MessageSquareWarning, RefreshCw, ChevronLeft, ChevronRight, Home,
} from 'lucide-react';
import api from '../../lib/axios'; 

// ── icon & warna per tipe aktivitas ──────────────────────────────────────────
const ACTIVITY_META = {
  login:           { icon: LogIn,                   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',  label: 'Login'            },
  logout:          { icon: LogOut,                  color: 'text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',      label: 'Logout'           },
  booking_create:  { icon: BookOpen,                color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    label: 'Buat Booking'     },
  booking_cancel:  { icon: BookOpen,                color: 'text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20',label: 'Batal Booking'    },
  profile_update:  { icon: UserCog,                 color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20',label: 'Update Profil'    },
  pengajuan_admin: { icon: ShieldCheck,             color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20',label: 'Pengajuan Admin'  },
  pengaduan:       { icon: MessageSquareWarning,    color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20',label: 'Pengaduan'        },
  default:         { icon: ClipboardList,           color: 'text-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800',       label: 'Aktivitas'        },
};

function getMeta(type) {
  return ACTIVITY_META[type] ?? ACTIVITY_META.default;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

const PER_PAGE = 10;

export default function LogAktivitas() {
  const { user } = useAuth();
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState('semua');

  const fetchLogs = async (currentPage = 1, type = 'semua') => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        per_page: PER_PAGE,
        ...(type !== 'semua' && { type }),
      };
      const res = await api.get('/v1/user/activity-logs', { params });
      // Sesuaikan dengan struktur response API kamu:
      // { data: [...], total: 50 }  ATAU  { logs: [...], meta: { total } }
      const data  = res.data?.data  ?? res.data?.logs  ?? [];
      const count = res.data?.total ?? res.data?.meta?.total ?? data.length;
      setLogs(data);
      setTotal(count);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, filter);
  }, [page, filter]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const handleFilter = (val) => {
    setFilter(val);
    setPage(1);
  };

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  const FILTERS = [
    { value: 'semua',           label: 'Semua'           },
    { value: 'login',           label: 'Login/Logout'    },
    { value: 'booking_create',  label: 'Booking'         },
    { value: 'profile_update',  label: 'Profil'          },
    { value: 'pengajuan_admin', label: 'Pengajuan Admin' },
    { value: 'pengaduan',       label: 'Pengaduan'       },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] py-8 px-4 pb-20 md:pb-0">
      <div className="max-w-3xl mx-auto">

        {/* Kembali ke Beranda */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke Beranda
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ClipboardList size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Log Aktivitas</h1>
              <p className="text-xs text-gray-400">Riwayat aktivitas akun kamu</p>
            </div>
          </div>
          <button
            onClick={() => fetchLogs(page, filter)}
            className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Memuat aktivitas...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <ClipboardList size={22} className="text-red-400" />
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={() => fetchLogs(page, filter)}
                className="text-xs text-purple-600 underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ClipboardList size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">Belum ada aktivitas tercatat.</p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.map((log, i) => {
                const meta = getMeta(log.type ?? log.activity_type);
                const Icon = meta.icon;
                return (
                  <li key={log.id ?? i} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Icon */}
                    <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                      <Icon size={17} className={meta.color} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {log.description ?? meta.label}
                      </p>
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-0.5">IP: {log.ip_address}</p>
                      )}
                      {log.device && (
                        <p className="text-xs text-gray-400">{log.device}</p>
                      )}
                    </div>

                    {/* Tanggal */}
                    <span className="text-xs text-gray-400 whitespace-nowrap mt-0.5 flex-shrink-0">
                      {formatDate(log.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-xs text-gray-400">
              Halaman {page} dari {totalPages} &nbsp;·&nbsp; {total} aktivitas
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}