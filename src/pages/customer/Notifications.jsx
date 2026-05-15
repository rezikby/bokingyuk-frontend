// Fitur 3: Notifikasi (Customer)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificationsApi, markAllReadApi, markOneReadApi } from '../../api/notification';
import Navbar from '../../components/layout/Navbar';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { Bell, CheckCheck, Circle } from 'lucide-react';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';

export default function Notifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsApi().then(r => r.data.data),
  });

  const markAllMut = useMutation({
    mutationFn: markAllReadApi,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Semua notifikasi ditandai dibaca'); },
  });

  const markOneMut = useMutation({
    mutationFn: (id) => markOneReadApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.notifications?.data ?? [];
  const unread = data?.unread_count ?? 0;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={22} className="text-purple-600" />
            <h1 className="text-xl font-bold">Notifikasi</h1>
            {unread > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" loading={markAllMut.isPending} onClick={() => markAllMut.mutate()}>
              <CheckCheck size={15} className="mr-1" /> Tandai semua
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => { if (!n.read_at) markOneMut.mutate(n.id); }}
                className={`w-full text-left card p-4 flex items-start gap-3 hover:shadow-md transition-shadow ${!n.read_at ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10' : ''}`}
              >
                <Circle
                  size={8}
                  className={`mt-1.5 shrink-0 ${!n.read_at ? 'fill-purple-500 text-purple-500' : 'text-gray-300 fill-gray-300'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read_at ? 'font-semibold' : 'font-normal text-gray-600 dark:text-gray-400'}`}>
                    {n.title || n.data?.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message || n.data?.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}