import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ArrowLeft, Calendar, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();

  const homeLink = isAdmin ? '/admin' : '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-6 shadow-lg">
          <Calendar size={40} className="text-white" />
        </div>

        {/* 404 number */}
        <div className="relative mb-4">
          <span className="text-[8rem] font-black text-primary-100 dark:text-gray-800 leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search size={48} className="text-primary-400 opacity-60" />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Coba kembali ke beranda atau halaman sebelumnya.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111827] hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>

          {token ? (
            <Link
              to={homeLink}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <Home size={16} />
              {isAdmin ? 'Dashboard Admin' : 'Ke Beranda'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <Home size={16} />
              Masuk / Daftar
            </Link>
          )}
        </div>

        {/* Footer hint */}
        <p className="text-xs text-gray-400 mt-8">
          BokinYuk — Smart Booking Lapangan Olahraga
        </p>
      </div>
    </div>
  );
}
