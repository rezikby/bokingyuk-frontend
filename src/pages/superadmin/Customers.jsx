import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { Search, Users, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/format';

const fetchCustomers = (params) =>
  api.get('/v1/super-admin/users', { params: { ...params, role: 'customer' } }).then(r => r.data.data);

const toggleUser = (id) =>
  api.patch(`/v1/super-admin/users/${id}/toggle-active`).then(r => r.data);

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-customers', search, page],
    queryFn: () => fetchCustomers({ search, page, per_page: 15 }),
    keepPreviousData: true,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUser,
    onSuccess: () => {
      qc.invalidateQueries(['sa-customers']);
      toast.success('Status customer diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status'),
  });

  const customers = data?.data       || [];
  const total     = data?.pagination?.total     || 0;
  const lastPage  = data?.pagination?.last_page || 1;

  return (
    <SuperAdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="page-title">Kelola Customer</h1>
          <p className="page-subtitle">Manajemen seluruh customer platform</p>
        </div>

        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Customer','Email','No. HP','Terdaftar','Status','Aksi'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} className="table-tr">
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="table-td"><Skeleton className="h-4 w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p>Belum ada customer</p>
                    </td>
                  </tr>
                ) : customers.map(u => (
                  <tr key={u.id} className="table-tr">
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                      </div>
                    </td>
                    <td className="table-td text-slate-500">{u.email}</td>
                    <td className="table-td text-slate-500">{u.phone || '-'}</td>
                    <td className="table-td text-slate-500">{u.created_at ? formatDate(u.created_at) : '-'}</td>
                    <td className="table-td">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
                          : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                      }`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="table-td">
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                        className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {u.is_active
                          ? <ToggleRight size={20} className="text-emerald-500" />
                          : <ToggleLeft size={20} />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isLoading && total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500">Total {total} customer</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 text-xs text-slate-600 dark:text-slate-400">{page} / {lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
