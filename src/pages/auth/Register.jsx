import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { googleRedirectApi } from '../../api/auth';
import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name:                  z.string().min(2, 'Nama minimal 2 karakter'),
  email:                 z.string().email('Email tidak valid').refine(
    (val) => val.toLowerCase().endsWith('@gmail.com'),
    { message: 'Hanya akun Gmail (@gmail.com) yang diizinkan' }
  ),
  password:              z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string(),
  phone:                 z.string().min(8, 'Nomor telepon tidak valid'),
  whatsapp_number:       z.string().optional(),
}).refine(d => d.password === d.password_confirmation, {
  message: 'Konfirmasi password tidak cocok', path: ['password_confirmation'],
});

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

export default function Register() {
  const { register: regAuth, loading } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const res = await regAuth(data);
    if (res.success) navigate('/');
    else if (res.errors)
      Object.entries(res.errors).forEach(([k, v]) => setError(k, { message: Array.isArray(v) ? v[0] : v }));
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const res = await googleRedirectApi();
      const url = res.data.data?.url;
      if (url) { window.location.href = url; }
      else { toast.error('Gagal mendapatkan URL Google'); setGoogleLoading(false); }
    } catch { toast.error('Login Google gagal'); setGoogleLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          background: #F8F9FC;
          transition: background 0.3s;
          position: relative;
          overflow: hidden;
        }
        .reg-root.dark-mode { background: #0D1117; }

        /* ── Theme toggle ── */
        .theme-btn {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(0,0,0,0.08);
          background: #fff;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          z-index: 20;
        }
        .dark-mode .theme-btn {
          background: #161B22;
          border-color: rgba(255,255,255,0.08);
          color: #94A3B8;
        }
        .theme-btn:hover { background: #F1F5F9; }
        .dark-mode .theme-btn:hover { background: #1E2530; }

        /* ── LEFT PANEL ── */
        .reg-left {
          width: 50%;
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 40%, #EDE9FE 80%, #F0F4FF 100%);
          flex-shrink: 0;
        }
        .dark-mode .reg-left {
          background: linear-gradient(145deg, #13111C 0%, #1A1628 40%, #160F2C 80%, #0F1220 100%);
        }
        .reg-left::before {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .reg-left::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(168,85,247,0.09) 0%, transparent 70%);
          bottom: 10%;
          right: 5%;
          pointer-events: none;
        }

        .hero-image-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .hero-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── PANEL DIVIDER ── */
        .panel-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(99,102,241,0.15) 30%, rgba(99,102,241,0.15) 70%, transparent);
          align-self: stretch;
          flex-shrink: 0;
        }
        .dark-mode .panel-divider {
          background: linear-gradient(to bottom, transparent, rgba(99,102,241,0.2) 30%, rgba(99,102,241,0.2) 70%, transparent);
        }

        /* ── RIGHT PANEL ── */
        .reg-right {
          width: 50%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 3rem;
          position: relative;
          background: #fff;
          flex-shrink: 0;
        }
        .dark-mode .reg-right { background: #0D1117; }
        .reg-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 80% 20%, rgba(99,102,241,0.04) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 20% 80%, rgba(168,85,247,0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── Form container ── */
        .reg-form-container {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }

        /* ── Brand ── */
        .reg-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1.125rem;
          border-bottom: 1px solid #F1F5F9;
          transition: border-color 0.3s;
        }
        .dark-mode .reg-brand { border-bottom-color: #21262D; }

        .reg-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: linear-gradient(135deg, #6366F1, #818CF8);
          border-radius: 0.5rem;
          padding: 0.35rem 0.7rem;
          flex-shrink: 0;
        }
        .reg-badge-text {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.03em;
        }
        .reg-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 0.1rem;
          letter-spacing: -0.01em;
          transition: color 0.3s;
        }
        .dark-mode .reg-title { color: #F1F5F9; }
        .reg-sub {
          font-size: 0.6875rem;
          color: #94A3B8;
          margin: 0;
        }

        /* ── Section labels ── */
        .section-label {
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #CBD5E1;
          margin: 0 0 0.375rem;
        }
        .dark-mode .section-label { color: #374151; }

        /* ── Grid ── */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        /* ── Divider ── */
        .divider { display: flex; align-items: center; gap: 0.5rem; }
        .divider-line { flex: 1; height: 1px; background: #E2E8F0; transition: background 0.3s; }
        .dark-mode .divider-line { background: #21262D; }
        .divider-text { font-size: 0.625rem; color: #94A3B8; font-weight: 500; white-space: nowrap; }

        /* ── Google button ── */
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #374151;
          font-size: 0.75rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .dark-mode .google-btn {
          background: #0D1117;
          border-color: rgba(255,255,255,0.1);
          color: #94A3B8;
        }
        .google-btn:hover:not(:disabled) { background: #F8FAFC; border-color: #CBD5E1; }
        .dark-mode .google-btn:hover:not(:disabled) { background: #161B22; border-color: rgba(255,255,255,0.15); }
        .google-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Footer ── */
        .footer-text { text-align: center; font-size: 0.6875rem; color: #64748B; margin: 0; }
        .footer-link { color: #6366F1; font-weight: 600; text-decoration: none; }
        .dark-mode .footer-link { color: #818CF8; }
        .footer-link:hover { text-decoration: underline; }

        /* ── Spacing ── */
        .stack    { display: flex; flex-direction: column; gap: 0.5rem; }
        .stack-sm { display: flex; flex-direction: column; gap: 0.4rem; }
        .sep { height: 1px; background: #F1F5F9; margin: 0.25rem 0; transition: background 0.3s; }
        .dark-mode .sep { background: #21262D; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .reg-root { flex-direction: column; }
          .reg-left { display: none; }
          .panel-divider { display: none; }
          .reg-right {
            width: 100%;
            min-height: 100vh;
            padding: 2.5rem 1.5rem 3rem;
          }
        }
      `}</style>

      <div className={`reg-root${dark ? ' dark-mode' : ''}`}>

        {/* Theme toggle */}
        <button onClick={toggle} className="theme-btn" aria-label="Toggle theme">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* ── LEFT PANEL: Illustration ── */}
        <div className="reg-left">
          <div className="hero-image-wrap">
            <img src="/img/gambar_kiri.svg" alt="BokingYuk Sports" />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="panel-divider" />

        {/* ── RIGHT PANEL: Form ── */}
        <div className="reg-right">
          <div className="reg-form-container">

            {/* Brand */}
            <div className="reg-brand">
              <div className="reg-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2"/>
                  <line x1="12" y1="3" x2="12" y2="21"/>
                  <path d="M2 12h20"/>
                  <path d="M7 3v4M17 3v4M7 17v4M17 17v4"/>
                </svg>
                <span className="reg-badge-text">BokingYuk</span>
              </div>
              <div>
                <h1 className="reg-title">Buat akun baru</h1>
                <p className="reg-sub">Daftar gratis dan mulai booking lapangan</p>
              </div>
            </div>

            {/* Form + extras */}
            <div className="stack">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="stack-sm">

                  <p className="section-label">Informasi Akun</p>
                  <Input label="Nama Lengkap" placeholder="Nama Anda" error={errors.name?.message} {...register('name')} />
                  <Input label="Email" type="email" placeholder="nama@email.com" error={errors.email?.message} {...register('email')} />

                  <div className="sep" />

                  <p className="section-label">Kontak</p>
                  <div className="two-col">
                    <Input label="No. Telepon" placeholder="08xx" error={errors.phone?.message} {...register('phone')} />
                    <Input label="No. WhatsApp" placeholder="08xx (opsional)" error={errors.whatsapp_number?.message} {...register('whatsapp_number')} />
                  </div>

                  <div className="sep" />

                  <p className="section-label">Keamanan</p>
                  <div className="two-col">
                    <Input label="Password" type="password" placeholder="Min. 8 karakter" error={errors.password?.message} {...register('password')} />
                    <Input label="Konfirmasi" type="password" placeholder="Ulangi password" error={errors.password_confirmation?.message} {...register('password_confirmation')} />
                  </div>

                  <Button type="submit" className="w-full" loading={loading} size="md">
                    Buat Akun
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="divider">
                <div className="divider-line" />
                <span className="divider-text">atau daftar dengan</span>
                <div className="divider-line" />
              </div>

              {/* Google */}
              <button onClick={handleGoogleLogin} disabled={googleLoading || loading} className="google-btn">
                {googleLoading ? <Spinner /> : <GoogleIcon />}
                {googleLoading ? 'Menghubungkan...' : 'Google'}
              </button>

              {/* Footer */}
              <p className="footer-text">
                Sudah punya akun?{' '}
                <Link to="/login" className="footer-link">Masuk di sini</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}