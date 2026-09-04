import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gw_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gw_token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('gw_token'));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('gw_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('gw_token');
        localStorage.removeItem('gw_user');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAdmin: user?.role === 'admin',
      async login(userId, password) {
        const { data } = await api.post('/auth/login', { userId, password });
        localStorage.setItem('gw_token', data.token);
        localStorage.setItem('gw_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      async register(payload) {
        const { data } = await api.post('/auth/register', payload);
        // Option A: do not keep session until joining is approved
        if (data.joiningPending) {
          localStorage.removeItem('gw_token');
          localStorage.removeItem('gw_user');
          setToken(null);
          setUser(null);
          return data;
        }
        localStorage.setItem('gw_token', data.token);
        localStorage.setItem('gw_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
      },
      logout() {
        localStorage.removeItem('gw_token');
        localStorage.removeItem('gw_user');
        setToken(null);
        setUser(null);
      },
      refreshUser(next) {
        setUser(next);
        localStorage.setItem('gw_user', JSON.stringify(next));
      },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
