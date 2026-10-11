import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hospital_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('hospital_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('hospital_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('hospital_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired, clearing authentication:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password, role = '') => {
    const payload = { email, password };
    if (role) payload.role = role;

    const data = await api.post('/auth/login', payload);
    localStorage.setItem('hospital_token', data.token);
    localStorage.setItem('hospital_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.post('/auth/register', userData);
    localStorage.setItem('hospital_token', data.token);
    localStorage.setItem('hospital_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const quickDemoLogin = async (targetRole) => {
    const credentials = {
      admin: { email: 'admin@hospital.com', password: 'admin123', role: 'admin' },
      doctor: { email: 'dr.sarah.patel@hospital.com', password: 'doctor123', role: 'doctor' },
      patient: { email: 'john.doe@hospital.com', password: 'patient123', role: 'patient' }
    };
    const cred = credentials[targetRole] || credentials.admin;
    return await login(cred.email, cred.password, cred.role);
  };

  const logout = () => {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        quickDemoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
