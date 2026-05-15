// Admin: Laporan revenue + prediksi jam ramai
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRevenueApi, getPredictBusyApi } from '../../api/report';
import { adminGetFieldsApi } from '../../api/field';
import AdminLayout from '../../components/layout/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { TrendingUp, BarChart2, Calendar, Activity } from 'lucide-react';
import { formatPrice } from '../../utils/format';

const getBarColor = (value, max) => {
  const ratio = value / (max || 1);
  if (ratio >= 0.7) return '#DC2626';
  if (ratio >= 0.4) return '#D97706';
  return '#16A34A';
};

function CustomTooltipRevenue({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111827] shadow-lg rounded-xl p-3 border text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-indigo-600">{formatPrice(payload[0]?.value)}</p>
    </div>
  );
}

function CustomTooltipArea({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111827] shadow-lg rounded-xl p-3 border text-sm">
      <p className="text-gray-500 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatPrice(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function Reports() {
  const today    = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];
  const [from, setFrom]       = useState(monthAgo);
  const [to, setTo]           = useState(today);
  const [fieldId, setFieldId] = useState('');

  const { data: fieldsData } = useQuery({
    queryKey: ['admin-fields'],
    queryFn: () => adminGetFieldsApi().then(r => r.data.data),
  });
  const fields = fieldsData?.data || fieldsData || [];

  const { data: revenueData, isLoading: loadRevenue } = useQuery({
    queryKey: ['revenue', from, to],
    queryFn: () => getRevenueApi({ from, to }).then(r => r.data.data),
  });

  const { data: busyData, isLoading: loadBusy } = useQuery({
    queryKey: ['busy', fieldId],
    queryFn: () => getPredictBusyApi(fieldId).then(r => r.data.data),
    enabled: !!fieldId,
  });

  const revenueChartData = Array.isArray(revenueData)
    ? revenueData.map(d => ({ date: d.date, revenue: d.total_revenue ?? d.revenue ?? 0 }))
    : Array.isArray(revenueData?.daily)
      ? revenueData.daily.map(d => ({ date: d.date, revenue: d.total_revenue ?? d.revenue ?? 0 }))
      : [];

  const areaChartData = Array.isArray(revenueData?.daily)
    ? revenueData.daily.map(d => ({
        date: (d.date ?? '').slice(5),
        revenue: d.total_revenue ?? d.revenue ?? 0,
        bookings: (d.total_bookings ?? d.bookings ?? 0) * 10000,
      }))
    : revenueChartData.map(d => ({ date: d.date.slice(5), revenue: d.revenue, bookings: 0 }));

  const rawBusy = busyData?.predictions ?? busyData ?? [];
  const busyChartData = Array.isArray(rawBusy)
    ? rawBusy.map(d => ({ hour: d.hour, count: d.total_bookings ?? d.count ?? 0 }))
    : [];

  const maxBusy      = Math.max(...busyChartData.map(d => d.count), 1);
  const totalRevenue = revenueData?.total_revenue ?? revenueChartData.reduce((s, d) => s + d.revenue, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 size={24} /> Laporan & Analitik
        </h1>

        {/* Revenue Chart */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-600" />
              <h2 className="font-semibold">Revenue Harian</h2>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-gray-400 text-sm">s/d</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalRevenue)}</p>
          </div>

          {loadRevenue ? <Skeleton className="h-64 w-full" /> : revenueChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Tidak ada data revenue</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueChartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize:11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} dot={false} activeDot={{ r:5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Area Chart — Revenue vs Booking Trend */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-sky-500" />
            <h2 className="font-semibold">Tren Revenue & Booking</h2>
          </div>

          {loadRevenue ? <Skeleton className="h-64 w-full" /> : areaChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Tidak ada data tren</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={areaChartData} margin={{ top:10, right:10, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltipArea />} />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0284c7" strokeWidth={2} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="bookings" name="Booking (x10k)" stroke="#16a34a" strokeWidth={2} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Busy Hours Chart */}
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-accent-600" />
              <h2 className="font-semibold">Prediksi Jam Ramai</h2>
            </div>
            <select
              value={fieldId}
              onChange={e => setFieldId(e.target.value)}
              className="sm:ml-auto px-3 py-1.5 rounded-xl border border-gray-300 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Pilih lapangan...</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {!fieldId ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Pilih lapangan untuk melihat prediksi jam ramai</div>
          ) : loadBusy ? <Skeleton className="h-64 w-full" /> : busyChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Tidak ada data prediksi</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> Sangat Ramai</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-600 inline-block" /> Ramai</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-600 inline-block" /> Sepi</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={busyChartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize:11 }} />
                  <YAxis tick={{ fontSize:11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Booking']} labelFormatter={l => `Jam ${l}`} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {busyChartData.map((d, i) => (
                      <Cell key={i} fill={getBarColor(d.count, maxBusy)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}