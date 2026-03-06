import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface WeatherData {
  current_temp?: number;
  condition?: string;
  forecast?: Array<{ day: string; high: number; low: number }>;
}

interface WeatherWidgetProps {
  weather: WeatherData | null;
  hardinessZone?: string;
}

export function WeatherWidget({ weather, hardinessZone }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <Card style={styles.card}>
        <Text variant="subtitle" color={colors.forest}>Weather</Text>
        <Text variant="body" color={colors.bark} style={styles.empty}>
          Set your location to see local weather and growing conditions.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="subtitle" color={colors.forest}>Weather</Text>
        {hardinessZone && (
          <Text variant="caption" color={colors.sage}>Zone {hardinessZone}</Text>
        )}
      </View>
      <View style={styles.currentRow}>
        <Text variant="display" color={colors.soil}>
          {weather.current_temp ?? '--'}\u00B0
        </Text>
        <Text variant="body" color={colors.bark}>
          {weather.condition ?? 'No data'}
        </Text>
      </View>
      {weather.forecast && (
        <View style={styles.forecastRow}>
          {weather.forecast.slice(0, 3).map((day) => (
            <View key={day.day} style={styles.forecastDay}>
              <Text variant="caption" color={colors.moss}>{day.day}</Text>
              <Text variant="bodySemibold" color={colors.bark}>{day.high}\u00B0</Text>
              <Text variant="caption" color={colors.bark}>{day.low}\u00B0</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  currentRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md, marginBottom: spacing.md },
  forecastRow: { flexDirection: 'row', gap: spacing.xl },
  forecastDay: { alignItems: 'center' },
  empty: { opacity: 0.7, marginTop: spacing.xs },
});
