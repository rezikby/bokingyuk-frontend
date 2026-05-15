import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { Lock, Shield, User, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

// Definisi permission per role (tampilan statis + dapat dikembangkan ke API)
const ROLE_PERMISSIONS = {
  super_admin: {
    label: 'Super Admin',
    icon: Shield,
    color: 'indigo',
    description: 'Akses penuh ke seluruh sistem',
    permissions: [
      'Melihat semua data dari seluruh admin',
      'Mengelola akun admin (CRUD)',
      'Mengaktifkan / menonaktifkan admin',
      'Mengatur hak akses admin',
      'Melihat statistik global seluruh aplikasi',
      'Melihat log aktivitas semua user',
      'Mengelola customer',
      'Mengelola konfigurasi sistem',
      'Melihat laporan seluruh transaksi',
      'Mengelola role dan permission',
    ],
    denied: [],
  },
  admin: {
    label: 'Admin',
    icon: UserCheck,
    color: 'blue',
    description: 'Akses terbatas pada data milik sendiri',
    permissions: [
      'Dashboard pribadi',
      'Kelola lapangan miliknya',
      'Kelola customer miliknya',
      'Kelola booking miliknya',
      'Kelola transaksi miliknya',
      'Melihat laporan miliknya sendiri',
      'Mengedit profil',
      'Check-in booking',
      'Export laporan sendiri',
    ],
    denied: [
      'Melihat data admin lain',
      'Mengakses endpoint Super Admin',
      'Melihat log global',
      'Mengubah permission',
      'Melihat statistik seluruh platform',
    ],
  },
  customer: {
    label: 'Customer',
    icon: User,
    color: 'slate',
    description: 'Akses dasar pengguna akhir',
    permissions: [
      'Login & Registrasi',
      'Mengelola profil sendiri',
      'Membuat booking',
      'Melihat booking miliknya',
      'Melakukan pembayaran',
      'Melihat riwayat transaksi pribadi',
      'Memberi rating & ulasan',
      'Mengajukan pengaduan',
    ],
    denied: [
      'Mengakses dashboard admin',
      'Mengakses data admin',
      'Mengakses data customer lain',
      'Mengakses endpoint management',
    ],
  },
};

const colorMap = {
  indigo: {
    header:    'bg-indigo-600',
    badge:     'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/30',
    iconWrap:  'bg-indigo-100 dark:bg-indigo-900/30',
    icon:      'text-indigo-600 dark:text-indigo-400',
  },
  blue: {
    header:    'bg-blue-500',
    badge:     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
    iconWrap:  'bg-blue-100 dark:bg-blue-900/30',
    icon:      'text-blue-600 dark:text-blue-400',
  },
  slate: {
    header:    'bg-slate-600',
    badge:     'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    iconWrap:  'bg-slate-100 dark:bg-slate-800',
    icon:      'text-slate-600 dark:text-slate-400',
  },
};

function RoleCard({ roleKey, data }) {
  const Icon   = data.icon;
  const colors = colorMap[data.color];

  return (
    <div className="card overflow-hidden">
      <div className={`px-5 py-4 ${colors.header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{data.label}</h3>
            <p className="text-xs text-white/70 mt-0.5">{data.description}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {data.permissions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hak Akses</p>
            <ul className="space-y-1.5">
              {data.permissions.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.denied.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Dilarang</p>
            <ul className="space-y-1.5">
              {data.denied.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
        <p className="text-xs text-slate-400">
          API prefix:{' '}
          <code className="font-mono text-indigo-600 dark:text-indigo-400">
            /api/{roleKey === 'super_admin' ? 'super-admin' : roleKey}
          </code>
        </p>
      </div>
    </div>
  );
}

export default function Permissions() {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Lock size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="page-title">Role & Permission</h1>
            <p className="page-subtitle">Konfigurasi hak akses tiap role pengguna</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Catatan:</strong> Permission dikontrol via RBAC middleware di backend.
            Perubahan permission membutuhkan update konfigurasi server.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Object.entries(ROLE_PERMISSIONS).map(([key, data]) => (
            <RoleCard key={key} roleKey={key} data={data} />
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
