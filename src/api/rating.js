// Fitur 2: Rating Lapangan API
import api from '../lib/axios';

export const getFieldRatingsApi     = (fieldId) => api.get(`/v1/fields/${fieldId}/ratings`);
export const submitRatingApi        = (bookingCode, data) => api.post(`/v1/bookings/${bookingCode}/rating`, data);

// Admin
export const adminGetRatingsApi     = (params)  => api.get('/v1/admin/ratings', { params });
export const adminToggleRatingApi   = (id)       => api.patch(`/v1/admin/ratings/${id}/toggle-visibility`);
