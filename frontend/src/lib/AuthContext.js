import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authMe, authLogin, authRegister, authLogout, authRefresh } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=checking, false=not auth, object=auth
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const u = await authMe();
      setUser(u);
    } catch {
      // Try refresh
      try {
        await authRefresh();
        const u = await authMe();
        setUser(u);
      } catch {
        setUser(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const u = await authLogin(email, password);
    setUser(u);
    return u;
  };

  const register = async (email, password, name) => {
    const u = await authRegister(email, password, name);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await authLogout();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
