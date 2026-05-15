import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import SuperAdminLayout from "../../components/layout/SuperAdminLayout";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  Users, Shield, CalendarDays, UserCheck,
  TrendingUp, CreditCard, DollarSign, AlertTriangle,
  Server, Cpu, HardDrive, Activity, Search, Download,
  FileText, Database, RefreshCw, MessageSquareWarning,
  Globe, ChevronRight, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import api from "../../lib/axios";
import { formatPrice, statusBadgeClass, statusLabel } from "../../utils/format";

const fetchStats = () =>
  api.get("/v1/super-admin/dashboard").then((r) => r.data.data);

const fetchRecentBookings = () =>
  api.get("/v1/super-admin/bookings", { params: { per_page: 5 } }).then((r) => r.data.data?.data || []);

const fetchRecentTransactions = () =>
  api.get("/v1/super-admin/transactions", { params: { per_page: 5 } }).then((r) => r.data.data?.data || []);

const FIELD_TYPE_DATA = [
  { name: "Futsal",     value: 45, color: "#6366f1" },
  { name: "Badminton",  value: 28, color: "#22c55e" },
  { name: "Basketball", value: 15, color: "#f59e0b" },
  { name: "Tennis",     value: 12, color: "#ec4899" },
];

function StatCard({ icon: Icon, label, value, color, loading, to, trend, trendVal }) {
  const inner = (
    <div className="card p-5 flex items-center gap-4 hover:shadow-lg transition-all duration-200 group cursor-pointer">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color} shadow-sm`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-20 mt-1" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-0.5 truncate">{value ?? 0}</p>
        )}
        {trend && !loading && (
          <p className={`text-xs mt-0.5 font-medium ${trend === "up" ? "text-green-500" : "text-amber-500"}`}>
            {trendVal}
          </p>
        )}
      </div>
      {to && <ChevronRight size={16} className="text-slate-400 shrink-0 group-hover:translate-x-1 transition-transform" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function ServerStatus() {
  const metrics = [
    { label: "CPU Usage", value: 34, color: "bg-blue-500",   icon: Cpu },
    { label: "RAM Usage", value: 62, color: "bg-indigo-500", icon: Server },
    { label: "Storage",   value: 48, color: "bg-violet-500", icon: HardDrive },
    { label: "Network",   value: 23, color: "bg-green-500",  icon: Activity },
  ];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Status Server</h2>
        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Online
        </span>
      </div>
      <div className="space-y-4">
        {metrics.map(({ label, value, color, icon: Icon }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Icon size={13} />
                {label}
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { to: "/super-admin/users",            icon: Users,                label: "Kelola User",  color: "bg-blue-500",   desc: "CRUD admin & customer" },
    { to: "/super-admin/all-bookings",     icon: CalendarDays,         label: "Booking",      color: "bg-indigo-500", desc: "Semua booking" },
    { to: "/super-admin/all-transactions", icon: CreditCard,           label: "Transaksi",    color: "bg-violet-500", desc: "History bayar" },
    { to: "/super-admin/audit-log",        icon: Shield,               label: "Audit Log",    color: "bg-slate-600",  desc: "Log aktivitas" },
    { to: "/super-admin/pengaduan",        icon: MessageSquareWarning, label: "Pengaduan",    color: "bg-amber-500",  desc: "Keluhan pelanggan" },
    { to: "/super-admin/settings",         icon: Globe,                label: "Pengaturan",   color: "bg-teal-500",   desc: "Konfigurasi situs" },
  ];
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Aksi Cepat</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map(({ to, icon: Icon, label, color, desc }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-start gap-2 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
          >
            <div className={`w-7 h-7 ${color} rounded-lg flex items-center justify-center`}>
              <Icon size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{label}</p>
              <p className="text-[10px] text-slate-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-wrap">
        <Link
          to="/super-admin/all-transactions"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
        >
          <Download size={11} /> Transaksi
        </Link>
        <Link
          to="/super-admin/audit-log"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-colors"
        >
          <FileText size={11} /> Audit Log
        </Link>
        <Link
          to="/super-admin/statistics"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 transition-colors"
        >
          <Database size={11} /> Statistik
        </Link>
      </div>
    </div>
  );
}

function BookingStatusChart({ data, loading }) {
  if (loading) return <Skeleton className="h-[200px] w-full" />;
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-slate-400 text-sm">
        Belum ada data booking
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
        <Bar dataKey="value" name="Jumlah" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function FieldTypeChart() {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Distribusi Jenis Lapangan</h2>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie data={FIELD_TYPE_DATA} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
              {FIELD_TYPE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2.5">
          {FIELD_TYPE_DATA.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm text-slate-600 dark:text-slate-400">{name}</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentTransactions({ data, loading }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Transaksi Terbaru</h2>
        <Link to="/super-admin/all-transactions" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline">
          Lihat semua <ArrowRight size={11} />
        </Link>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Belum ada transaksi</div>
        ) : data.map((trx) => (
          <div key={trx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
              {(trx.booking?.user?.name || trx.user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {trx.booking?.user?.name || trx.user?.name || "-"}
              </p>
              <p className="text-xs text-slate-400 truncate">{trx.booking?.field?.name || "-"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatPrice(trx.amount || 0)}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadgeClass(trx.status)}`}>
                {statusLabel(trx.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentBookings({ data, loading }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Booking Terbaru</h2>
        <Link to="/super-admin/all-bookings" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline">
          Lihat semua <ArrowRight size={11} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
              <th className="table-th">Kode</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Lapangan</th>
              <th className="table-th">Waktu</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="table-tr">
                  {[...Array(5)].map((__, j) => (
                    <td key={j} className="table-td"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Belum ada booking</td>
              </tr>
            ) : data.map((b) => (
              <tr key={b.id} className="table-tr">
                <td className="table-td font-mono text-xs text-indigo-600">{b.booking_code}</td>
                <td className="table-td font-medium">{b.user?.name || "-"}</td>
                <td className="table-td text-slate-500">{b.field?.name || "-"}</td>
                <td className="table-td text-slate-500 text-xs">{b.start_time ? `${b.start_time}–${b.end_time}` : "-"}</td>
                <td className="table-td">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(b.status)}`}>
                    {statusLabel(b.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const { data: recentBookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["sa-dashboard-bookings"],
    queryFn: fetchRecentBookings,
    refetchInterval: 30_000,
  });

  const { data: recentTransactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["sa-dashboard-transactions"],
    queryFn: fetchRecentTransactions,
    refetchInterval: 30_000,
  });

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const statCards = useMemo(() => [
    { icon: Users,                label: "Total Customer",        value: data?.total_users?.toLocaleString("id-ID"),           color: "bg-blue-500",   to: "/super-admin/customers" },
    { icon: Shield,               label: "Total Admin",           value: data?.total_admins?.toLocaleString("id-ID"),          color: "bg-indigo-600", to: "/super-admin/users" },
    { icon: CalendarDays,         label: "Total Booking",         value: data?.total_bookings?.toLocaleString("id-ID"),        color: "bg-violet-500", to: "/super-admin/all-bookings" },
    { icon: UserCheck,            label: "User Aktif",            value: data?.active_users?.toLocaleString("id-ID"),          color: "bg-sky-500" },
    { icon: DollarSign,           label: "Total Lapangan",        value: data?.total_fields?.toLocaleString("id-ID"),          color: "bg-emerald-500" },
    { icon: TrendingUp,           label: "Super Admin",           value: data?.total_super_admins?.toLocaleString("id-ID"),    color: "bg-green-600" },
    { icon: AlertTriangle,        label: "User Nonaktif",         value: data?.inactive_users?.toLocaleString("id-ID"),        color: "bg-red-500" },
    { icon: MessageSquareWarning, label: "Request Admin Pending", value: data?.pending_admin_requests?.toLocaleString("id-ID"), color: "bg-amber-500", to: "/super-admin/admin-requests", trend: "down", trendVal: "Perlu review" },
  ], [data]);

  const bookingStatusChartData = useMemo(() => {
    if (!recentBookings.length) return [];
    const counts = recentBookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [recentBookings]);

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard Super Admin</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center transition-all duration-200 ${searchOpen ? "bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl" : ""}`}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-xl text-slate-500 transition-colors ${searchOpen ? "text-indigo-500" : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Search size={16} />
              </button>
              {searchOpen && (
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                  placeholder="Cari user, booking, transaksi..."
                  className="w-56 pr-3 py-2 text-sm bg-transparent focus:outline-none"
                />
              )}
            </div>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} loading={isLoading} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card p-5">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Status Booking Terbaru</h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribusi status dari 5 booking terakhir</p>
            </div>
            <BookingStatusChart data={bookingStatusChartData} loading={loadingBookings} />
          </div>
          <FieldTypeChart />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <RecentBookings data={recentBookings} loading={loadingBookings} />
            <RecentTransactions data={recentTransactions} loading={loadingTransactions} />
          </div>
          <div className="space-y-4">
            <ServerStatus />
            <QuickActions />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
