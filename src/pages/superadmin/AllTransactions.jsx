import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import { formatDate, formatPrice } from '../../utils/format';

const fetchAllTransactions = (params) =>
  api.get('/v1/super-admin/transactions', { params }).then(r => r.data.data);

const statusBadge = {
  paid:     'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30',
  unpaid:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
  expired:  'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30',
  refunded: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

export default function AllTransactions() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-all-transactions', search, status, page],
    queryFn: () => fetchAllTransactions({ search, status, page, per_page: 15 }),
    keepPreviousData: true,
  });

  const transactions = data?.data || [];
  const total        = data?.total || 0;
  const lastPage     = data?.last_page || 1;

  return (
    <SuperAdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Semua Transaksi</h1>
          <p className="page-subtitle">Riwayat pembayaran seluruh platform</p>
        </div>

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
            {['paid','unpaid','expired','refunded'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['ID Transaksi','Booking','Customer','Admin','Metode','Jumlah','Tanggal','Status'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="table-tr">
                      {[...Array(8)].map((__, j) => (
                        <td key={j} className="table-td"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400">
                      <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Belum ada data transaksi</p>
                    </td>
                  </tr>
                ) : transactions.map(t => (
                  <tr key={t.id} className="table-tr">
                    <td className="table-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{t.transaction_code || t.id}</td>
                    <td className="table-td font-mono text-xs">{t.booking?.booking_code || '-'}</td>
                    <td className="table-td">{t.user?.name || t.booking?.user?.name || '-'}</td>
                    <td className="table-td text-slate-500">{t.booking?.field?.admin?.name || '-'}</td>
                    <td className="table-td capitalize">{t.payment_method || '-'}</td>
                    <td className="table-td font-semibold">{formatPrice(t.amount || 0)}</td>
                    <td className="table-td">{t.created_at ? formatDate(t.created_at) : '-'}</td>
                    <td className="table-td">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[t.status] || statusBadge.unpaid}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">Total {total} transaksi</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 text-xs text-slate-600 dark:text-slate-400">{page} / {lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
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
