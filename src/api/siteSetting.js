import api from '../lib/axios';

export const getSiteSettingsApi        = ()           => api.get('/v1/super-admin/settings');
export const getSiteSettingsByGroupApi = (group)      => api.get(`/v1/super-admin/settings/${group}`);
export const updateSiteSettingApi      = (key, data)  => api.patch(`/v1/super-admin/settings/${key}`, data);
export const updateManySiteSettingsApi = (data)       => api.put('/v1/super-admin/settings', data);
