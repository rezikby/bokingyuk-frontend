// Fitur 4: Jadwal Maintenance API
import api from '../lib/axios';

export const adminGetMaintenancesApi  = (params) => api.get('/v1/admin/maintenances', { params });
export const adminGetMaintenanceApi   = (id)     => api.get(`/v1/admin/maintenances/${id}`);
export const adminCreateMaintenanceApi= (data)   => api.post('/v1/admin/maintenances', data);
export const adminUpdateMaintenanceApi= (id, data) => api.put(`/v1/admin/maintenances/${id}`, data);
export const adminCancelMaintenanceApi= (id)     => api.patch(`/v1/admin/maintenances/${id}/cancel`);
export const adminBulkDeleteMaintenanceApi = (ids) =>api.delete('/v1/admin/maintenances/bulk-delete', { data: { ids } });