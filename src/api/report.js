import api from '../lib/axios';

export const getRevenueApi       = (params)   => api.get('/v1/admin/reports/revenue', { params });
export const getPredictBusyApi   = (fieldId)  => api.get(`/v1/admin/reports/predict-busy-hours/${fieldId}`);
