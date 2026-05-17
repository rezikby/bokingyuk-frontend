// Auth Context: simpan user+token, login/logout/register
import { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, logoutApi, getMeApi } from '../api/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(() => {
    try { return JSON.parse(localStorage.getItem('bokingyuk_user')); } catch { return null; }
  });
  const [token, setToken]           = useState(() => localStorage.getItem('bokingyuk_token'));
  const [loading, setLoading]       = useState(false);
  const [initializing, setInitializing] = useState(true); // ← BARU: cegah redirect sebelum siap

  // Selesai inisialisasi setelah mount pertama
  useEffect(() => {
    setInitializing(false);
  }, []);

  const saveAuth = (u, t) => {
    setUser(u); setToken(t);
    localStorage.setItem('bokingyuk_token', t);
    localStorage.setItem('bokingyuk_user', JSON.stringify(u));
  };

  const clearAuth = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('bokingyuk_token');
    localStorage.removeItem('bokingyuk_user');
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem('bokingyuk_user', JSON.stringify(u));
  };

  const login = async (data) => {
    setLoading(true);
    try {
      const res = await loginApi(data);
      const { user: u, token: t } = res.data.data;
      saveAuth(u, t);
      toast.success('Login berhasil!');
      return { success: true, user: u };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal';
      toast.error(msg);
      return { success: false, errors: err.response?.data?.errors };
    } finally { setLoading(false); }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await registerApi(data);
      const { user: u, token: t } = res.data.data;
      saveAuth(u, t);
      toast.success('Registrasi berhasil!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal';
      toast.error(msg);
      return { success: false, errors: err.response?.data?.errors };
    } finally { setLoading(false); }
  };

  const googleLogin = async (sanctumToken) => {
    setLoading(true);
    try {
      localStorage.setItem('bokingyuk_token', sanctumToken);
      const res = await getMeApi();
      const u = res.data.data;
      saveAuth(u, sanctumToken);
      toast.success('Login Google berhasil!');
      return { success: true, user: u };
    } catch (err) {
      localStorage.removeItem('bokingyuk_token');
      toast.error('Login Google gagal');
      return { success: false };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try { await logoutApi(); } catch {}
    clearAuth();
    toast.success('Logout berhasil');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await getMeApi();
      updateUser(res.data.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      initializing, // ← BARU: expose ke seluruh app
      login,
      register,
      logout,
      refreshUser,
      updateUser,
      googleLogin,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);