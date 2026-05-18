import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Sun, Moon } from 'lucide-react';
import { googleRedirectApi } from '../../api/auth';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Spinner ── */
function Spinner({ className = '' }) {
  return (
    <svg className={`animate-spin w-4 h-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
  );
}

export default function Login() {
  const { login, googleLogin, loading } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access_token = params.get('access_token');
    if (access_token) {
      window.history.replaceState({}, document.title, '/login');
      handleGoogleToken(access_token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleToken = async (access_token) => {
    setGoogleLoading(true);
    const res = await googleLogin(access_token);
    setGoogleLoading(false);
    if (res.success) {
      if (res.user.role === 'super_admin') navigate('/super-admin');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
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

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res.success) {
      if (res.user.role === 'super_admin') navigate('/super-admin');
      else if (res.user.role === 'admin') navigate('/admin');
      else navigate('/');
    } else if (res.errors) {
      Object.entries(res.errors).forEach(([k, v]) =>
        setError(k, { message: Array.isArray(v) ? v[0] : v })
      );
    }
  };

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .login-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          background: #F8F9FC;
          transition: background 0.3s;
        }
        .login-root.dark-mode {
          background: #0D1117;
        }

        /* Subtle mesh background */
        .login-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 10% 10%, rgba(99,102,241,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 90% 90%, rgba(168,85,247,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .dark-mode::before {
          background:
            radial-gradient(ellipse 60% 50% at 10% 10%, rgba(99,102,241,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 90% 90%, rgba(168,85,247,0.09) 0%, transparent 70%);
        }

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
          z-index: 10;
        }
        .dark-mode .theme-btn {
          background: #161B22;
          border-color: rgba(255,255,255,0.08);
          color: #94A3B8;
        }
        .theme-btn:hover { background: #F1F5F9; }
        .dark-mode .theme-btn:hover { background: #1E2530; }

        /* ── Card ── */
        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 1.25rem;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow:
            0 1px 3px rgba(0,0,0,0.04),
            0 8px 32px rgba(0,0,0,0.06);
          padding: 2.25rem 2.25rem 2rem;
          position: relative;
          z-index: 1;
        }
        .dark-mode .login-card {
          background: #161B22;
          border-color: rgba(255,255,255,0.07);
          box-shadow:
            0 1px 3px rgba(0,0,0,0.2),
            0 8px 32px rgba(0,0,0,0.3);
        }

        /* ── Brand ── */
        .brand-area {
          margin-bottom: 1.75rem;
        }
        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #6366F1, #818CF8);
          border-radius: 0.625rem;
          padding: 0.45rem 0.85rem;
          margin-bottom: 1.25rem;
        }
        .brand-badge svg {
          color: #fff;
        }
        .brand-badge-text {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
        }
        .brand-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 0.25rem;
          letter-spacing: -0.02em;
        }
        .dark-mode .brand-title { color: #F1F5F9; }
        .brand-sub {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
        }
        .dark-mode .brand-sub { color: #64748B; }

        /* ── Divider ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0.25rem 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }
        .dark-mode .divider-line { background: #21262D; }
        .divider-text {
          font-size: 0.75rem;
          color: #94A3B8;
          font-weight: 500;
        }

        /* ── Google button ── */
        .google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 0.6875rem 1rem;
          border-radius: 0.625rem;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .dark-mode .google-btn {
          border-color: #21262D;
          background: #0D1117;
          color: #CBD5E1;
        }
        .google-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        }
        .dark-mode .google-btn:hover:not(:disabled) {
          background: #161B22;
          border-color: #30363D;
        }
        .google-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* ── Footer link ── */
        .footer-text {
          text-align: center;
          font-size: 0.8125rem;
          color: #64748B;
        }
        .footer-link {
          color: #6366F1;
          font-weight: 600;
          text-decoration: none;
        }
        .dark-mode .footer-link { color: #818CF8; }
        .footer-link:hover { text-decoration: underline; }

        /* ── Spacing helpers ── */
        .gap-4 { gap: 1rem; }
        .space { display: flex; flex-direction: column; gap: 1.125rem; }
      `}</style>

      <div className={`login-root${dark ? ' dark-mode' : ''}`}>
        {/* Theme toggle */}
        <button onClick={toggle} className="theme-btn" aria-label="Toggle theme">
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="login-card">
          {/* Brand */}
          <div className="brand-area">
            <div className="brand-badge">
              {/* Court/field icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="18" rx="2"/>
                <line x1="12" y1="3" x2="12" y2="21"/>
                <path d="M2 12h20"/>
                <path d="M7 3v4M17 3v4M7 17v4M17 17v4"/>
              </svg>
              <span className="brand-badge-text">BokingYuk</span>
            </div>
            <h1 className="brand-title">Selamat Datang</h1>
            <p className="brand-sub">Masuk untuk melanjutkan ke akun Anda</p>
          </div>

          {/* Form */}
          <div className="space">
            <form onSubmit={handleSubmit(onSubmit)} className="space">
              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" className="w-full" loading={loading} size="lg">
                Masuk
              </Button>
            </form>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">atau lanjutkan dengan</span>
              <div className="divider-line" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="google-btn"
            >
              {googleLoading ? <Spinner className="text-slate-400" /> : <GoogleIcon />}
              {googleLoading ? 'Menghubungkan...' : 'Google'}
            </button>

            {/* Footer */}
            <p className="footer-text">
              Belum punya akun?{' '}
              <Link to="/register" className="footer-link">Daftar sekarang</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}