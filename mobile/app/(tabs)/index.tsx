import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { StatusDot } from '../../src/components/ui/StatusDot';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { PlantSprite } from '../../src/components/garden/sprites/PlantSprites';
import { colors, semantic } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

interface DashboardData {
  gardens: Array<{ id: string; name: string; hardiness_zone: string | null }>;
  plant_summary: { total: number; healthy: number; warning: number; critical: number; unknown: number };
  recent_alerts: Array<{ id: string; tier: string; title: string; body: string; created_at: string }>;
}

interface CalendarTask {
  plant_name: string;
  task: string;
  icon_emoji: string | null;
  species_name?: string;
}

interface PlantItem {
  id: string;
  custom_name: string;
  health_status: string;
  species_name: string | null;
}

export default function DashboardScreen() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, calRes] = await Promise.all([
        api.get('/api/v1/dashboard'),
        api.get('/api/v1/dashboard/calendar'),
      ]);
      setDashboard(dashRes.data);
      setTasks(calRes.data.tasks || []);

      // Fetch plants for the first garden
      if (dashRes.data.gardens?.length > 0) {
        const plantsRes = await api.get(`/api/v1/gardens/${dashRes.data.gardens[0].id}/plants`);
        setPlants(plantsRes.data);
      }
    } catch {
      // Not logged in or no data yet
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchDashboard(); }, [fetchDashboard]));

  const hasGarden = dashboard && dashboard.gardens.length > 0;
  const summary = dashboard?.plant_summary;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingPulse size={60} />
      </View>
    );
  }

  // No garden yet — show welcome
  if (!hasGarden) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="handwritten" color={colors.terracotta}>welcome</Text>
          <Text variant="display" color={colors.soil}>Nurch</Text>
        </View>
        <Card style={styles.card}>
          <Text variant="heading2" color={colors.soil}>Get started</Text>
          <Text variant="body" color={colors.bark} style={styles.cardBody}>
            Create your first garden to start tracking your plants with AI-powered health assessments.
          </Text>
          <Button variant="primary" onPress={() => router.push('/garden/create' as any)}>
            Create Garden
          </Button>
        </Card>
      </ScrollView>
    );
  }

  // Has garden — show real dashboard
  const greeting = new Date().getHours() < 12 ? 'good morning' : new Date().getHours() < 18 ? 'good afternoon' : 'good evening';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="handwritten" color={colors.terracotta}>{greeting}</Text>
        <Text variant="display" color={colors.soil}>{dashboard.gardens[0].name}</Text>
        {dashboard.gardens[0].hardiness_zone && (
          <Text variant="caption" color={colors.sage}>Zone {dashboard.gardens[0].hardiness_zone}</Text>
        )}
      </View>

      {/* Health summary */}
      {summary && summary.total > 0 && (
        <Card style={styles.card}>
          <Text variant="subtitle" color={colors.forest} style={styles.sectionTitle}>Garden Health</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text variant="display" color={colors.soil}>{summary.total}</Text>
              <Text variant="caption" color={colors.bark}>plants</Text>
            </View>
            {summary.healthy > 0 && (
              <View style={styles.summaryItem}>
                <Text variant="heading1" color={colors.sprout}>{summary.healthy}</Text>
                <Text variant="caption" color={colors.sprout}>healthy</Text>
              </View>
            )}
            {summary.warning > 0 && (
              <View style={styles.summaryItem}>
                <Text variant="heading1" color={colors.sunlight}>{summary.warning}</Text>
                <Text variant="caption" color={colors.sunlight}>attention</Text>
              </View>
            )}
            {summary.critical > 0 && (
              <View style={styles.summaryItem}>
                <Text variant="heading1" color={colors.terracotta}>{summary.critical}</Text>
                <Text variant="caption" color={colors.terracotta}>critical</Text>
              </View>
            )}
            {summary.unknown > 0 && (
              <View style={styles.summaryItem}>
                <Text variant="heading1" color={colors.sky}>{summary.unknown}</Text>
                <Text variant="caption" color={colors.sky}>new</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Alerts */}
      {dashboard.recent_alerts.length > 0 && (
        <Card style={[styles.card, { borderLeftWidth: 3, borderLeftColor: colors.terracotta }]}>
          <Text variant="subtitle" color={colors.terracotta} style={styles.sectionTitle}>Alerts</Text>
          {dashboard.recent_alerts.slice(0, 3).map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <Text variant="bodySemibold" color={colors.bark}>{alert.title}</Text>
              <Text variant="caption" color={colors.bark} style={{ opacity: 0.7 }}>{alert.body}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Plants list */}
      {plants.length > 0 && (
        <View>
          <Text variant="subtitle" color={colors.forest} style={styles.sectionTitle}>Your Plants</Text>
          {plants.map((plant) => {
            const sc = semantic[plant.health_status as keyof typeof semantic] ?? colors.sky;
            return (
              <Pressable key={plant.id} onPress={() => router.push(`/plant/${plant.id}` as any)}>
                <Card style={styles.plantRow}>
                  <PlantSprite species={plant.species_name ?? plant.custom_name} size={36} />
                  <View style={styles.plantInfo}>
                    <Text variant="bodySemibold" color={colors.soil}>{plant.custom_name}</Text>
                    {plant.species_name && <Text variant="caption" color={colors.moss}>{plant.species_name}</Text>}
                  </View>
                  <StatusDot status={plant.health_status as any} size={10} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Upcoming tasks */}
      {tasks.length > 0 && (
        <Card style={styles.card}>
          <Text variant="subtitle" color={colors.forest} style={styles.sectionTitle}>This Month</Text>
          {tasks.slice(0, 5).map((task, i) => (
            <View key={i} style={styles.taskItem}>
              <PlantSprite species={task.plant_name} size={24} />
              <View style={styles.taskText}>
                <Text variant="bodySemibold" color={colors.bark}>{task.task.replace(/_/g, ' ')}</Text>
                <Text variant="caption" color={colors.moss}>{task.plant_name}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Quick actions */}
      <View style={styles.quickActions}>
        <Button variant="primary" onPress={() => router.push('/garden/add-plant' as any)}>
          Add Plant
        </Button>
        <Button variant="secondary" onPress={() => router.push('/agent/chat' as any)}>
          Ask Nurch
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.linen },
  header: { marginBottom: spacing.xl },
  card: { marginBottom: spacing.lg },
  cardBody: { marginVertical: spacing.sm },
  sectionTitle: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.xl, flexWrap: 'wrap' },
  summaryItem: { alignItems: 'center' },
  alertItem: { marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.parchment },
  plantRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.sm, padding: spacing.md,
  },
  plantInfo: { flex: 1 },
  taskItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.parchment,
  },
  taskText: { flex: 1 },
  quickActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
});
