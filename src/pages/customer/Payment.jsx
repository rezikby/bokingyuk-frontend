import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkPaymentStatusApi, refreshPaymentTokenApi } from '../../api/booking';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CreditCard, ExternalLink, ArrowLeft, CheckCircle,
  Clock, RefreshCw, AlertCircle, XCircle,
} from 'lucide-react';
import { formatDate, formatTime, formatPrice } from '../../utils/format';
import toast from 'react-hot-toast';

export default function Payment() {
  const { code }  = useParams();
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  // PERBAIKAN: pakai checkPaymentStatusApi bukan getBookingApi
  // Endpoint ini langsung cek ke Midtrans & auto-confirm jika sudah lunas
  // Tidak perlu admin online — customer sendiri yang trigger konfirmasi
  const { data, isLoading } = useQuery({
    queryKey: ['booking-payment-check', code],
    queryFn:  () => checkPaymentStatusApi(code).then(r => r.data.data),
    refetchInterval: (query) => {
      const status = query.state.data?.payment_status;
      return status === 'paid' ? false : 3_000;
    },
    refetchIntervalInBackground: false,
  });

  // Saat payment_status berubah jadi paid, invalidate cache lalu redirect ke BookingDetail
  useEffect(() => {
    if (data?.payment_status === 'paid') {
      // Invalidate semua query yang relevan supaya data segar di halaman berikutnya
      qc.invalidateQueries({ queryKey: ['booking', code] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      navigate(`/bookings/${code}`, { replace: true });
    }
  }, [data?.payment_status, code, navigate, qc]);

  const refreshMut = useMutation({
    mutationFn: () => refreshPaymentTokenApi(code),
    onSuccess: () => {
      toast.success('Link pembayaran berhasil dimuat!');
      qc.invalidateQueries({ queryKey: ['booking-payment-check', code] });
    },
    onError: (e) => {
      const msg = e.response?.data?.message || 'Gagal memuat link pembayaran';
      toast.error(msg, { duration: 6000 });
    },
  });

  const handleSnapPay = (snapToken) => {
    if (!window.snap) {
      toast.error(
        'Script Midtrans belum dimuat. Pastikan data-client-key di index.html sudah benar.',
        { duration: 6000 }
      );
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: () => {
        toast.success('Pembayaran berhasil! Mengonfirmasi...');
        // Langsung invalidate → polling akan detect paid & redirect
        qc.invalidateQueries({ queryKey: ['booking-payment-check', code] });
        qc.invalidateQueries({ queryKey: ['booking', code] });
        qc.invalidateQueries({ queryKey: ['bookings'] });
      },
      onPending: () => {
        toast('Pembayaran pending. Selesaikan pembayaran kamu.', { icon: '⏳' });
        qc.invalidateQueries({ queryKey: ['booking-payment-check', code] });
      },
      onError:  () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
      onClose:  () => qc.invalidateQueries({ queryKey: ['booking-payment-check', code] }),
    });
  };

  if (isLoading) return (
    <div className="min-h-screen pb-20 md:pb-0"><Navbar />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );

  const b = data;

  if (b?.payment_status === 'paid') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <CheckCircle size={64} className="text-green-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-bold mb-2">Pembayaran Berhasil!</h2>
        <p className="text-gray-500">Memuat QR Code check-in kamu...</p>
      </div>
    </div>
  );

  if (b?.status === 'cancelled' || b?.payment_status === 'expired') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <XCircle size={64} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Pembayaran Tidak Tersedia</h2>
        <p className="text-gray-500 mb-6">Booking ini sudah dibatalkan atau kadaluarsa.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Kembali ke Beranda</Button>
      </div>
    </div>
  );

  const hasToken = b?.payment?.snap_token || b?.payment?.payment_url;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="card p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <CreditCard size={22} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Pembayaran</h1>
              <p className="text-sm text-gray-500 font-mono">{b?.booking_code}</p>
            </div>
          </div>

          {/* Detail booking */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Lapangan</span>
              <span className="font-medium">{b?.field?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tanggal</span>
              <span className="font-medium">{formatDate(b?.booking_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu</span>
              <span className="font-medium">
                {formatTime(b?.start_time)} – {formatTime(b?.end_time)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span className="text-indigo-600">
                {b?.total_formatted || formatPrice(b?.total_price)}
              </span>
            </div>
          </div>

          {/* Waktu kadaluarsa */}
          {b?.payment?.expired_at && hasToken && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              ⏱ Selesaikan pembayaran sebelum{' '}
              {new Date(b.payment.expired_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}

          {/* Info polling aktif */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            Halaman akan otomatis terkonfirmasi setelah pembayaran berhasil
          </div>

          {/* Tombol bayar — ada snap_token */}
          {b?.payment?.snap_token ? (
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleSnapPay(b.payment.snap_token)}
            >
              <CreditCard size={16} /> Bayar Sekarang
            </Button>

          /* Tombol bayar — ada redirect url */
          ) : b?.payment?.payment_url ? (
            <a href={b.payment.payment_url} target="_blank" rel="noopener noreferrer">
              <Button className="w-full" size="lg">
                <ExternalLink size={16} /> Bayar via Midtrans
              </Button>
            </a>

          /* Tidak ada token */
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">
                    Link pembayaran belum tersedia
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                    Koneksi ke Midtrans gagal saat booking dibuat. Pastikan{' '}
                    <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">
                      MIDTRANS_SERVER_KEY
                    </code>{' '}
                    sudah diisi di <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded text-xs">.env</code> backend,
                    lalu klik tombol di bawah.
                  </p>
                </div>
              </div>

              {refreshMut.isError && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {refreshMut.error?.response?.data?.message ||
                      'Terjadi kesalahan. Cek log Laravel untuk detail.'}
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                loading={refreshMut.isPending}
                onClick={() => refreshMut.mutate()}
              >
                <RefreshCw size={16} /> Muat Ulang Link Bayar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}