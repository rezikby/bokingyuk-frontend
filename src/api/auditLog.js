import api from '../lib/axios';

export const getAuditLogsApi    = (params)      => api.get('/v1/super-admin/audit-logs',                  { params });
export const getAuditSummaryApi = ()            => api.get('/v1/super-admin/audit-logs/summary');
export const getAuditByModelApi = (type, id)    => api.get(`/v1/super-admin/audit-logs/model/${type}/${id}`);
export const pruneAuditLogsApi  = (params)      => api.delete('/v1/super-admin/audit-logs/prune',         { params });
