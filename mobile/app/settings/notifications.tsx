import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text } from '../../src/components/ui/Text';
import { Card } from '../../src/components/ui/Card';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

export default function NotificationSettingsScreen() {
  const [critical, setCritical] = useState(true);
  const [advisory, setAdvisory] = useState(true);
  const [info, setInfo] = useState(true);
  const [photoReminders, setPhotoReminders] = useState(true);

  const toggles = [
    {
      label: 'Critical Alerts',
      description: 'Frost warnings, severe disease/pest detection',
      value: critical,
      onToggle: setCritical,
    },
    {
      label: 'Advisory Notifications',
      description: 'Watering suggestions, mild issues, care reminders',
      value: advisory,
      onToggle: setAdvisory,
    },
    {
      label: 'Informational',
      description: 'Weekly summaries, seasonal tips',
      value: info,
      onToggle: setInfo,
    },
    {
      label: 'Photo Reminders',
      description: 'Reminders to photograph plants for health tracking',
      value: photoReminders,
      onToggle: setPhotoReminders,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="heading1" color={colors.soil} style={styles.title}>
        Notifications
      </Text>

      <Card style={styles.card}>
        {toggles.map((item, i) => (
          <View
            key={item.label}
            style={[styles.row, i < toggles.length - 1 && styles.rowBorder]}
          >
            <View style={styles.rowText}>
              <Text variant="bodySemibold" color={colors.bark}>{item.label}</Text>
              <Text variant="caption" color={colors.bark} style={styles.desc}>
                {item.description}
              </Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.parchment, true: colors.sage }}
              thumbColor={colors.cream}
            />
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl },
  title: { marginBottom: spacing.lg },
  card: { padding: 0 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.lg,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.parchment },
  rowText: { flex: 1, marginRight: spacing.md },
  desc: { opacity: 0.7, marginTop: 2 },
});
