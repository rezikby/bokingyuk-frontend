// Fitur 5: Export Laporan API
import api from '../lib/axios';

// Helper: parse pesan error dari response blob
// Axios dengan responseType:'blob' mengembalikan Blob, bukan JSON,
// sehingga e.response.data.message tidak bisa langsung dibaca.
export async function parseBlobError(error) {
  try {
    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      const json = JSON.parse(text);
      return json.message || json.error || 'Terjadi kesalahan pada server.';
    }
    return error.response?.data?.message || error.message || 'Gagal export.';
  } catch {
    return 'Gagal export.';
  }
}

// Semua endpoint menggunakan from/to sesuai backend.
// Parameter start_date/end_date juga diterima oleh backend (normalizeDateParams).
export const exportRevenueApi      = (params) => api.get('/v1/admin/export/revenue',      { params, responseType: 'blob' });
export const exportDailySummaryApi = (params) => api.get('/v1/admin/export/daily-summary', { params, responseType: 'blob' });
export const exportFieldReportApi  = (params) => api.get('/v1/admin/export/field-report',  { params, responseType: 'blob' });

// include_admin=1 → export semua user termasuk admin
// tanpa parameter   → hanya customer
export const exportCustomersApi    = (params) => api.get('/v1/admin/export/customers',     { params, responseType: 'blob' });
export const exportUsersApi        = (params) => api.get('/v1/admin/export/customers',     { params: { ...params, include_admin: 1 }, responseType: 'blob' });