import api from '../lib/axios';

// ── Customer ──────────────────────────────────────────────────────────────────
export const getNotificationsApi      = (params) => api.get('/v1/notifications', { params });
export const getUnreadCountApi        = ()        => api.get('/v1/notifications/unread-count');
export const markNotificationReadApi  = (id)      => api.patch(`/v1/notifications/${id}/read`);
export const markAllNotificationsRead = ()        => api.patch('/v1/notifications/read-all');

// Alias backward-compat (pakai nama lama di file lain yang belum diupdate)
export const markAllReadApi  = markAllNotificationsRead;
export const markOneReadApi  = markNotificationReadApi;

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminGetNotificationsApi      = (params) => api.get('/v1/admin/notifications', { params });
export const adminGetUnreadCountApi        = ()        => api.get('/v1/admin/notifications/unread-count');
export const adminMarkNotificationReadApi  = (id)      => api.patch(`/v1/admin/notifications/${id}/read`);
export const adminMarkAllNotificationsRead = ()        => api.patch('/v1/admin/notifications/read-all');