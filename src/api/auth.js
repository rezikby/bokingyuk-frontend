import api from '../lib/axios';

export const loginApi           = (data) => api.post('/auth/login', data);
export const registerApi        = (data) => api.post('/auth/register', data);
export const logoutApi          = ()     => api.post('/auth/logout');
export const getMeApi           = ()     => api.get('/auth/me');
export const googleRedirectApi  = ()     => api.get('/auth/google');
// export const googleCallbackApi  = (access_token) => api.post('/auth/google/callback', { access_token });
