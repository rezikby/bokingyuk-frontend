import api from '../lib/axios';

export const getFieldsApi        = (params) => api.get('/v1/fields', { params });
export const getFieldApi         = (id)     => api.get(`/v1/fields/${id}`);

// Admin — menggunakan FormData untuk mendukung upload gambar
export const adminGetFieldsApi   = (params) => api.get('/v1/admin/fields', { params });

export const adminCreateFieldApi = (data) =>
  api.post('/v1/admin/fields', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const adminUpdateFieldApi = (id, data) =>
  // Laravel tidak mendukung PUT dengan FormData, gunakan POST + _method=PUT
  api.post(`/v1/admin/fields/${id}`, appendMethod(data, 'PUT'), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const adminDeleteFieldApi = (id) => api.delete(`/v1/admin/fields/${id}`);

// Helper: tambahkan _method ke FormData untuk method spoofing Laravel
function appendMethod(data, method) {
  if (data instanceof FormData) {
    data.append('_method', method);
    return data;
  }
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  fd.append('_method', method);
  return fd;
}
