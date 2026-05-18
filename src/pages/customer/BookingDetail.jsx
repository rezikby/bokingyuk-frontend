// Detail booking + QR Code + tombol bayar
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookingApi, cancelBookingApi } from '../../api/booking';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import { ArrowLeft, CalendarDays, Clock, MapPin, FileText, QrCode, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BookingDetail() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['booking', code],
    queryFn: () => getBookingApi(code).then(r => r.data.data),
    // Auto-reload setiap 5 detik saat belum lunas/confirmed
    // Setelah confirmed+paid, berhenti polling
    refetchInterval: (query) => {
      const b = query.state.data;
      if (!b) return 5_000;
      // Berhenti polling kalau sudah confirmed/checked_in/completed/cancelled
      const done = ['confirmed', 'checked_in', 'completed', 'cancelled'].includes(b.status)
        && b.payment_status === 'paid';
      return done ? false : 5_000;
    },
    refetchIntervalInBackground: false,
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelBookingApi(code),
    onSuccess: () => { toast.success('Booking dibatalkan'); qc.invalidateQueries({ queryKey: ['booking', code] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal membatalkan'),
  });

  if (isLoading) return (
    <div className="min-h-screen pb-20 md:pb-0"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );

  const b = data;

  // QR tampil segera saat payment_status paid — tidak harus tunggu status 'confirmed'
  // Ini menangani kasus Midtrans webhook belum update status tapi payment sudah paid
  const showQR = b?.qr_token && (
    b?.payment_status === 'paid' ||
    ['confirmed', 'checked_in'].includes(b?.status)
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="space-y-4">
          {/* Header card */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Kode Booking</p>
                <p className="text-lg font-bold font-mono tracking-wide">{b?.booking_code}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge status={b?.status} />
                <Badge status={b?.payment_status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Lapangan</p>
                  <p className="font-medium">{b?.field?.name}</p>
                  <p className="text-xs text-gray-400">{b?.field?.type_label}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDate(b?.booking_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Waktu</p>
                  <p className="font-medium">{formatTime(b?.start_time)} – {formatTime(b?.end_time)}</p>
                  <p className="text-xs text-gray-400">{b?.duration_hours} jam</p>
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Bayar</p>
                <p className="text-lg font-bold text-indigo-600">{b?.total_formatted || formatPrice(b?.total_price)}</p>
              </div>
            </div>

            {b?.notes && (
              <div className="flex items-start gap-2 mt-4 pt-4 border-t">
                <FileText size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Catatan</p>
                  <p className="text-sm">{b.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Banner sukses pembayaran */}
          {b?.payment_status === 'paid' && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Pembayaran Berhasil!</p>
                <p className="text-xs text-green-600 dark:text-green-400">Booking kamu sudah dikonfirmasi. Gunakan QR di bawah untuk check-in.</p>
              </div>
            </div>
          )}

          {/* QR Code — muncul langsung setelah paid */}
          {showQR && (
            <div className="card p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode size={18} className="text-indigo-600" />
                <h3 className="font-semibold">QR Code Check-In</h3>
              </div>
              <div className="inline-block p-4 bg-white rounded-2xl border shadow-sm">
                <QRCodeSVG
                  value={b.qr_checkin_url || b.qr_token}
                  size={180}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">Tunjukkan QR ini kepada petugas saat check-in</p>
              <p className="text-xs text-gray-300 mt-1 font-mono break-all">{b.qr_token}</p>
            </div>
          )}

          {/* Menunggu pembayaran — skeleton QR */}
          {!showQR && b?.payment_status === 'unpaid' && b?.status !== 'cancelled' && (
            <div className="card p-5 text-center border-dashed border-2 border-gray-200 dark:border-gray-700">
              <QrCode size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">QR Code akan muncul otomatis setelah pembayaran berhasil</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {b?.payment_status === 'unpaid' && ['pending', 'confirmed'].includes(b?.status) && (
              <Button className="flex-1" onClick={() => navigate(`/payment/${b.booking_code}`)}>
                Bayar Sekarang
              </Button>
            )}
            {['pending', 'confirmed'].includes(b?.status) && (
              <Button variant="danger" loading={cancelMut.isPending}
                onClick={() => { if (confirm('Batalkan booking ini?')) cancelMut.mutate(); }}>
                Batalkan
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}