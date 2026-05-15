import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SuperAdminLayout from '../../components/layout/SuperAdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Search, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const fetchUsers = (params)     => api.get('/v1/super-admin/users', { params }).then(r => r.data.data);
const createUser = (data)       => api.post('/v1/super-admin/users', data).then(r => r.data);
const updateUser = (id, data)   => api.put(`/v1/super-admin/users/${id}`, data).then(r => r.data);
const deleteUser = (id)         => api.delete(`/v1/super-admin/users/${id}`).then(r => r.data);
const toggleUser = (id)         => api.patch(`/v1/super-admin/users/${id}/toggle-active`).then(r => r.data);

const ROLES = ['customer', 'admin', 'super_admin'];

const roleBadgeColor = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  customer:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColor[role] || roleBadgeColor.customer}`}>
      {role}
    </span>
  );
}

function PageButtons({ page, lastPage, onPageChange }) {
  const range = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(lastPage, page + delta);

  if (left > 1) {
    range.push(1);
    if (left > 2) range.push('...');
  }
  for (let i = left; i <= right; i++) range.push(i);
  if (right < lastPage) {
    if (right < lastPage - 1) range.push('...');
    range.push(lastPage);
  }

  return (
    <>
      {range.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 text-sm select-none">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[32px] h-8 px-2 rounded-lg border text-sm transition-colors ${
              p === page
                ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {p}
          </button>
        )
      )}
    </>
  );
}

function UserFormModal({ open, onClose, editData }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(
    editData || { name: '', email: '', password: '', phone: '', role: 'customer', is_active: true }
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) => editData ? updateUser(editData.id, data) : createUser(data),
    onSuccess: () => {
      toast.success(editData ? 'User diperbarui' : 'User dibuat');
      qc.invalidateQueries(['super-admin-users']);
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menyimpan'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (editData && !payload.password) delete payload.password;
    mutation.mutate(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={editData ? 'Edit User' : 'Tambah User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nama" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Nama lengkap" />
        <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="email@example.com" />
        <Input
          label={editData ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
          type="password" value={form.password || ''}
          onChange={e => set('password', e.target.value)}
          required={!editData} placeholder="Min. 8 karakter"
        />
        <Input label="No. HP" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
          <select
            value={form.role}
            onChange={e => set('role', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" loading={mutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
            {editData ? 'Simpan' : 'Buat User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Batal</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Konfirmasi</Button>
      </div>
    </Modal>
  );
}

export default function SuperAdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [role, setRole]           = useState('');
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [toggleId, setToggleId]   = useState(null);

  const params = { search, role, page, per_page: 10, sort_by: 'created_at', sort_dir: 'desc' };

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-users', params],
    queryFn: () => fetchUsers(params),
    keepPreviousData: true,
    refetchInterval: 2_000,
    refetchIntervalInBackground: false,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('User dihapus');
      qc.invalidateQueries(['super-admin-users']);
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleUser,
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries(['super-admin-users']);
      setToggleId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah status'),
  });

  const users      = data?.data       || [];
  const pagination = data?.pagination || {};

  const perPage = pagination.per_page || 10;
  const from    = pagination.total ? (page - 1) * perPage + 1 : 0;
  const to      = pagination.total ? Math.min(page * perPage, pagination.total) : 0;

  const openCreate = ()  => { setEditData(null); setModalOpen(true); };
  const openEdit   = (u) => { setEditData(u);    setModalOpen(true); };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manajemen User</h1>
            <p className="text-gray-500 text-sm mt-0.5">Kelola semua user, admin, dan super admin</p>
          </div>
          <Button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
            <Plus size={16} /> Tambah User
          </Button>
        </div>

        {/* Filter + Search + Total */}
        <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama, email, atau nomor HP..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={role}
            onChange={e => { setRole(e.target.value); setPage(1); }}
            className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Semua Role</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Label jumlah total data */}
          <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm whitespace-nowrap">
            <Users size={14} className="text-purple-500 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">Total:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {isLoading ? '—' : (pagination.total ?? 0)}
            </span>
            <span className="text-gray-400">data</span>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['Nama', 'Email', 'No. HP', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((__, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-semibold text-xs shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.phone || '-'}</td>
                    <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        u.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setToggleId(u.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.is_active
                              ? 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600'
                              : 'hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600'
                          }`}
                          title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t dark:border-slate-800">
              <p className="text-sm text-gray-500 shrink-0">
                Menampilkan{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{from}–{to}</span>
                {' '}dari{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.total}</span>
                {' '}user
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700"
                >
                  <ChevronLeft size={14} />
                </button>

                <PageButtons
                  page={page}
                  lastPage={pagination.last_page}
                  onPageChange={setPage}
                />

                <button
                  onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
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

      {/* Modals */}
      {modalOpen && (
        <UserFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          editData={editData}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title="Hapus User"
        message="User yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus?"
      />

      <ConfirmModal
        open={!!toggleId}
        onClose={() => setToggleId(null)}
        onConfirm={() => toggleMutation.mutate(toggleId)}
        loading={toggleMutation.isPending}
        title="Ubah Status User"
        message="Yakin ingin mengubah status aktif user ini?"
      />
    </SuperAdminLayout>
  );
}