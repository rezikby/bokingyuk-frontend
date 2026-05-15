// Fitur 2: Rating Lapangan - komponen embed di FieldDetail
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFieldRatingsApi, submitRatingApi } from '../../api/rating';
import { Skeleton } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="p-0.5"
        >
          <Star
            size={24}
            className={`transition-colors ${s <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 14 }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={size} className={s <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
    </span>
  );
}

export function FieldRatingsSection({ fieldId, bookingCode }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['field-ratings', fieldId],
    queryFn: () => getFieldRatingsApi(fieldId).then(r => r.data.data),
    enabled: !!fieldId,
  });

  const submitMut = useMutation({
    mutationFn: () => submitRatingApi(bookingCode, { rating, comment }),
    onSuccess: () => {
      toast.success('Rating berhasil dikirim!');
      qc.invalidateQueries({ queryKey: ['field-ratings', fieldId] });
      setShowForm(false); setRating(0); setComment('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Gagal mengirim rating'),
  });

  const reviews = data?.ratings || data || [];
  const avg     = data?.average_rating || data?.avg || 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rating & Ulasan</h3>
          {avg > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarDisplay value={avg} />
              <span className="text-sm text-gray-500">{Number(avg).toFixed(1)} / 5</span>
            </div>
          )}
        </div>
        {bookingCode && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Batal' : '+ Beri Rating'}
          </Button>
        )}
      </div>

      {/* Form rating */}
      {showForm && bookingCode && (
        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800">
          <p className="text-sm font-medium mb-2">Nilai pengalaman kamu:</p>
          <StarInput value={rating} onChange={setRating} />
          <textarea
            placeholder="Tulis ulasanmu... (opsional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            className="w-full mt-3 px-3 py-2 text-sm border rounded-xl resize-none bg-white dark:bg-[#111827] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Button
            className="mt-2 w-full"
            disabled={rating === 0}
            loading={submitMut.isPending}
            onClick={() => submitMut.mutate()}
          >
            Kirim Rating
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Belum ada ulasan untuk lapangan ini</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="flex gap-3 py-3 border-b last:border-0 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {r.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{r.user?.name || 'Pengguna'}</span>
                  <StarDisplay value={r.rating} size={12} />
                </div>
                {r.comment && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
