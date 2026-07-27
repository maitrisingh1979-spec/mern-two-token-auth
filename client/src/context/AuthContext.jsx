import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, registerAuthCallbacks } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);

  // Sync token state helper
  const updateAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    setAccessToken(token);
  }, []);

  // Handle logout
  const logout = useCallback(async () => {
    try {
      const storedRefresh = localStorage.getItem('refreshToken');
      if (storedRefresh) {
        await api.post('/logout', { refreshToken: storedRefresh });
      }
    } catch (err) {
      console.warn('[AuthContext] Server logout notification failed:', err.message);
    } finally {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
      setRefreshTokenState(null);
      updateAccessToken(null);
      setUser(null);
    }
  }, [updateAccessToken]);

  // Handle automatic silent refresh on app load if refreshToken exists
  useEffect(() => {
    // Register Axios interceptor callbacks
    registerAuthCallbacks({
      onTokenRefresh: (newToken) => {
        updateAccessToken(newToken);
      },
      onAuthFailed: () => {
        logout();
      },
    });

    const initAuth = async () => {
      const storedRefresh = localStorage.getItem('refreshToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedRefresh) {
        try {
          const res = await api.post('/refresh', { refreshToken: storedRefresh });
          const newAccess = res.data.accessToken;
          updateAccessToken(newAccess);

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (err) {
          console.error('[AuthContext] Initial token refresh failed on boot:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [updateAccessToken, logout]);

  // Login handler
  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    const { accessToken: newAccess, refreshToken: newRefresh, user: userData } = res.data;

    localStorage.setItem('refreshToken', newRefresh);
    localStorage.setItem('authUser', JSON.stringify(userData));

    setRefreshTokenState(newRefresh);
    updateAccessToken(newAccess);
    setUser(userData);

    return res.data;
  };

  // Signup handler
  const signup = async (email, password) => {
    const res = await api.post('/signup', { email, password });
    return res.data;
  };

  // Manual token refresh trigger
  const refreshAccessToken = async () => {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) throw new Error('No refresh token available');

    const res = await api.post('/refresh', { refreshToken: storedRefresh });
    const newAccess = res.data.accessToken;
    updateAccessToken(newAccess);
    return newAccess;
  };

  // Utility method for assessment testing: Corrupt or expire the Access Token in memory
  // to force the next /api/dashboard call to get a 401 and trigger the Axios interceptor.
  const corruptAccessTokenForTesting = () => {
    const expiredFakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZha2UiLCJleHAiOjE2MDAwMDAwMDB9.invalid_signature';
    updateAccessToken(expiredFakeToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        loading,
        login,
        signup,
        logout,
        refreshAccessToken,
        corruptAccessTokenForTesting,
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
