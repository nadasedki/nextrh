import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';

// 1. Updated interface to include token
interface AuthContextType {
  user: User | null;
  token: string | null; // <-- Added token property
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // 2. Initialize token state from localStorage
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Optional: Add logic to fetch user profile using the token on load
  useEffect(() => {
    if (token) {
      // Validate token with backend and set user
      // Example: fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    }
  }, [token]);

  const login = useCallback(
    async (email: string, password: string, role?: UserRole) => {
      try {
        // Map frontend role to backend role string
        const frontendToBackendRoleMap: Record<UserRole, string> = {
          employee: 'EMPLOYEE',
          manager: 'TEAM_LEADER',
          bid_manager: 'BID_MANAGER',
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

        // 3. Store token in localStorage and update state
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);

        // Map backend role back to frontend
        const backendToFrontendRoleMap: Record<string, UserRole> = {
          EMPLOYEE: 'employee',
          TEAM_LEADER: 'manager',
          BID_MANAGER: 'bid_manager',
        };

        const mappedRole = backendToFrontendRoleMap[data.user.roles[0]];
        if (!mappedRole) return { success: false, message: 'Unknown role from backend' };

        const loggedUser: User = {
          id: data.user.user_id.toString(),
          email: data.user.email,
          name: data.user.full_name || data.user.email,
          role: mappedRole,
        };

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
    // 4. Remove token from localStorage and clear state
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser(prev => (prev ? { ...prev, role } : null));
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
        token, // 5. Provide token to context consumers
        isAuthenticated: !!token, // 6. Updated to use token for auth status
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