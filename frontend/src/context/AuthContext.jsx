import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, clearAccessToken } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);

  // On mount: try to refresh ONLY if this tab has a session marker
  useEffect(() => {
    const hasSessionInTab = sessionStorage.getItem('sessionActive') === 'true';
    if (hasSessionInTab) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      // Try refreshing first to get a new access token via session cookie
      const { data: refreshData } = await api.post('/auth/refresh-token');
      setAccessToken(refreshData.accessToken);

      const { data } = await api.get('/user/profile');
      setUser(data.user);
    } catch {
      // No valid session — user not logged in, just clear state
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback((userData, token) => {
    setUser(userData);
    setAccessToken(token);
    sessionStorage.setItem('sessionActive', 'true');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    clearAccessToken();
    setUser(null);
    sessionStorage.removeItem('sessionActive');
    window.location.href = '/'; // Always redirect to home on logout
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const { data } = await api.post('/auth/refresh-token');
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        updateUser,
        refreshAccessToken,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
