import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Text } from '../../../src/components/ui/Text';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { StatusDot } from '../../../src/components/ui/StatusDot';
import { LoadingPulse } from '../../../src/components/ui/LoadingPulse';
import { ConfidenceBadge } from '../../../src/components/trust/ConfidenceBadge';
import { ReasoningChain } from '../../../src/components/trust/ReasoningChain';
import { CitationList } from '../../../src/components/trust/CitationList';
import { colors, semantic } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { api } from '../../../src/services/api';

export default function PlantProfileScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const [plant, setPlant] = useState<any>(null);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [latestDiagnosis, setLatestDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!plantId) return;
    try {
      const [plantRes, diagRes] = await Promise.all([
        api.get(`/api/v1/plants/${plantId}`),
        api.get(`/api/v1/plants/${plantId}/diagnoses?limit=10`),
      ]);
      setPlant(plantRes.data);
      setDiagnoses(diagRes.data);

      try {
        const latestRes = await api.get(`/api/v1/plants/${plantId}/diagnoses/latest`);
        setLatestDiagnosis(latestRes.data);
      } catch {
        // No diagnoses yet
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingPulse size={60} />
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="body" color={colors.bark}>Plant not found</Text>
      </View>
    );
  }

  const healthColor = semantic[plant.health_status as keyof typeof semantic] ?? colors.bark;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.coverPhoto} />
        <Text variant="heading1" color={colors.soil}>{plant.custom_name}</Text>
        <View style={styles.statusRow}>
          <StatusDot status={plant.health_status} size={10} pulse />
          <Text variant="bodySemibold" color={healthColor}>
            {plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="warm" onPress={() => router.push(`/plant/${plantId}/diagnose` as any)}>
          Diagnose
        </Button>
        <Button variant="secondary" onPress={() => router.push('/agent/chat')}>
          Ask Nurch
        </Button>
      </View>

      {/* Latest Diagnosis with Trust UI */}
      {latestDiagnosis && (
        <Card style={styles.section} elevated>
          <Text variant="subtitle" color={colors.forest} style={styles.sectionTitle}>
            Latest Assessment
          </Text>
          <Text variant="body" color={colors.bark} style={styles.summaryText}>
            {latestDiagnosis.summary}
          </Text>
          {latestDiagnosis.confidence_level && (
            <ConfidenceBadge level={latestDiagnosis.confidence_level} />
          )}
          {latestDiagnosis.reasoning_chain && latestDiagnosis.reasoning_chain.length > 0 && (
            <View style={styles.trustSection}>
              <ReasoningChain steps={latestDiagnosis.reasoning_chain} />
            </View>
          )}
          {latestDiagnosis.citations && latestDiagnosis.citations.length > 0 && (
            <View style={styles.trustSection}>
              <CitationList citations={latestDiagnosis.citations} />
            </View>
          )}
          {latestDiagnosis.uncertainty_notes && (
            <Card style={styles.uncertaintyCard}>
              <Text variant="caption" color={colors.clay}>
                {latestDiagnosis.uncertainty_notes}
              </Text>
            </Card>
          )}
        </Card>
      )}

      {/* Notes */}
      {plant.notes && (
        <Card style={styles.section}>
          <Text variant="handwritten" color={colors.terracotta} style={styles.sectionLabel}>notes</Text>
          <Text variant="body" color={colors.bark}>{plant.notes}</Text>
        </Card>
      )}

      {/* Diagnosis History */}
      {diagnoses.length > 0 && (
        <View style={styles.section}>
          <Text variant="heading2" color={colors.soil} style={styles.sectionTitle}>
            Health History
          </Text>
          {diagnoses.map((diag: any) => {
            const diagColor = semantic[diag.overall_health as keyof typeof semantic] ?? colors.bark;
            return (
              <Card key={diag.id} style={styles.diagCard}>
                <View style={styles.diagHeader}>
                  <StatusDot status={diag.overall_health} size={8} />
                  <Text variant="bodySemibold" color={diagColor}>
                    {diag.overall_health.charAt(0).toUpperCase() + diag.overall_health.slice(1)}
                  </Text>
                  {diag.confidence_level && (
                    <Badge
                      label={diag.confidence_level}
                      color={diag.confidence_level === 'high' ? colors.forest : colors.bark}
                      backgroundColor={diag.confidence_level === 'high' ? colors.sprout + '30' : colors.sunlight + '30'}
                    />
                  )}
                  <Text variant="caption" color={colors.bark} style={{ marginLeft: 'auto' }}>
                    {new Date(diag.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {diag.summary && (
                  <Text variant="body" color={colors.bark} style={styles.summaryText}>
                    {diag.summary}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {plant.planting_date && (
        <Card style={styles.section}>
          <Text variant="handwritten" color={colors.terracotta}>
            planted {plant.planting_date}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.linen },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  coverPhoto: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.parchment, marginBottom: spacing.md,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, justifyContent: 'center' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.md },
  sectionLabel: { marginBottom: spacing.xs },
  trustSection: { marginTop: spacing.sm },
  uncertaintyCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.sunlight + '15',
    borderColor: colors.sunlight + '30',
    padding: spacing.md,
  },
  diagCard: { marginBottom: spacing.sm },
  diagHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { marginTop: spacing.xs, marginBottom: spacing.sm, opacity: 0.85 },
});
