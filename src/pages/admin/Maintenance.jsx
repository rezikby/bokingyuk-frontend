import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminGetMaintenancesApi,
  adminCreateMaintenanceApi,
  adminUpdateMaintenanceApi,
  adminCancelMaintenanceApi,
  adminBulkDeleteMaintenanceApi,
} from '../../api/maintenance';
import { adminGetFieldsApi } from '../../api/field';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { Wrench, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_LABEL = {
  scheduled:   { label: 'Terjadwal',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'Berlangsung', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed:   { label: 'Selesai',     cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:   { label: 'Dibatalkan',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  );
}

const EMPTY = {
  field_id: '', title: '', description: '',
  maintenance_date: '', start_time: '', end_time: '', status: 'scheduled',
};

function fmtDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildCreatePayload(form) {
  const p = {};
  if (form.field_id)         p.field_id         = parseInt(form.field_id, 10);
  if (form.title)            p.title            = form.title;
  if (form.description)      p.description      = form.description;
  if (form.maintenance_date) p.maintenance_date = form.maintenance_date;
  if (form.start_time)       p.start_time       = form.start_time.slice(0, 5);
  if (form.end_time)         p.end_time         = form.end_time.slice(0, 5);
  return p;
}

function buildUpdatePayload(form) {
  const p = {};
  if (form.title)            p.title            = form.title;
  if (form.description)      p.description      = form.description;
  if (form.maintenance_date) p.maintenance_date = form.maintenance_date;
  if (form.start_time)       p.start_time       = form.start_time.slice(0, 5);
  if (form.end_time)         p.end_time         = form.end_time.slice(0, 5);
  if (form.status)           p.status           = form.status;
  return p;
}

// Status yang boleh di-bulk delete
const DELETABLE_STATUSES = ['completed', 'cancelled'];

export default function Maintenance() {
  const qc = useQueryClient();

  const [modal, setModal]         = useState(null); // 'create' | 'edit' | 'confirm-bulk'
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [page, setPage]           = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Fetch fields ──────────────────────────────────────────────────────────
  const { data: fields = [] } = useQuery({
    queryKey: ['admin-fields-select'],
    queryFn: () => adminGetFieldsApi().then(r => {
      const items = r?.data?.data?.data;
      if (Array.isArray(items)) return items;
      const alt = r?.data?.data;
      return Array.isArray(alt) ? alt : [];
    }),
  });

  // ── Fetch maintenances ────────────────────────────────────────────────────
  const { data: mainRes, isLoading } = useQuery({
    queryKey: ['admin-maintenances', page],
    queryFn: () => adminGetMaintenancesApi({ page }).then(r => r?.data?.data ?? {}),
    keepPreviousData: true,
  });
  const maintenances = mainRes?.data ?? [];
  const meta         = mainRes?.meta ?? {};

  // Item yang boleh dipilih untuk bulk delete (hanya completed/cancelled)
  const deletableItems = maintenances.filter(m => DELETABLE_STATUSES.includes(m.status));
  const allDeletableIds = deletableItems.map(m => m.id);

  // ── Error handler ─────────────────────────────────────────────────────────
  const handleError = (e) => {
    const errData = e.response?.data;
    if (errData?.errors) {
      const firstMsg = Object.values(errData.errors).flat()[0];
      toast.error(firstMsg || 'Validasi gagal');
    } else {
      toast.error(errData?.message || 'Terjadi kesalahan');
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () => adminCreateMaintenanceApi(buildCreatePayload(form)),
    onSuccess: () => {
      toast.success('Maintenance dijadwalkan');
      qc.invalidateQueries({ queryKey: ['admin-maintenances'] });
      setModal(null);
      setForm(EMPTY);
    },
    onError: handleError,
  });

  const updateMut = useMutation({
    mutationFn: () => adminUpdateMaintenanceApi(editId, buildUpdatePayload(form)),
    onSuccess: () => {
      toast.success('Maintenance diperbarui');
      qc.invalidateQueries({ queryKey: ['admin-maintenances'] });
      setModal(null);
    },
    onError: handleError,
  });

  const cancelMut = useMutation({
    mutationFn: (id) => adminCancelMaintenanceApi(id),
    onSuccess: () => {
      toast.success('Maintenance dibatalkan');
      qc.invalidateQueries({ queryKey: ['admin-maintenances'] });
    },
    onError: handleError,
  });

  const bulkDeleteMut = useMutation({
    mutationFn: () => adminBulkDeleteMaintenanceApi([...selectedIds]),
    onSuccess: (res) => {
      toast.success(res?.data?.message || 'Maintenance berhasil dihapus');
      qc.invalidateQueries({ queryKey: ['admin-maintenances'] });
      setSelectedIds(new Set());
      setModal(null);
    },
    onError: (e) => {
      setModal(null);
      handleError(e);
    },
  });

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected =
    allDeletableIds.length > 0 &&
    allDeletableIds.every(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allDeletableIds));
    }
  };

  // ── Edit modal ────────────────────────────────────────────────────────────
  const openEdit = (m) => {
    setForm({
      field_id:         String(m.field_id ?? ''),
      title:            m.title            ?? '',
      description:      m.description      ?? '',
      maintenance_date: (m.maintenance_date ?? '').slice(0, 10),
      start_time:       (m.start_time ?? '').slice(0, 5),
      end_time:         (m.end_time   ?? '').slice(0, 5),
      status:           m.status ?? 'scheduled',
    });
    setEditId(m.id);
    setModal('edit');
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const inp = 'w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-[#111827] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wrench size={22} className="text-indigo-600" />
            <h1 className="text-xl font-bold">Jadwal Maintenance</h1>
          </div>
          <Button onClick={() => { setForm(EMPTY); setModal('create'); }}>
            <Plus size={16} className="mr-1" /> Tambah
          </Button>
        </div>

        {/* ── Bulk action bar ── */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">
              {selectedIds.size} item dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                onClick={() => setSelectedIds(new Set())}
              >
                Batal pilih
              </button>
              <Button
                size="sm"
                variant="danger"
                loading={bulkDeleteMut.isPending}
                onClick={() => setModal('confirm-bulk')}
              >
                <Trash2 size={14} className="mr-1" /> Hapus {selectedIds.size} item
              </Button>
            </div>
          </div>
        )}

        {/* ── Select all row ── */}
        {!isLoading && deletableItems.length > 0 && (
          <label className="flex items-center gap-2 mb-3 text-xs text-gray-500 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="rounded accent-indigo-600"
            />
            Pilih semua yang bisa dihapus ({deletableItems.length} item)
          </label>
        )}

        {/* ── List ── */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : maintenances.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <Wrench size={36} className="mx-auto mb-3 opacity-30" />
            <p>Belum ada jadwal maintenance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {maintenances.map(m => {
              const isDeletable = DELETABLE_STATUSES.includes(m.status);
              const isChecked   = selectedIds.has(m.id);
              return (
                <div
                  key={m.id}
                  className={`card p-4 flex items-start gap-3 transition-colors ${
                    isChecked ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
                  }`}
                >
                  {/* Checkbox — hanya muncul untuk item yang bisa dihapus */}
                  <div className="pt-0.5 w-4 shrink-0">
                    {isDeletable && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(m.id)}
                        className="rounded accent-indigo-600 cursor-pointer"
                        title="Pilih untuk dihapus"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">{m.title}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-gray-500">{m.field?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {fmtDate(m.maintenance_date)} &nbsp;·&nbsp;
                      {(m.start_time ?? '').slice(0, 5)} – {(m.end_time ?? '').slice(0, 5)}
                    </p>
                    {m.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>
                    )}
                  </div>

                  {/* Aksi per-item */}
                  <div className="flex gap-2 shrink-0">
                    {['scheduled', 'in_progress'].includes(m.status) && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEdit(m)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={cancelMut.isPending}
                          onClick={() => {
                            if (confirm('Batalkan maintenance ini?')) cancelMut.mutate(m.id);
                          }}
                        >
                          Batal
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {meta.last_page > 1 && (
          <div className="flex justify-center gap-3 mt-6">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm self-center">{page} / {meta.last_page}</span>
            <Button size="sm" variant="outline" disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}

        {/* ── Modal create / edit ── */}
        <Modal
          open={modal === 'create' || modal === 'edit'}
          onClose={() => setModal(null)}
          title={modal === 'create' ? 'Jadwalkan Maintenance' : 'Edit Maintenance'}
        >
          <div className="space-y-4">

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Lapangan</label>
              <select value={form.field_id} onChange={set('field_id')} className={inp}>
                <option value="">-- Pilih Lapangan --</option>
                {fields.map(f => (
                  <option key={f.id} value={String(f.id)}>{f.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Judul</label>
              <input value={form.title} onChange={set('title')} className={inp} placeholder="Judul maintenance..." />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Tanggal Maintenance</label>
              <input type="date" value={form.maintenance_date} onChange={set('maintenance_date')} className={inp} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Jam Mulai</label>
                <input type="time" value={form.start_time} onChange={set('start_time')} className={inp} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Jam Selesai</label>
                <input type="time" value={form.end_time} onChange={set('end_time')} className={inp} />
              </div>
            </div>

            {modal === 'edit' && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
                <select value={form.status} onChange={set('status')} className={inp}>
                  <option value="scheduled">Terjadwal</option>
                  <option value="in_progress">Berlangsung</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Deskripsi (opsional)</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className={`${inp} resize-none`}
                placeholder="Catatan maintenance..."
              />
            </div>

            <Button
              className="w-full"
              loading={createMut.isPending || updateMut.isPending}
              onClick={() => modal === 'create' ? createMut.mutate() : updateMut.mutate()}
            >
              {modal === 'create' ? 'Jadwalkan' : 'Simpan Perubahan'}
            </Button>

          </div>
        </Modal>

        {/* ── Modal konfirmasi bulk delete ── */}
        <Modal
          open={modal === 'confirm-bulk'}
          onClose={() => setModal(null)}
          title="Konfirmasi Hapus"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Anda akan menghapus <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedIds.size} maintenance</span> secara permanen.
              Tindakan ini tidak bisa dibatalkan.
            </p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
              Hanya maintenance berstatus <strong>Selesai</strong> atau <strong>Dibatalkan</strong> yang bisa dihapus.
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModal(null)}
              >
                Kembali
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={bulkDeleteMut.isPending}
                onClick={() => bulkDeleteMut.mutate()}
              >
                <Trash2 size={14} className="mr-1" /> Ya, Hapus
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  );
}