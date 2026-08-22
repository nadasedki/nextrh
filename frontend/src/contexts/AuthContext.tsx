import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null; 
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user state from localStorage to prevent logouts on F5 page refresh
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Optional: Add logic to fetch user profile using the token on load
      // Example: fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    }
  }, [token]);

  const login = useCallback(
    async (email: string, password: string, role?: UserRole) => {
      try {
        const frontendToBackendRoleMap: Record<UserRole, string> = {
          employee: 'EMPLOYEE',
          manager: 'TEAM_LEADER',
          bid_manager: 'BID_MANAGER',
          admin: 'ADMIN', 
        };

        const response = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            requestedRole: role ? frontendToBackendRoleMap[role] : 'EMPLOYEE',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, message: data.message || 'Login failed' };
        }

        // Store token in localStorage and update state
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);

        // FIX 2: Added 'ADMIN': 'admin' to prevent "Unknown role from backend" crash
        const backendToFrontendRoleMap: Record<string, UserRole> = {
          EMPLOYEE: 'employee',
          TEAM_LEADER: 'manager',
          BID_MANAGER: 'bid_manager',
          ADMIN: 'admin', // <-- ADDED: maps database 'ADMIN' back to frontend 'admin'
        };

        const backendRole = data.user.role?.role_name;
        
        if (!backendRole) {
          return { success: false, message: 'No role assigned to user object' };
        }

        const mappedRole = backendToFrontendRoleMap[backendRole];
        if (!mappedRole) return { success: false, message: 'Unknown role from backend' };

        const loggedUser: User = {
          id: data.user.user_id.toString(),
          email: data.user.email,
          name: data.user.full_name || data.user.email,
          role: mappedRole,
        };

        // FIX 3: Persist user object in localStorage so F5 page refresh keeps the session alive
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        
        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, message: 'Network or server error' };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    // Clean up both token and user object completely on logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, role };
      localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep state in sync
      return updatedUser;
    });
  }, []);

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      return { success: response.ok, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token, 
        isAuthenticated: !!token, 
        login, 
        logout, 
        switchRole, 
        forgotPassword, 
        resetPassword 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};