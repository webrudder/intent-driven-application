import { useState, useCallback } from 'react';

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('idapp_token'));

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem('idapp_token', newToken);
    setToken(newToken);
  }, []);

  const clearToken = useCallback(() => {
    localStorage.removeItem('idapp_token');
    setToken(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, saveToken, clearToken, isAuthenticated };
}