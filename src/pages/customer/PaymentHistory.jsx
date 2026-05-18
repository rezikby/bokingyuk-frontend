// Riwayat Pembayaran (Customer) — auto-refresh + search fix
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPaymentHistoryApi } from '../../api/paymentHistory';
import Navbar from '../../components/layout/Navbar';
import { Skeleton } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { formatDate, formatPrice } from '../../utils/format';
import { CreditCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaymentHistory() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  // FIX #4: tambah refetchInterval 15 detik agar data pembayaran langsung tampil
  const { data, isLoading } = useQuery({
    queryKey: ['payment-history', page, search],
    queryFn: () => getPaymentHistoryApi({ page, per_page: 15, search }).then(r => r.data),
    keepPreviousData: true,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const histories = data?.data || [];
  const meta      = data?.meta || {};

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50 dark:bg-[#0F172A]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard size={22} className="text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Riwayat Pembayaran</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kode booking..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-white dark:bg-[#111827] dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : histories.length === 0 ? (
          <div className="card p-10 text-center text-gray-400 dark:text-gray-600">
            <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
            <p>{search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada riwayat pembayaran'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {histories.map(h => (
              <div key={h.id} className="card p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400 truncate">{h.booking_code}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{h.field_name || h.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.created_at)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(h.amount)}</p>
                  <Badge status={h.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">Halaman {page} / {meta.last_page}</span>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="p-2 rounded-lg border dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}