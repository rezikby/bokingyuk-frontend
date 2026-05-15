import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquareWarning, Paperclip, X, CheckCircle, Loader2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

// ── API helper ────────────────────────────────────────────────────────────────
const submitPengaduan = (formData) =>
  api.post('/v1/pengaduan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

const KATEGORI = [
  'Pembayaran bermasalah',
  'Booking tidak terkonfirmasi',
  'Fasilitas tidak sesuai',
  'Penyalahgunaan akun',
  'Respons admin lambat',
  'Lainnya',
];

export default function PengaduanPage() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const [form, setForm] = useState({
    kategori: '',
    judul: '',
    detail: '',
  });
  const [file, setFile]             = useState(null);
  const [captchaToken, setCaptcha]  = useState('');
  const [success, setSuccess]       = useState(false);

  const mutation = useMutation({
    mutationFn: submitPengaduan,
    onSuccess: () => {
      setSuccess(true);
      toast.success('Pengaduan berhasil dikirim!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Gagal mengirim pengaduan');
      recaptchaRef.current?.reset();
      setCaptcha('');
    },
  });

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('File maksimal 5MB'); return; }
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kategori || !form.judul || !form.detail) {
      toast.error('Lengkapi semua field yang wajib diisi');
      return;
    }
    if (!captchaToken) {
      toast.error('Selesaikan verifikasi CAPTCHA terlebih dahulu');
      return;
    }
    const fd = new FormData();
    fd.append('kategori', form.kategori);
    fd.append('judul', form.judul);
    fd.append('detail', form.detail);
    fd.append('captcha_token', captchaToken);
    if (file) fd.append('lampiran', file);
    mutation.mutate(fd);
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Pengaduan Terkirim!</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Tim kami akan meninjau pengaduanmu dan menghubungi melalui email dalam 1–3 hari kerja.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageSquareWarning size={20} className="text-purple-600" />
            Pengaduan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Laporkan masalah atau keluhan yang kamu alami</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">

        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            name="kategori"
            value={form.kategori}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Pilih kategori --</option>
            {KATEGORI.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>

        {/* Judul */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Judul Pengaduan <span className="text-red-500">*</span>
          </label>
          <input
            name="judul"
            value={form.judul}
            onChange={handleChange}
            placeholder="Singkat dan jelas..."
            maxLength={100}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.judul.length}/100</p>
        </div>

        {/* Detail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Detail Masalah <span className="text-red-500">*</span>
          </label>
          <textarea
            name="detail"
            value={form.detail}
            onChange={handleChange}
            rows={5}
            placeholder="Jelaskan masalah yang kamu alami secara detail, termasuk kapan terjadi dan langkah yang sudah kamu coba..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
          />
        </div>

        {/* Upload lampiran */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Lampiran <span className="text-xs font-normal text-gray-400">(opsional)</span>
          </label>
          {file ? (
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Paperclip size={15} className="text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors">
              <Paperclip size={20} className="text-gray-400" />
              <span className="text-sm text-gray-500">Klik untuk upload</span>
              <span className="text-xs text-gray-400">PNG, JPG, PDF — maks 5MB</span>
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFile} />
            </label>
          )}
        </div>

        {/* reCAPTCHA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verifikasi <span className="text-red-500">*</span>
          </label>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptcha(token || '')}
            onExpired={() => setCaptcha('')}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending || !captchaToken}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Mengirim...</>
          ) : (
            'Kirim Pengaduan'
          )}
        </button>

      </form>
    </div>
  );
}