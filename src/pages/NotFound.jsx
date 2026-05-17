import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  ArrowLeft,
  CalendarDays,
  Search,
  Sparkles,
} from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();

  const homeLink = isAdmin ? '/admin' : '/';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7ff] dark:bg-[#030712] flex items-center justify-center px-4">
      {/* Background Blur */}
      <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] bg-indigo-500/20 blur-3xl rounded-full" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] bg-cyan-500/20 blur-3xl rounded-full" />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-24 left-10 animate-bounce opacity-20">
          <CalendarDays size={42} className="text-indigo-500" />
        </div>

        <div className="absolute bottom-24 right-16 animate-pulse opacity-20">
          <Search size={38} className="text-cyan-500" />
        </div>

        <div className="absolute top-1/3 right-10 animate-pulse opacity-10">
          <Sparkles size={52} className="text-pink-500" />
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-xl">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-[32px] shadow-2xl p-8 md:p-12 text-center overflow-hidden">
          {/* Top Glow */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-500" />

          {/* Logo/Icon */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="absolute inset-0 blur-2xl bg-indigo-500/30 rounded-full" />

            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <CalendarDays size={44} className="text-white" />
            </div>
          </div>

          {/* 404 */}
          <div className="relative mb-5">
            <h1 className="text-[7rem] md:text-[9rem] leading-none font-black tracking-tight bg-gradient-to-r from-indigo-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
              404
            </h1>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg">
                <Search
                  size={42}
                  className="text-indigo-600 dark:text-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Oops! Halaman Hilang
          </h2>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-10">
            Halaman yang kamu cari mungkin sudah dipindahkan,
            dihapus, atau URL yang dimasukkan salah.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft
                size={18}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Kembali
            </button>

            {token ? (
              <Link
                to={homeLink}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300"
              >
                <Home
                  size={18}
                  className="group-hover:rotate-12 transition-transform"
                />
                {isAdmin ? 'Dashboard Admin' : 'Kembali ke Beranda'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300"
              >
                <Home
                  size={18}
                  className="group-hover:rotate-12 transition-transform"
                />
                Login / Register
              </Link>
            )}
          </div>

          {/* Bottom Text */}
          <div className="mt-10 pt-6 border-t border-gray-200/60 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              ✨ BokinYuk — Smart Booking Lapangan Olahraga
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}