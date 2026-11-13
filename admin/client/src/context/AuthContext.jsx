import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const qToken = urlParams.get('token');
        const qUser = urlParams.get('user');
        if (qToken) {
          api.setToken(qToken);
          if (qUser) {
            localStorage.setItem('zync_user', qUser);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}

      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fast check: bounce non-admin users immediately without destroying their student session
      const savedUserStr = localStorage.getItem('zync_user');
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.role && parsed.role.toLowerCase() !== 'admin') {
            if (window.location.port === '5171') {
              window.location.href = `http://${window.location.hostname}:5172`;
            } else {
              window.location.href = '/';
            }
            return;
          }
        } catch (e) {}
      }

      try {
        const data = await api.getMe();
        if (data.user && data.user.role === 'admin') {
          setUser(data.user);
        } else {
          // Bounce non-admin users back to root
          if (window.location.port === '5171') {
            window.location.href = `http://${window.location.hostname}:5172`;
          } else {
            window.location.href = '/';
          }
          return;
        }
      } catch (err) {
        api.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
