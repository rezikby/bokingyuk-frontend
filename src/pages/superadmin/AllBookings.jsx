import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { formatDate, formatTime, formatPrice } from '../../utils/format';

const fetchAllBookings = (params) =>
  api.get('/v1/super-admin/bookings', { params }).then(r => r.data.data);

export default function AllBookings() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-all-bookings', search, status, page],
    queryFn: () => fetchAllBookings({ search, status, page, per_page: 15 }),
    keepPreviousData: true,
  });

  const bookings  = data?.data || [];
  const total     = data?.total || 0;
  const lastPage  = data?.last_page || 1;

  return (
    <SuperAdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Semua Booking</h1>
          <p className="page-subtitle">Seluruh data booking dari semua admin</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari kode, customer..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Semua Status</option>
            {['pending','confirmed','checked_in','completed','cancelled'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Kode Booking','Customer','Lapangan','Admin','Tanggal','Waktu','Total','Status'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="table-tr">
                      {[...Array(8)].map((__, j) => (
                        <td key={j} className="table-td"><Skeleton className="h-4 w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Belum ada data booking</p>
                    </td>
                  </tr>
                ) : bookings.map(b => (
                  <tr key={b.id} className="table-tr">
                    <td className="table-td font-mono text-xs font-medium text-indigo-600 dark:text-indigo-400">{b.booking_code}</td>
                    <td className="table-td">{b.user?.name || '-'}</td>
                    <td className="table-td">{b.field?.name || '-'}</td>
                    <td className="table-td text-slate-500">{b.field?.admin?.name || '-'}</td>
                    <td className="table-td">{b.booking_date ? formatDate(b.booking_date) : '-'}</td>
                    <td className="table-td">{b.start_time ? `${formatTime(b.start_time)}–${formatTime(b.end_time)}` : '-'}</td>
                    <td className="table-td font-medium">{formatPrice(b.total_price || 0)}</td>
                    <td className="table-td"><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">Total {total} booking</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 text-xs text-slate-600 dark:text-slate-400">
                  {page} / {lastPage}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
