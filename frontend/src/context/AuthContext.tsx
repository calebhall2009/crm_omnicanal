import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Define structures matching backend
export interface Company {
  id: number;
  name: string | null;
  industry: string | null;
  team_size: string | null;
  channels: string[] | null;
  main_goal: string | null;
  onboarded: boolean;
  subscription?: {
    plan?: {
      slug?: string;
      max_messages?: number;
    };
  };
}

export interface User {
  id: number;
  company_id: number;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'agent';
  company?: Company;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  backendUrl: string;
  fetchApi: (endpoint: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

// Sanctum hands the CSRF token to the SPA via the XSRF-TOKEN cookie.
// Laravel's VerifyCsrfToken middleware accepts it back in the
// X-XSRF-TOKEN header (URL-decoded) on stateful requests.
const getXsrfToken = (): string => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper function to fetch CSRF token from Sanctum
  const fetchCsrf = async () => {
    await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });
  };

  const refreshUser = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    await fetchCsrf();
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getXsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Login failed');
    }

    await refreshUser();
  };

  const register = async (data: any) => {
    await fetchCsrf();
    const res = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-XSRF-TOKEN': getXsrfToken(),
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    await refreshUser();
  };

  const logout = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (res.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (data: any) => {
    try {
      await fetchCsrf();
      const res = await fetch(`${BACKEND_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Onboarding update failed');
      }

      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const fetchApi = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-XSRF-TOKEN': getXsrfToken(),
      'X-Requested-With': 'XMLHttpRequest',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        completeOnboarding,
        refreshUser,
        backendUrl: BACKEND_URL,
        fetchApi,
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
