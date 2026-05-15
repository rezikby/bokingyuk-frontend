// Fitur 5: Export Laporan (Admin)
import { useState, useRef } from 'react';
import {
  exportRevenueApi,
  exportDailySummaryApi,
  exportFieldReportApi,
  exportCustomersApi,
  exportUsersApi,
  parseBlobError,
} from '../../api/export';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import { Download, FileSpreadsheet, Users, BarChart3, CalendarDays, UserCog, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const today    = new Date().toISOString().slice(0, 10);
const firstDay = today.slice(0, 8) + '01';

const EXPORT_TYPES = [
  {
    key: 'revenue',
    icon: BarChart3,
    label: 'Laporan Pendapatan',
    desc: 'Export data pendapatan berdasarkan periode',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/10',
    hasDateRange: true,
    fn: exportRevenueApi,
  },
  {
    key: 'daily_summary',
    icon: CalendarDays,
    label: 'Ringkasan Harian',
    desc: 'Export ringkasan booking dan pembayaran per hari',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    hasDateRange: true,
    fn: exportDailySummaryApi,
  },
  {
    key: 'field_report',
    icon: FileSpreadsheet,
    label: 'Laporan Lapangan',
    desc: 'Export statistik per lapangan',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    hasDateRange: true,
    fn: exportFieldReportApi,
  },
  {
    key: 'customers',
    icon: Users,
    label: 'Data Pelanggan',
    desc: 'Export daftar pelanggan dan statistik booking',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    hasDateRange: false,
    fn: exportCustomersApi,
  },
  {
    key: 'all_users',
    icon: UserCog,
    label: 'Semua Pengguna',
    desc: 'Export semua pengguna termasuk admin',
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-900/10',
    hasDateRange: false,
    fn: exportUsersApi,
  },
];

function downloadBlob(blob, res, fallbackName) {
  const disposition = res.headers['content-disposition'] || '';
  const match       = disposition.match(/filename="?([^";\n]+)"?/i);
  const filename    = match?.[1] || fallbackName;
  const url         = window.URL.createObjectURL(blob);
  const a           = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Input tanggal dengan tombol kalender yang memicu native picker
function DateInput({ label, value, min, max, onChange }) {
  const ref = useRef(null);

  const handleClick = () => {
    if (ref.current) {
      // showPicker() adalah cara modern memicu kalender native
      if (ref.current.showPicker) {
        ref.current.showPicker();
      } else {
        ref.current.focus();
        ref.current.click();
      }
    }
  };

  return (
    <div className="flex-1">
      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
      <div
        className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-white dark:bg-[#111827] dark:border-gray-700 cursor-pointer hover:border-indigo-400 transition-colors"
        onClick={handleClick}
      >
        <Calendar size={14} className="text-indigo-500 shrink-0" />
        <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">
          {value
            ? new Date(value + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Pilih tanggal'}
        </span>
        {/* Input hidden tapi tetap di DOM agar showPicker() bisa dipanggil */}
        <input
          ref={ref}
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(e.target.value)}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

export default function ExportReports() {
  const [loading, setLoading] = useState({});
  const [dates, setDates]     = useState({ from: today, to: today });

  const handleExport = async (item) => {
    if (item.hasDateRange) {
      if (!dates.from || !dates.to) {
        toast.error('Pilih tanggal dari dan sampai terlebih dahulu.');
        return;
      }
      if (dates.from > dates.to) {
        toast.error('Tanggal "Dari" tidak boleh lebih besar dari "Sampai".');
        return;
      }
    }

    setLoading(l => ({ ...l, [item.key]: true }));
    try {
      const params = item.hasDateRange ? dates : {};
      const res    = await item.fn(params);

      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Gagal export.');
      }

      const ext = contentType.includes('spreadsheet') ? 'xlsx' : 'csv';
      downloadBlob(res.data, res, `${item.key}_${today}.${ext}`);
      toast.success(`${item.label} berhasil diunduh`);
    } catch (e) {
      const msg = await parseBlobError(e);
      toast.error(msg);
    } finally {
      setLoading(l => ({ ...l, [item.key]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Download size={22} className="text-indigo-600" />
          <h1 className="text-xl font-bold">Export Laporan</h1>
        </div>

        {/* Filter periode global */}
        <div className="card p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter Periode <span className="text-xs font-normal text-gray-400">(untuk laporan berdasarkan tanggal)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <DateInput
              label="Dari"
              value={dates.from}
              max={dates.to || today}
              onChange={v => setDates(d => ({ ...d, from: v }))}
            />
            <DateInput
              label="Sampai"
              value={dates.to}
              min={dates.from}
              onChange={v => setDates(d => ({ ...d, to: v }))}
            />
          </div>
          {dates.from && dates.to && (
            <p className="text-xs text-gray-400 mt-2">
              Periode: <span className="font-medium text-gray-600 dark:text-gray-300">
                {new Date(dates.from + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' '}&rarr;{' '}
                {new Date(dates.to + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </p>
          )}
        </div>

        {/* Export cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {EXPORT_TYPES.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="card p-5">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={item.color} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.label}</h3>
                <p className="text-xs text-gray-500 mb-4">{item.desc}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  loading={loading[item.key]}
                  onClick={() => handleExport(item)}
                >
                  <Download size={14} className="mr-1.5" /> Download
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}