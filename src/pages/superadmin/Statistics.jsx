import { useQuery } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { BarChart3, TrendingUp, Users, Building2, CreditCard, CalendarDays } from 'lucide-react';
import api from '../../lib/axios';
import { formatPrice } from '../../utils/format';

const fetchStats = () =>
  api.get('/v1/super-admin/dashboard').then(r => r.data.data);

function StatBlock({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          {loading
            ? <Skeleton className="h-7 w-24 mt-1" />
            : <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-0.5">{value ?? 0}</p>
          }
          {sub && !loading && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-statistics'],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Statistik Global</h1>
          <p className="page-subtitle">Overview keseluruhan platform BokingYuk</p>
        </div>

        {/* User stats */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Pengguna</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBlock icon={Users}     label="Total Customer"  value={data?.total_users}       color="bg-blue-500"   loading={isLoading} />
            <StatBlock icon={Users}     label="Total Admin"     value={data?.total_admins}      color="bg-indigo-600" loading={isLoading} />
            <StatBlock icon={TrendingUp} label="User Aktif"     value={data?.active_users}      color="bg-emerald-500" loading={isLoading} sub="Bulan ini" />
            <StatBlock icon={Users}     label="User Nonaktif"   value={data?.inactive_users}    color="bg-red-500"   loading={isLoading} />
          </div>
        </div>

        {/* Platform stats */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Platform</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatBlock icon={Building2}    label="Total Lapangan"  value={data?.total_fields}   color="bg-violet-500" loading={isLoading} />
            <StatBlock icon={CalendarDays} label="Total Booking"   value={data?.total_bookings} color="bg-amber-500"  loading={isLoading} />
            <StatBlock icon={CreditCard}   label="Request Pending" value={data?.pending_admin_requests} color="bg-orange-500" loading={isLoading} sub="Menunggu approval" />
          </div>
        </div>

        {/* Summary card */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Ringkasan Sistem</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { label: 'Super Admin',       value: data?.total_super_admins     ?? 0, accent: 'text-indigo-600 dark:text-indigo-400' },
                { label: 'Admin Aktif',       value: data?.total_admins           ?? 0, accent: 'text-blue-600 dark:text-blue-400' },
                { label: 'Customer',          value: data?.total_users            ?? 0, accent: 'text-slate-700 dark:text-slate-300' },
                { label: 'Total Lapangan',    value: data?.total_fields           ?? 0, accent: 'text-violet-600 dark:text-violet-400' },
                { label: 'Total Booking',     value: data?.total_bookings         ?? 0, accent: 'text-amber-600 dark:text-amber-400' },
                { label: 'Request Pending',   value: data?.pending_admin_requests ?? 0, accent: 'text-orange-600 dark:text-orange-400' },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className={`text-sm font-bold ${accent}`}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
