// Fitur 2: Manajemen Rating (Admin)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetRatingsApi, adminToggleRatingApi } from '../../api/rating';
import AdminLayout from '../../components/layout/AdminLayout';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { Star, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function StarDisplay({ value }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={12} className={s <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
    </span>
  );
}

export default function RatingManagement() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ratings', page],
    queryFn: () => adminGetRatingsApi({ page }).then(r => r.data),
    keepPreviousData: true,
  });

  const toggleMut = useMutation({
    mutationFn: (id) => adminToggleRatingApi(id),
    onSuccess: () => { toast.success('Visibilitas diperbarui'); qc.invalidateQueries({ queryKey: ['admin-ratings'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal'),
  });

  const ratings = Array.isArray(data?.data) ? data.data : [];
  const meta    = data?.meta || {};

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Star size={22} className="text-yellow-500" />
          <h1 className="text-xl font-bold">Manajemen Rating</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : ratings.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Star size={36} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada rating</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ratings.map(r => (
              <div key={r.id} className={`card p-4 flex items-start justify-between gap-4 ${!r.is_visible ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StarDisplay value={r.rating} />
                    <span className="text-xs text-gray-500">{r.user?.name}</span>
                    <span className="text-xs text-gray-400">— {r.field?.name}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{r.comment}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${r.is_visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_visible ? 'Ditampilkan' : 'Disembunyikan'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={toggleMut.isPending}
                  onClick={() => toggleMut.mutate(r.id)}
                  title={r.is_visible ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {r.is_visible ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>
            ))}
          </div>
        )}

        {meta.last_page > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm self-center">{page} / {meta.last_page}</span>
            <Button size="sm" variant="outline" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
