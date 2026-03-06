import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ gardens: 0, plants: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/dashboard');
      setStats({
        gardens: data.gardens?.length ?? 0,
        plants: data.plant_summary?.total ?? 0,
      });
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.display_name ?? user?.email ?? 'G')[0].toUpperCase()}
          </Text>
        </View>
        <Text variant="heading1" color={colors.soil}>
          {user?.display_name || 'Gardener'}
        </Text>
        <Text variant="caption" color={colors.moss}>{user?.email}</Text>
        <Text variant="handwritten" color={colors.terracotta} style={styles.statsText}>
          {stats.gardens} {stats.gardens === 1 ? 'garden' : 'gardens'} · {stats.plants} {stats.plants === 1 ? 'plant' : 'plants'}
        </Text>
        {user?.hardiness_zone && (
          <Text variant="caption" color={colors.sage}>Zone {user.hardiness_zone}</Text>
        )}
      </View>

      <Card style={styles.card}>
        <Pressable style={styles.settingsItem} onPress={() => router.push('/settings/notifications' as any)}>
          <Text variant="body" color={colors.bark}>Notifications</Text>
          <Text color={colors.parchment}>{'\u203A'}</Text>
        </Pressable>
        <Pressable style={styles.settingsItem} onPress={() => router.push('/agent/chat' as any)}>
          <Text variant="body" color={colors.bark}>Ask Nurch</Text>
          <Text color={colors.parchment}>{'\u203A'}</Text>
        </Pressable>
      </Card>

      <Button variant="ghost" onPress={handleLogout}>Sign Out</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.sage, marginBottom: spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: colors.cream },
  statsText: { marginTop: spacing.xs, fontSize: 16 },
  card: { marginBottom: spacing.lg, padding: 0 },
  settingsItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.parchment,
  },
});
