import api from '../lib/axios';

export const getBookingsApi         = ()         => api.get('/v1/bookings');
export const getBookingApi          = (code)     => api.get(`/v1/bookings/${code}`);
export const createBookingApi       = (data)     => api.post('/v1/bookings', data);
export const cancelBookingApi       = (code)     => api.patch(`/v1/bookings/${code}/cancel`);
export const getAvailableSlotsApi   = (params)   => api.get('/v1/bookings/available-slots', { params });
export const refreshPaymentTokenApi = (code)     => api.post(`/v1/bookings/${code}/refresh-payment-token`);

// ← BARU: polling status pembayaran langsung ke Midtrans via backend
// Dipanggil customer setiap 3 detik di halaman Payment.jsx
// Backend cek ke Midtrans & auto-confirm jika sudah lunas
export const checkPaymentStatusApi  = (code)     => api.get(`/v1/bookings/${code}/check-payment`);

// Admin
export const adminGetBookingsApi     = (params)   => api.get('/v1/admin/bookings', { params });
export const adminGetBookingApi      = (code)     => api.get(`/v1/admin/bookings/${code}`);
export const adminCheckInApi         = (qr_token) => api.post('/v1/admin/bookings/check-in', { qr_token });
export const adminCancelBookingApi   = (code)     => api.patch(`/v1/admin/bookings/${code}/cancel`);
export const adminConfirmPaymentApi  = (code)     => api.patch(`/v1/admin/bookings/${code}/confirm-payment`);
export const adminSyncPaymentsApi    = ()         => api.get('/v1/admin/bookings/sync-payments');