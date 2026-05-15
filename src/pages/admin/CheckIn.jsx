// Admin: Scanner QR check-in (kamera + manual input)
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminCheckInApi } from '../../api/booking';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { QrCode, Camera, Keyboard, CheckCircle, XCircle, User, Building2, Smartphone } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/format';
import { BASE_URL } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function CheckIn() {
  const [mode, setMode]          = useState('manual');
  const [manualToken, setManual] = useState('');
  const [result, setResult]      = useState(null);
  const [scanning, setScanning]  = useState(false);
  const scannerRef               = useRef(null);
  const html5QrRef               = useRef(null);
  const isRunningRef             = useRef(false); // ← flag penjaga

  const checkInMut = useMutation({
    mutationFn: adminCheckInApi,
    onSuccess: (res) => {
      setResult({ success: true, booking: res.data.data });
      toast.success('Check-in berhasil!');
    },
    onError: (e) => {
      setResult({ success: false, message: e.response?.data?.message || 'Token tidak valid' });
      toast.error(e.response?.data?.message || 'Check-in gagal');
    },
  });

  const handleCheckIn = (token) => {
    const t = (token || manualToken).trim();
    if (!t) { toast.error('Masukkan QR token'); return; }
    setResult(null);
    checkInMut.mutate(t);
  };

  // Fungsi helper stop yang aman
  const safeStop = async () => {
    if (html5QrRef.current && isRunningRef.current) {
      try {
        await html5QrRef.current.stop();
      } catch (_) {}
      isRunningRef.current = false;
    }
    html5QrRef.current = null;
  };

  useEffect(() => {
    if (mode !== 'camera') {
      safeStop();
      return;
    }

    let cancelled = false;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return;

      // Pastikan tidak ada instance lama
      const el = document.getElementById('qr-reader');
      if (!el) return;

      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (!isRunningRef.current) return; // cegah double-fire

          await safeStop();

          setTimeout(() => {
            if (cancelled) return;
            setScanning(false);
            setMode('manual');
            const t = decodedText.trim();
            if (t) {
              setResult(null);
              checkInMut.mutate(t);
            }
          }, 0);
        },
        () => {}
      )
      .then(() => {
        if (!cancelled) {
          isRunningRef.current = true;
          setScanning(true);
        } else {
          // Kalau sudah di-cancel sebelum start selesai, langsung stop
          safeStop();
        }
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error('Kamera tidak dapat diakses: ' + e);
          setMode('manual');
        }
      });
    });

    return () => {
      cancelled = true;
      safeStop();
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <QrCode size={24} /> Check-In Booking
        </h1>

        {/* Mobile API Info */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                API Mobile Check-In (akses dari HP)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                Scan QR customer → browser buka URL → check-in otomatis:
              </p>
              <code className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded block break-all">
                {BASE_URL.replace('/api', '')}/api/mobile/checkin/&#123;qr_token&#125;
              </code>
              <p className="text-xs text-blue-500 mt-1.5">
                Atau lihat info booking (read-only):<br />
                <span className="font-mono">.../api/mobile/booking/&#123;qr_token&#125;</span>
              </p>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 card p-1.5">
          <button
            onClick={() => { setMode('manual'); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === 'manual' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <Keyboard size={16} /> Input Manual
          </button>
          <button
            onClick={() => { setMode('camera'); setResult(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors
              ${mode === 'camera' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <Camera size={16} /> Scan Kamera
          </button>
        </div>

        {/* Manual input */}
        {mode === 'manual' ? (
          <div className="card p-5 space-y-4">
            <p className="text-sm text-gray-500">Masukkan QR token dari booking customer</p>
            <input
              value={manualToken}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckIn()}
              placeholder="Paste QR token di sini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700"
            />
            <Button className="w-full" onClick={() => handleCheckIn()} loading={checkInMut.isPending}>
              <QrCode size={16} /> Proses Check-In
            </Button>
          </div>
        ) : (
          <div className="card p-5">
            <p className="text-sm text-gray-500 mb-3">Arahkan kamera ke QR Code</p>
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" ref={scannerRef} />
            {scanning && (
              <p className="text-xs text-center text-gray-400 mt-2 animate-pulse">
                Menunggu QR Code...
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`card p-5 border-2 ${result.success ? 'border-green-300' : 'border-red-300'}`}>
            {result.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Check-In Berhasil!</span>
                </div>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={15} className="text-gray-400" />
                    <span className="text-gray-500 w-24">Customer</span>
                    <span className="font-medium">{result.booking?.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-gray-400" />
                    <span className="text-gray-500 w-24">Lapangan</span>
                    <span className="font-medium">{result.booking?.field?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode size={15} className="text-gray-400" />
                    <span className="text-gray-500 w-24">Tanggal</span>
                    <span className="font-medium">{formatDate(result.booking?.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <QrCode size={15} className="text-gray-400" />
                    <span className="text-gray-500 w-24">Waktu</span>
                    <span className="font-medium">
                      {formatTime(result.booking?.start_time)}–{formatTime(result.booking?.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge status={result.booking?.status} />
                    <Badge status={result.booking?.payment_status} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle size={20} />
                <div>
                  <p className="font-semibold">Check-In Gagal</p>
                  <p className="text-sm text-gray-500 mt-0.5">{result.message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}