import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogsApi } from '../../api/auditLog';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/format';

const METHOD_COLOR = {
  POST:   'bg-green-100 text-green-700',
  PUT:    'bg-blue-100 text-blue-700',
  PATCH:  'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  GET:    'bg-gray-100 text-gray-600',
};

export default function AuditLog() {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: () => getAuditLogsApi({ page, search, per_page: 20 }).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const logs     = data?.data || [];
  const lastPage = data?.last_page || 1;
  const total    = data?.total || 0;

  return (
    <SuperAdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShieldAlert size={22} className="text-purple-600" />
          <h1 className="text-xl font-bold">Audit Log</h1>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari aksi, user, URL..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-white dark:bg-[#111827] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">{[...Array(10)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : logs.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <ShieldAlert size={36} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada audit log</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <tr>
                    {['Waktu', 'User', 'Method', 'URL', 'Status', 'IP'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{log.user?.name || 'Guest'}</span>
                        <p className="text-xs text-gray-400">{log.user?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${METHOD_COLOR[log.method] || 'bg-gray-100 text-gray-600'}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate font-mono">{log.url || log.path}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${log.status_code >= 400 ? 'text-red-500' : 'text-green-600'}`}>
                          {log.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">Total {total} log</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-500">{page} / {lastPage}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === lastPage}
                className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
