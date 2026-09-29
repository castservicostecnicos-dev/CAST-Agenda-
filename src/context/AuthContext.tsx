import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService, loadLocal, saveLocal } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  activeDashboard: 'master' | 'technician';
  login: (emailOrUser: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchDashboard: (dashboard: 'master' | 'technician') => void;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'cast_auth_user_v1';
const ACTIVE_DASHBOARD_KEY = 'cast_active_dashboard_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    return loadLocal<User | null>(AUTH_USER_KEY, null);
  });

  const [activeDashboard, setActiveDashboard] = useState<'master' | 'technician'>(() => {
    const saved = loadLocal<'master' | 'technician' | null>(ACTIVE_DASHBOARD_KEY, null);
    if (saved) return saved;
    const u = loadLocal<User | null>(AUTH_USER_KEY, null);
    return u?.role === 'master' ? 'master' : 'technician';
  });

  const storage = StorageService.getInstance();

  const refreshUserData = () => {
    if (!user) return;
    const users = storage.getUsers();
    const found = users.find(u => u.id === user.id);
    if (found) {
      if (found.status === 'inactive') {
        logout();
      } else {
        setUser(found);
        saveLocal(AUTH_USER_KEY, found);
      }
    }
  };

  const login = (emailOrUser: string, pass: string) => {
    const cleanInput = emailOrUser.trim().toLowerCase();
    const users = storage.getUsers();
    
    const matched = users.find(u => 
      u.email.toLowerCase() === cleanInput || 
      u.name.toLowerCase() === cleanInput ||
      u.email.toLowerCase().split('@')[0] === cleanInput
    );

    if (!matched) {
      return { success: false, error: 'Usuário ou e-mail não encontrado.' };
    }

    if (matched.status === 'inactive') {
      return { success: false, error: 'Usuário desativado. Contate o administrador da CAST.' };
    }

    // Password check (fallback '123' if not explicitly defined)
    const validPassword = matched.password || '123';
    if (pass !== validPassword) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    // Login successful
    setUser(matched);
    saveLocal(AUTH_USER_KEY, matched);

    // Initial dashboard routing
    const targetDash = matched.role === 'master' ? 'master' : 'technician';
    setActiveDashboard(targetDash);
    saveLocal(ACTIVE_DASHBOARD_KEY, targetDash);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(ACTIVE_DASHBOARD_KEY);
  };

  const switchDashboard = (dashboard: 'master' | 'technician') => {
    if (user?.role !== 'master' && dashboard === 'master') {
      return; // Regular technician cannot switch to master dashboard
    }
    setActiveDashboard(dashboard);
    saveLocal(ACTIVE_DASHBOARD_KEY, dashboard);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeDashboard,
        login,
        logout,
        switchDashboard,
        refreshUserData,
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
