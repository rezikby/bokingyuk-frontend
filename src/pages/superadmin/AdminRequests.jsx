import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock, UserCheck, Trash2, AlertTriangle } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { AdminRequestsProvider, useAdminRequests } from '../../contexts/AdminrequestContext';

const fetchRequests = (params)      => api.get('/v1/super-admin/admin-requests', { params }).then((r) => r.data.data);
const acceptRequest = (id)          => api.post(`/v1/super-admin/admin-requests/${id}/accept`).then((r) => r.data);
const rejectRequest = (id, note)    => api.post(`/v1/super-admin/admin-requests/${id}/reject`, { rejection_note: note }).then((r) => r.data);
const deleteRequest = (id)          => api.delete(`/v1/super-admin/admin-requests/${id}`).then((r) => r.data);
const bulkDelete    = (ids)         => api.post('/v1/super-admin/admin-requests/bulk-delete', { ids }).then((r) => r.data);

const statusColor = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const statusLabel = { pending: 'Menunggu', accepted: 'Diterima', rejected: 'Ditolak' };

function ConfirmDeleteModal({ open, onClose, onConfirm, loading, isBulk, count }) {
  return (
    <Modal open={open} onClose={onClose} title={isBulk ? 'Hapus Semua Terpilih' : 'Hapus Request'}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {isBulk
              ? `Anda akan menghapus ${count} request sekaligus. Tindakan ini tidak dapat dibatalkan.`
              : 'Anda akan menghapus request ini. Tindakan ini tidak dapat dibatalkan.'}
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Batal</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
            <Trash2 size={14} className="mr-1" /> Hapus
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ open, onClose, request, onAccept, onReject, onDelete, accepting, rejecting, deleting }) {
  const [rejectNote,     setRejectNote]     = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);

  if (!request) return null;

  const handleReject = () => {
    onReject(request.id, rejectNote);
    setShowRejectForm(false);
    setRejectNote('');
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Detail Request Admin">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Nama Lengkap', value: request.full_name },
              { label: 'Email',        value: request.email },
              { label: 'No. HP',       value: request.phone },
              { label: 'Alamat',       value: request.address },
            ].map(({ label, value }) => (
              <div key={label} className="col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-medium">{value || '-'}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-0.5">Alasan</p>
              <p className="text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{request.reason}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {request.ktp_image_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">KTP / Identitas</p>
                <a href={request.ktp_image_url} target="_blank" rel="noreferrer">
                  <img src={request.ktp_image_url} alt="KTP" className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
            {request.selfie_image_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Foto Diri</p>
                <a href={request.selfie_image_url} target="_blank" rel="noreferrer">
                  <img src={request.selfie_image_url} alt="Selfie" className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Status:</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[request.status]}`}>
              {statusLabel[request.status]}
            </span>
          </div>

          {request.rejection_note && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium text-xs mb-1">Alasan Penolakan:</p>
              {request.rejection_note}
            </div>
          )}

          {request.status === 'pending' && (
            <div className="pt-2 border-t dark:border-gray-700 space-y-3">
              {showRejectForm ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Alasan penolakan (opsional)..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowRejectForm(false)}>Batal</Button>
                    <Button variant="danger" size="sm" onClick={handleReject} loading={rejecting}>Tolak Request</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => onAccept(request.id)} loading={accepting} size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={14} /> Terima
                  </Button>
                  <Button
                    variant="danger" size="sm"
                    className="flex-1 flex items-center justify-center gap-1"
                    onClick={() => setShowRejectForm(true)}
                  >
                    <XCircle size={14} /> Tolak
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 border-t dark:border-gray-700">
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
            >
              <Trash2 size={13} /> Hapus Request Ini
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        loading={deleting}
        isBulk={false}
        onConfirm={() => {
          onDelete(request.id);
          setConfirmDelete(false);
        }}
      />
    </>
  );
}

function SuperAdminRequestsInner() {
  const qc = useQueryClient();
  const { clearUnread } = useAdminRequests();

  const [search,          setSearch]          = useState('');
  const [status,          setStatus]          = useState('');
  const [page,            setPage]            = useState(1);
  const [selected,        setSelected]        = useState(null);
  const [lastUpdated,     setLastUpdated]     = useState(null);
  const [checkedIds,      setCheckedIds]      = useState([]);
  const [confirmBulk,     setConfirmBulk]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const params = { search, status, page, per_page: 10 };

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-requests', params],
    queryFn: () => fetchRequests(params),
    keepPreviousData: true,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    onSuccess: () => {
      setLastUpdated(new Date());
      clearUnread();
    },
  });

  const invalidate = () => {
    qc.invalidateQueries(['super-admin-requests']);
    qc.invalidateQueries(['super-admin-stats']);
  };

  const acceptMutation = useMutation({
    mutationFn: acceptRequest,
    onSuccess: (res) => { toast.success(res.message || 'Request diterima'); invalidate(); setSelected(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menerima'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }) => rejectRequest(id, note),
    onSuccess: (res) => { toast.success(res.message || 'Request ditolak'); invalidate(); setSelected(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menolak'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: (res) => {
      toast.success(res.message || 'Request dihapus');
      invalidate();
      setSelected(null);
      setConfirmDeleteId(null);
      setCheckedIds((prev) => prev.filter((id) => id !== deleteMutation.variables));
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDelete,
    onSuccess: (res) => {
      toast.success(res.message || `${checkedIds.length} request dihapus`);
      invalidate();
      setCheckedIds([]);
      setConfirmBulk(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal bulk delete'),
  });

  const requests   = data?.data       || [];
  const pagination = data?.pagination || {};

  const allChecked  = requests.length > 0 && requests.every((r) => checkedIds.includes(r.id));
  const someChecked = checkedIds.length > 0;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => prev.filter((id) => !requests.map((r) => r.id).includes(id)));
    } else {
      setCheckedIds((prev) => [...new Set([...prev, ...requests.map((r) => r.id)])]);
    }
  };

  const toggleOne = (id) => {
    setCheckedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Request Admin</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola pengajuan user yang ingin menjadi admin</p>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-400 hidden sm:block self-center">
              Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="accepted">Diterima</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {someChecked && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
            <span className="font-medium text-red-700 dark:text-red-300">
              {checkedIds.length} request dipilih
            </span>
            <button
              onClick={() => setConfirmBulk(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 size={13} /> Hapus Semua Terpilih
            </button>
            <button onClick={() => setCheckedIds([])} className="text-xs text-gray-500 hover:text-gray-700">
              Batal
            </button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="rounded border-gray-300 dark:border-gray-600 accent-purple-600"
                    />
                  </th>
                  {['Pemohon', 'Email', 'No. HP', 'Status', 'Tanggal', 'Aksi'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                      Tidak ada request ditemukan
                    </td>
                  </tr>
                ) : requests.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      checkedIds.includes(r.id) ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="rounded border-gray-300 dark:border-gray-600 accent-purple-600"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{r.full_name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.email}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.phone}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>
                        {r.status === 'pending' && <Clock size={10} className="inline mr-1" />}
                        {statusLabel[r.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(r)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
                          title="Lihat Detail"
                        >
                          <Eye size={14} />
                        </button>
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => acceptMutation.mutate(r.id)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                              title="Terima"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => setSelected(r)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                              title="Tolak"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t dark:border-slate-800">
              <p className="text-sm text-gray-500">
                Halaman {pagination.current_page} dari {pagination.last_page} — {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={page === pagination.last_page}
                  className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        request={selected}
        onAccept={(id) => acceptMutation.mutate(id)}
        onReject={(id, note) => rejectMutation.mutate({ id, note })}
        onDelete={(id) => deleteMutation.mutate(id)}
        accepting={acceptMutation.isPending}
        rejecting={rejectMutation.isPending}
        deleting={deleteMutation.isPending}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        loading={deleteMutation.isPending}
        isBulk={false}
        onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
      />

      <ConfirmDeleteModal
        open={confirmBulk}
        onClose={() => setConfirmBulk(false)}
        loading={bulkDeleteMutation.isPending}
        isBulk
        count={checkedIds.length}
        onConfirm={() => bulkDeleteMutation.mutate(checkedIds)}
      />
    </SuperAdminLayout>
  );
}

export default function SuperAdminRequests() {
  return (
    <AdminRequestsProvider>
      <SuperAdminRequestsInner />
    </AdminRequestsProvider>
  );
}
