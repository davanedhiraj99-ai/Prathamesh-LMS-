import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios-instance.js';
import { clearAuthSession, getStoredUser, setAccessToken, setStoredUser } from '../utils/auth-session.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      try {
        const response = await axios.post('/refresh');
        const { token, user: nextUser } = response.data || {};

        if (token && nextUser) {
          setAccessToken(token);
          setStoredUser(nextUser);
          setUser(nextUser);
        }
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await axios.post('/login', { email, password });
    const { token, user: nextUser } = response.data || {};

    if (!token || !nextUser) {
      const err = new Error('Invalid login response');
      err.code = 'INVALID_LOGIN_RESPONSE';
      throw err;
    }

    setAccessToken(token);
    setStoredUser(nextUser);
    setUser(nextUser);

    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post('/logout');
    } catch {
      // ignore
    } finally {
      clearAuthSession();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
