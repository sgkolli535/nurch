import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { StatusDot } from '../ui/StatusDot';
import { Badge } from '../ui/Badge';
import { colors, semantic } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface Category {
  confidence?: number;
  severity?: string;
  description?: string;
  action?: string;
  status?: string;
  deficiency?: string;
  identified?: string;
  stressor?: string;
  stage?: string;
  assessment?: string;
}

interface Prediction {
  timeframe: string;
  risk: string;
  description: string;
  preventive_action: string;
}

interface DiagnosisData {
  overall_health: 'healthy' | 'warning' | 'critical';
  confidence_score: number;
  summary: string;
  categories: Record<string, Category>;
  predictions?: Prediction[];
  photo_quality_note?: string;
}

interface DiagnosisResultProps {
  diagnosis: DiagnosisData;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  hydration: { label: 'Hydration', icon: '💧' },
  nutrients: { label: 'Nutrients', icon: '🧪' },
  pests: { label: 'Pests', icon: '🐛' },
  disease: { label: 'Disease', icon: '🦠' },
  environmental_stress: { label: 'Environment', icon: '🌡️' },
  growth: { label: 'Growth', icon: '📏' },
};

const SEVERITY_COLORS: Record<string, string> = {
  none: colors.sprout,
  mild: colors.sunlight,
  moderate: colors.clay,
  severe: colors.terracotta,
};

export function DiagnosisResult({ diagnosis }: DiagnosisResultProps) {
  const healthColor = semantic[diagnosis.overall_health] ?? colors.bark;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overall health card */}
      <Card elevated style={styles.overallCard}>
        <View style={styles.overallHeader}>
          <StatusDot status={diagnosis.overall_health} size={14} pulse />
          <Text variant="heading1" color={healthColor}>
            {diagnosis.overall_health.charAt(0).toUpperCase() + diagnosis.overall_health.slice(1)}
          </Text>
          <Badge
            label={`${Math.round(diagnosis.confidence_score * 100)}% confident`}
            color={colors.bark}
            backgroundColor={colors.parchment}
          />
        </View>
        <Text variant="body" color={colors.bark} style={styles.summary}>
          {diagnosis.summary}
        </Text>
      </Card>

      {/* Category cards */}
      {Object.entries(diagnosis.categories).map(([key, cat]) => {
        if (!cat || cat.severity === 'none') return null;
        const meta = CATEGORY_LABELS[key];
        if (!meta) return null;

        return (
          <Card key={key} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryIcon}>{meta.icon}</Text>
              <Text variant="subtitle" color={colors.soil}>{meta.label}</Text>
              {cat.severity && (
                <Badge
                  label={cat.severity}
                  color={colors.cream}
                  backgroundColor={SEVERITY_COLORS[cat.severity] ?? colors.bark}
                />
              )}
            </View>
            {cat.description && (
              <Text variant="body" color={colors.bark} style={styles.desc}>
                {cat.description}
              </Text>
            )}
            {cat.action && (
              <View style={styles.actionBox}>
                <Text variant="caption" color={colors.forest} style={styles.actionLabel}>
                  RECOMMENDED ACTION
                </Text>
                <Text variant="bodyMedium" color={colors.forest}>
                  {cat.action}
                </Text>
              </View>
            )}
            {cat.confidence != null && (
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { width: `${cat.confidence * 100}%` }]} />
              </View>
            )}
          </Card>
        );
      })}

      {/* Predictions */}
      {diagnosis.predictions && diagnosis.predictions.length > 0 && (
        <Card style={styles.predictionsCard}>
          <Text variant="subtitle" color={colors.forest} style={styles.predictionsTitle}>
            Predictions
          </Text>
          {diagnosis.predictions.map((pred, i) => (
            <View key={i} style={styles.prediction}>
              <View style={styles.predHeader}>
                <Text variant="caption" color={colors.bark}>{pred.timeframe}</Text>
                <Badge
                  label={pred.risk}
                  color={pred.risk === 'high' ? colors.cream : colors.bark}
                  backgroundColor={pred.risk === 'high' ? colors.terracotta : pred.risk === 'medium' ? colors.sunlight : colors.sprout}
                />
              </View>
              <Text variant="body" color={colors.bark}>{pred.description}</Text>
              <Text variant="caption" color={colors.forest}>{pred.preventive_action}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Photo quality note */}
      {diagnosis.photo_quality_note && (
        <Card style={styles.noteCard}>
          <Text variant="caption" color={colors.clay}>
            {diagnosis.photo_quality_note}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  overallCard: { marginBottom: spacing.lg },
  overallHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  summary: { marginTop: spacing.xs, lineHeight: 22 },
  categoryCard: { marginBottom: spacing.md },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  categoryIcon: { fontSize: 20 },
  desc: { marginBottom: spacing.sm },
  actionBox: {
    backgroundColor: colors.sage + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  actionLabel: { fontWeight: '600', letterSpacing: 1, marginBottom: spacing.xs },
  confidenceBar: {
    height: 4,
    backgroundColor: colors.parchment,
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', backgroundColor: colors.sage, borderRadius: 2 },
  predictionsCard: { marginBottom: spacing.md },
  predictionsTitle: { marginBottom: spacing.md },
  prediction: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.parchment,
    gap: spacing.xs,
  },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteCard: { backgroundColor: colors.sunlight + '15', borderColor: colors.sunlight + '30' },
});
