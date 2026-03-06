import { api } from './api';
import { useAuthStore } from '../stores/authStore';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export async function register(email: string, password: string, displayName?: string) {
  const { data } = await api.post<AuthResponse>('/api/v1/auth/register', {
    email,
    password,
    display_name: displayName,
  });
  useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
  await fetchMe();
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/v1/auth/login', {
    email,
    password,
  });
  useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
  await fetchMe();
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/api/v1/auth/me');
  useAuthStore.getState().setUser(data);
  return data;
}

export async function updateProfile(updates: {
  display_name?: string;
  location_lat?: number;
  location_lng?: number;
  hardiness_zone?: string;
}) {
  const { data } = await api.patch('/api/v1/auth/me', updates);
  useAuthStore.getState().setUser(data);
  return data;
}
