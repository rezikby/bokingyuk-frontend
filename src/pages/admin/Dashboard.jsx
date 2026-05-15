// Admin Dashboard: summary stats
import { useQuery } from '@tanstack/react-query';
import { adminGetBookingsApi } from '../../api/booking';
import AdminLayout from '../../components/layout/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { CalendarDays, TrendingUp, Clock } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import api from '../../lib/axios';

/**
 * Tanggal hari ini berdasarkan timezone LOKAL (bukan UTC).
 */
function getLocalToday() {
  const d    = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        {loading
          ? <Skeleton className="h-7 w-20 mt-1" />
          : <p className="text-2xl font-bold">{value}</p>
        }
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = getLocalToday();

  // Revenue bulan ini dari endpoint dashboard
  const { data: dashData, isLoading: loadDash } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/v1/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  // Total booking hari ini
  const { data: todayData, isLoading: loadToday } = useQuery({
    queryKey: ['admin-bookings-today', today],
    queryFn: () =>
      adminGetBookingsApi({ date: today, per_page: 1 }).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  // Total booking pending
  const { data: pendingData, isLoading: loadPending } = useQuery({
    queryKey: ['admin-bookings-pending'],
    queryFn: () =>
      adminGetBookingsApi({ status: 'pending', per_page: 1 }).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const todayCount   = todayData?.meta?.total   ?? 0;
  const pendingCount = pendingData?.meta?.total  ?? 0;
  const monthRevenue = dashData?.summary?.revenue_this_month ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Booking Hari Ini"
            value={todayCount}
            color="bg-indigo-600"
            loading={loadToday}
          />
          <StatCard
            icon={Clock}
            label="Menunggu Konfirmasi"
            value={pendingCount}
            color="bg-yellow-500"
            loading={loadPending}
          />
          <StatCard
            icon={TrendingUp}
            label="Revenue Bulan Ini"
            value={formatPrice(monthRevenue)}
            color="bg-emerald-600"
            loading={loadDash}
          />
        </div>

      </div>
    </AdminLayout>
  );
}