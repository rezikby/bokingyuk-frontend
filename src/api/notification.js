// Fitur 3: Notifikasi API
import api from '../lib/axios';

export const getNotificationsApi     = (params) => api.get('/v1/notifications', { params });
export const getUnreadCountApi       = ()        => api.get('/v1/notifications/unread-count');
export const markAllReadApi          = ()        => api.patch('/v1/notifications/read-all');
export const markOneReadApi          = (id)      => api.patch(`/v1/notifications/${id}/read`);
