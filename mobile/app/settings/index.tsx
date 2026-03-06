import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const settingsItems = [
    { label: 'Notifications', route: '/settings/notifications' },
    { label: 'Privacy', route: '/settings/privacy' as const },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.profileCard}>
        <View style={styles.avatar} />
        <Text variant="heading2" color={colors.soil}>
          {user?.display_name || 'Gardener'}
        </Text>
        <Text variant="caption" color={colors.moss}>
          {user?.email}
        </Text>
        {user?.hardiness_zone && (
          <Text variant="handwritten" color={colors.terracotta}>
            Zone {user.hardiness_zone}
          </Text>
        )}
      </Card>

      <Card style={styles.section}>
        {settingsItems.map((item, i) => (
          <Pressable
            key={item.label}
            style={[styles.settingsRow, i < settingsItems.length - 1 && styles.settingsRowBorder]}
            onPress={() => router.push(item.route as any)}
          >
            <Text variant="body" color={colors.bark}>{item.label}</Text>
            <Text color={colors.parchment}>{'\u203A'}</Text>
          </Pressable>
        ))}
      </Card>

      <Button variant="ghost" onPress={handleLogout}>Sign Out</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl },
  profileCard: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.sage, marginBottom: spacing.sm,
  },
  section: { marginBottom: spacing.lg, padding: 0 },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.parchment },
});
