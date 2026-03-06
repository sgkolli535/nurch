import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Task {
  plant_name: string;
  task: string;
  icon_emoji?: string;
}

interface UpcomingTasksProps {
  tasks: Task[];
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  if (tasks.length === 0) {
    return (
      <Card style={styles.card}>
        <Text variant="subtitle" color={colors.forest}>Upcoming Tasks</Text>
        <Text variant="body" color={colors.bark} style={styles.empty}>
          Add plants to see personalized care tasks.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text variant="subtitle" color={colors.forest} style={styles.title}>
        Upcoming Tasks
      </Text>
      {tasks.slice(0, 5).map((task, i) => (
        <View key={i} style={[styles.taskRow, i < tasks.length - 1 && styles.taskBorder]}>
          <Text style={styles.emoji}>{task.icon_emoji ?? '\uD83C\uDF31'}</Text>
          <View style={styles.taskText}>
            <Text variant="bodySemibold" color={colors.bark}>{task.task.replace(/_/g, ' ')}</Text>
            <Text variant="caption" color={colors.moss}>{task.plant_name}</Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  taskBorder: { borderBottomWidth: 1, borderBottomColor: colors.parchment },
  emoji: { fontSize: 20 },
  taskText: { flex: 1 },
  empty: { opacity: 0.7, marginTop: spacing.xs },
});
