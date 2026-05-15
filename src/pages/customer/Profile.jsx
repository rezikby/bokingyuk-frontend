import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Mail, Phone, MessageCircle, MapPin,
  Lock, Eye, EyeOff, Camera, Save, KeyRound,
  CheckCircle, AlertCircle, Loader2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import api from '../../lib/axios';

/* ── helpers ── */
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U';

/**
 * Kirim activity log ke backend.
 * Endpoint POST /v1/user/activity-logs harus tersedia,
 * atau sesuaikan dengan endpoint yang ada di project kamu.
 *
 * Jika backend sudah otomatis mencatat lewat ProfileController
 * (dengan memanggil ActivityLogger::log() di sana), fungsi ini
 * bisa dihapus dan cukup andalkan backend.
 */
async function logActivity(type, description, metadata = null) {
  try {
    await api.post('/v1/user/activity-logs', {
      type,
      description,
      ...(metadata ? { metadata } : {}),
    });
  } catch {
    // Log gagal tidak boleh interrupt UX — silent fail
    console.warn('[ActivityLog] Gagal mencatat aktivitas:', type);
  }
}

function Alert({ type, message, onDismiss }) {
  if (!message) return null;
  const isOk = type === 'success';
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
      ${isOk
        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}
    >
      {isOk ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100">✕</button>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, id, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = `
  w-full px-4 py-2.5 rounded-xl text-sm
  bg-gray-50 dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-gray-100
  placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600
  transition
`;

/* ══════════════════════════════════════════════════════ */
export default function Profile() {
  const { user, updateUser } = useAuth();

  /* ── avatar ── */
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg]         = useState({ type: '', text: '' });

  /* ── profile form ── */
  const [profile, setProfile] = useState({
    name:            user?.name            || '',
    email:           user?.email           || '',
    phone:           user?.phone           || '',
    whatsapp_number: user?.whatsapp_number || '',
    address:         user?.address         || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg]         = useState({ type: '', text: '' });
  const [fetchLoading, setFetchLoading]     = useState(true);

  /* ── password form ── */
  const [pass, setPass]         = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg]         = useState({ type: '', text: '' });

  /* ── tab ── */
  const [tab, setTab] = useState('info');

  /* ── GET profile on mount ── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res  = await api.get('/v1/auth/me');
        const data = res.data?.data || res.data;
        setProfile({
          name:            data.name            || '',
          email:           data.email           || '',
          phone:           data.phone           || '',
          whatsapp_number: data.whatsapp_number || '',
          address:         data.address         || '',
        });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
        updateUser(data);
      } catch {
        // fallback ke data context jika fetch gagal
      } finally {
        setFetchLoading(false);
      }
    };
    fetchProfile();
  }, []);

  /* ── handlers ── */

  /**
   * AVATAR — log aktivitas setelah upload berhasil.
   * type: 'profile_update'
   * metadata: { field: 'avatar' }
   */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarLoading(true);
    setAvatarMsg({ type: '', text: '' });

    const form = new FormData();
    form.append('avatar', file);
    try {
      const res = await api.post('/v1/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.avatar_url;
      if (url) {
        setAvatarPreview(url);
        updateUser({ ...user, avatar_url: url });
      }
      setAvatarMsg({ type: 'success', text: res.data?.message || 'Avatar berhasil diperbarui.' });

      // ✅ Log aktivitas — avatar diperbarui
      await logActivity(
        'profile_update',
        'Foto profil berhasil diperbarui.',
        { field: 'avatar' }
      );
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengunggah avatar.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  /**
   * PROFILE — log aktivitas setelah update berhasil.
   * type: 'profile_update'
   * metadata: field-field yang diubah (tanpa nilai sensitif)
   */
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    // Catat field mana saja yang berubah dibanding data awal
    const changedFields = Object.keys(profile).filter(
      (key) => profile[key] !== (user?.[key] ?? '')
    );

    try {
      const res     = await api.put('/v1/profile', profile);
      const updated = res.data?.data;
      if (updated) {
        setProfile({
          name:            updated.name            || '',
          email:           updated.email           || '',
          phone:           updated.phone           || '',
          whatsapp_number: updated.whatsapp_number || '',
          address:         updated.address         || '',
        });
        updateUser(updated);
      }
      setProfileMsg({ type: 'success', text: res.data?.message || 'Profil berhasil diperbarui.' });

      // ✅ Log aktivitas — profil diperbarui
      await logActivity(
        'profile_update',
        'Informasi profil berhasil diperbarui.',
        { updated_fields: changedFields.length > 0 ? changedFields : ['profil'] }
      );
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first  = errors ? Object.values(errors)[0]?.[0] : null;
      setProfileMsg({ type: 'error', text: first || err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * PASSWORD — log aktivitas setelah ganti password berhasil.
   * type: 'profile_update'
   * metadata: { field: 'password' }
   * ⚠️  Tidak pernah log nilai password — hanya catat bahwa password diubah.
   */
  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (pass.new_password !== pass.new_password_confirmation) {
      setPassMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
      return;
    }
    setPassLoading(true);
    setPassMsg({ type: '', text: '' });
    try {
      const res = await api.put('/v1/profile/change-password', pass);
      setPassMsg({ type: 'success', text: res.data?.message || 'Password berhasil diubah.' });
      setPass({ current_password: '', new_password: '', new_password_confirmation: '' });

      // ✅ Log aktivitas — password diubah
      await logActivity(
        'profile_update',
        'Password akun berhasil diubah.',
        { field: 'password' }
      );
    } catch (err) {
      const errors = err.response?.data?.errors;
      const first  = errors ? Object.values(errors)[0]?.[0] : null;
      setPassMsg({ type: 'error', text: first || err.response?.data?.message || 'Terjadi kesalahan.' });
    } finally {
      setPassLoading(false);
    }
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] py-10 px-4 pb-20 md:pb-0">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Back button ── */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </Link>

        {/* ── Header card ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">

          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-600 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
          </div>

          {/* Avatar + name */}
          <div className="px-6 pb-5 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl font-bold text-white">{initials(profile.name || user?.name)}</span>}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition disabled:opacity-60"
                title="Ganti foto"
              >
                {avatarLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpg,image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex-1 pt-1 sm:pb-1 space-y-0.5">
              {fetchLoading
                ? <div className="h-6 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                : <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name || '—'}</h1>}
              <p className="text-sm text-gray-400">{profile.email || user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-full capitalize">
                {user?.role || 'customer'}
              </span>
            </div>
          </div>

          {avatarMsg.text && (
            <div className="px-6 pb-4">
              <Alert type={avatarMsg.type} message={avatarMsg.text} onDismiss={() => setAvatarMsg({ type: '', text: '' })} />
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
          {[
            { key: 'info',     label: 'Informasi Profil', icon: User },
            { key: 'password', label: 'Ubah Password',    icon: KeyRound },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all
                ${tab === key
                  ? 'bg-white dark:bg-[#111827] text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── Info tab ── */}
        {tab === 'info' && (
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-5"
          >
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User size={16} className="text-purple-500" /> Informasi Profil
            </h2>

            <Alert type={profileMsg.type} message={profileMsg.text} onDismiss={() => setProfileMsg({ type: '', text: '' })} />

            {fetchLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-11 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User} label="Nama Lengkap" id="name">
                    <input id="name" className={inputCls} value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Nama lengkap" />
                  </Field>

                  <Field icon={Mail} label="Email" id="email">
                    <input id="email" type="email" className={inputCls} value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="email@contoh.com" />
                  </Field>

                  <Field icon={Phone} label="Nomor Telepon" id="phone">
                    <input id="phone" className={inputCls} value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx" />
                  </Field>

                  <Field icon={MessageCircle} label="WhatsApp" id="wa">
                    <input id="wa" className={inputCls} value={profile.whatsapp_number}
                      onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                      placeholder="08xxxxxxxxxx" />
                  </Field>
                </div>

                <Field icon={MapPin} label="Alamat" id="address">
                  <textarea id="address" rows={3} className={`${inputCls} resize-none`}
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Alamat lengkap..." />
                </Field>
              </>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileLoading || fetchLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-purple-200 dark:shadow-none"
              >
                {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}

        {/* ── Password tab ── */}
        {tab === 'password' && (
          <form
            onSubmit={handlePassSubmit}
            className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-5"
          >
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Lock size={16} className="text-purple-500" /> Ubah Password
            </h2>

            <Alert type={passMsg.type} message={passMsg.text} onDismiss={() => setPassMsg({ type: '', text: '' })} />

            {[
              { key: 'current_password',          label: 'Password Lama',       show: 'current', placeholder: '••••••••' },
              { key: 'new_password',              label: 'Password Baru',       show: 'new',     placeholder: 'min. 8 karakter' },
              { key: 'new_password_confirmation', label: 'Konfirmasi Password', show: 'confirm', placeholder: 'ulangi password baru' },
            ].map(({ key, label, show, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  <Lock size={12} /> {label}
                </label>
                <div className="relative">
                  <input
                    type={showPass[show] ? 'text' : 'password'}
                    className={`${inputCls} pr-11`}
                    value={pass[key]}
                    onChange={(e) => setPass({ ...pass, [key]: e.target.value })}
                    placeholder={placeholder}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass({ ...showPass, [show]: !showPass[show] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    {showPass[show] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {/* Password strength */}
            {pass.new_password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[8, 12, 16].map((len) => (
                    <div key={len} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      pass.new_password.length >= len
                        ? len === 8  ? 'bg-red-400'
                        : len === 12 ? 'bg-yellow-400'
                        : 'bg-green-400'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {pass.new_password.length < 8  ? 'Terlalu pendek'
                   : pass.new_password.length < 12 ? 'Cukup kuat'
                   : pass.new_password.length < 16 ? 'Kuat'
                   : 'Sangat kuat'}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-purple-200 dark:shadow-none"
              >
                {passLoading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                Ubah Password
              </button>
            </div>
          </form>
        )}

        {/* ── Quick links ── */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-gray-800">
          {[
            { to: '/bookings',                label: 'Booking Saya' },
            { to: '/settings/pengaduan',       label: 'Pengaduan' },
            { to: '/settings/pengajuan-admin', label: 'Pengajuan Admin' },
            { to: '/settings/log-aktivitas',   label: 'Log Aktivitas' },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              {label}
              <ChevronRight size={15} className="text-gray-400" />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}