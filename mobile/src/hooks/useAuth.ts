import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import * as authService from '../services/auth';

export function useAuth() {
  const { user, isAuthenticated, logout: storeLogout } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    await authService.register(email, password, displayName);
  }, []);

  const signOut = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const refreshProfile = useCallback(async () => {
    await authService.fetchMe();
  }, []);

  return { user, isAuthenticated, signIn, signUp, signOut, refreshProfile };
}
