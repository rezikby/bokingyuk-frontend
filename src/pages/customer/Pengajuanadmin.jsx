import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ShieldCheck,
  Upload,
  X,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

// ── API helper ────────────────────────────────────────────────────────────────
const submitPengajuan = (formData) =>
  api
    .post("/v1/admin-requests", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

// ── Komponen upload preview ───────────────────────────────────────────────────
function ImageUpload({ label, hint, value, onChange }) {
  const preview = value ? URL.createObjectURL(value) : null;

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-[16/9]">
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 transition-colors aspect-[16/9]">
          <Upload size={22} className="text-gray-400" />
          <span className="text-sm text-gray-500">Upload {label}</span>
          {hint && (
            <span className="text-xs text-gray-400 text-center">{hint}</span>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PengajuanAdminPage() {
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);
  const { user } = useAuth(); // ✅ ambil user login

  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "", // ✅ auto-fill email dari akun login
    phone: "",
    address: "",
    reason: "",
  });
  const [ktpImage, setKtpImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [captchaToken, setCaptcha] = useState("");
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: submitPengajuan,
    onSuccess: () => {
      setSuccess(true);
      toast.success("Pengajuan berhasil dikirim!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Gagal mengirim pengajuan");
      recaptchaRef.current?.reset();
      setCaptcha("");
    },
  });

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { full_name, email, phone, address, reason } = form;
    if (!full_name || !email || !phone || !address || !reason) {
      toast.error("Lengkapi semua field yang wajib diisi");
      return;
    }
    if (!ktpImage) {
      toast.error("Upload foto KTP terlebih dahulu");
      return;
    }
    if (!selfieImage) {
      toast.error("Upload foto selfie + KTP terlebih dahulu");
      return;
    }
    if (!captchaToken) {
      toast.error("Selesaikan verifikasi CAPTCHA terlebih dahulu");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("ktp_image", ktpImage);
    fd.append("selfie_image", selfieImage);
    fd.append("captcha_token", captchaToken);
    mutation.mutate(fd);
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Pengajuan Terkirim!</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Pengajuanmu sedang ditinjau oleh super admin. Kamu akan dihubungi
          melalui email setelah proses review selesai.
        </p>
        <button
          onClick={() => navigate("/")}
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
            <ShieldCheck size={20} className="text-purple-600" />
            Pengajuan Admin
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ajukan diri kamu untuk menjadi admin platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Info banner */}
        <div className="flex gap-3 items-start bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Data kamu akan diverifikasi oleh super admin. Pastikan foto KTP dan
            selfie jelas terbaca.
          </span>
        </div>

        <div className="card p-6 space-y-5">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Informasi Diri
          </p>

          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "full_name",
                label: "Nama Lengkap",
                placeholder: "Nama sesuai KTP",
              },
              { name: "email", label: "Email", placeholder: "email@kamu.com" },
              { name: "phone", label: "No. HP", placeholder: "08xxxxxxxxxx" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  readOnly={name === "email"} // ✅ email tidak bisa diubah
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    name === "email"
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Alamat full width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Jl. ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Alasan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Alasan Pengajuan <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={4}
              placeholder="Ceritakan mengapa kamu ingin menjadi admin..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimal 20 karakter ({form.reason.length}/20)
            </p>
          </div>
        </div>

        {/* Upload foto */}
        <div className="card p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Upload Foto Identitas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Foto KTP"
              hint="Pastikan semua teks terbaca jelas"
              value={ktpImage}
              onChange={setKtpImage}
            />
            <ImageUpload
              label="Selfie + KTP"
              hint="Pegang KTP di depan wajah"
              value={selfieImage}
              onChange={setSelfieImage}
            />
          </div>
        </div>

        {/* reCAPTCHA */}
        <div className="card p-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Verifikasi <span className="text-red-500">*</span>
          </p>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptcha(token || "")}
            onExpired={() => setCaptcha("")}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending || !captchaToken}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengirim...
            </>
          ) : (
            "Kirim Pengajuan"
          )}
        </button>
      </form>
    </div>
  );
}