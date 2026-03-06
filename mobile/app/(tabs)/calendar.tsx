import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { PlantSprite } from '../../src/components/garden/sprites/PlantSprites';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

interface Task {
  plant_name: string;
  plant_id: string;
  species_name: string | null;
  task: string;
  month: number;
  icon_emoji: string | null;
}

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    try {
      const { data } = await api.get('/api/v1/dashboard/calendar');
      setTasks(data.tasks || []);
      setMonth(data.month || new Date().getMonth() + 1);
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchCalendar(); }, [fetchCalendar]));

  if (loading) {
    return <View style={styles.loadingContainer}><LoadingPulse size={60} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading1" color={colors.soil} style={styles.title}>
        Care Calendar
      </Text>
      <Text variant="handwritten" color={colors.terracotta} style={styles.monthLabel}>
        {MONTH_NAMES[month]}
      </Text>

      {tasks.length === 0 ? (
        <Card style={styles.card}>
          <Text variant="body" color={colors.bark} style={{ opacity: 0.7 }}>
            Add plants with species to see personalized care tasks for this month.
          </Text>
        </Card>
      ) : (
        tasks.map((task, i) => (
          <Card key={i} style={styles.taskCard}>
            <View style={styles.taskRow}>
              <PlantSprite species={task.species_name ?? task.plant_name} size={32} />
              <View style={styles.taskInfo}>
                <Text variant="bodySemibold" color={colors.soil}>
                  {task.task.replace(/_/g, ' ')}
                </Text>
                <Text variant="caption" color={colors.moss}>{task.plant_name}</Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.linen },
  title: { marginBottom: spacing.xs },
  monthLabel: { marginBottom: spacing.lg, fontSize: 18 },
  card: { marginBottom: spacing.lg },
  taskCard: { marginBottom: spacing.sm, padding: spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskInfo: { flex: 1 },
});
