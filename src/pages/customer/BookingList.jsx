// Riwayat booking customer dengan tab filter
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getBookingsApi } from '../../api/booking';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { formatDate, formatTime, formatPrice } from '../../utils/format';

const TABS = [
  { key: '', label: 'Semua' },
  { key: 'active', label: 'Aktif', statuses: ['pending','confirmed','checked_in'] },
  { key: 'completed', label: 'Selesai', statuses: ['completed'] },
  { key: 'cancelled', label: 'Dibatalkan', statuses: ['cancelled'] },
];

export default function BookingList() {
  const [tab, setTab] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookingsApi().then(r => r.data.data),
  });

  const all = data?.data || data || [];
  const filtered = tab === ''
    ? all
    : all.filter(b => TABS.find(t => t.key === tab)?.statuses?.includes(b.status));

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <CalendarDays size={24} /> Booking Saya
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2.5 px-3 text-sm font-medium transition-colors border-b-2
                ${tab === t.key ? 'border-primary-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? <TableSkeleton rows={4} cols={1} /> : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
            <p>Belum ada booking</p>
            <Link to="/" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">Booking sekarang →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(booking => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.booking_code}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <CalendarDays size={20} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold truncate">{booking.field?.name}</p>
                    <Badge status={booking.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(booking.booking_date)} · {formatTime(booking.start_time)}–{formatTime(booking.end_time)}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium text-indigo-600">{booking.total_formatted || formatPrice(booking.total_price)}</span>
                    <Badge status={booking.payment_status} />
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
