import { useCallback, useState } from 'react';
import { api } from '../services/api';

interface Notification {
  id: string;
  tier: string;
  category: string;
  title: string;
  body: string;
  is_read: boolean;
  plant_id: string | null;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (unreadOnly = false) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/notifications', {
        params: { unread_only: unreadOnly },
      });
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (alertId: string) => {
    await api.patch(`/api/v1/notifications/${alertId}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === alertId ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await api.patch('/api/v1/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, unreadCount, fetch, markRead, markAllRead };
}
