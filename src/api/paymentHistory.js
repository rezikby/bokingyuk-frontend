// Fitur 1: Riwayat Pembayaran API
import api from '../lib/axios';

export const getPaymentHistoryApi        = (params)      => api.get('/v1/payment-history', { params });
export const getPaymentHistoryByBookingApi = (bookingCode) => api.get(`/v1/payment-history/booking/${bookingCode}`);

// Admin
export const adminGetPaymentHistoryApi        = (params) => api.get('/v1/admin/payment-history', { params });
export const adminGetPaymentHistoryByBookingApi = (id)   => api.get(`/v1/admin/payment-history/booking/${id}`);
