import { api } from './api';

export interface AppNotification {
  id: string;
  tier: string;
  category: string;
  title: string;
  body: string;
  is_read: boolean;
  plant_id: string | null;
  created_at: string;
}

export async function listNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const { data } = await api.get<AppNotification[]>('/api/v1/notifications', {
    params: { unread_only: unreadOnly },
  });
  return data;
}

export async function markRead(alertId: string): Promise<void> {
  await api.patch(`/api/v1/notifications/${alertId}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.patch('/api/v1/notifications/read-all');
}

export async function getNotificationSettings() {
  const { data } = await api.get('/api/v1/notifications/settings');
  return data;
}

export async function updateNotificationSettings(updates: {
  notification_critical?: boolean;
  notification_advisory?: boolean;
  notification_info?: boolean;
  photo_reminder_enabled?: boolean;
  photo_reminder_frequency?: string;
}) {
  await api.patch('/api/v1/notifications/settings', updates);
}
