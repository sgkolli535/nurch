import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface Citation {
  source: string;
  claim: string;
  url?: string;
}

interface CitationListProps {
  citations: Citation[];
}

const SOURCE_LABELS: Record<string, string> = {
  UC_DAVIS: 'UC Davis',
  COOP_EXT: 'Cooperative Extension',
  USDA: 'USDA',
  RHS: 'Royal Horticultural Society',
  APS: 'American Phytopathological Society',
  CORNELL: 'Cornell',
  MOBOT: 'Missouri Botanical Garden',
  SPECIES_DB: 'Nurch Database',
  UC_IPM: 'UC IPM',
  WEATHER: 'Weather Data',
  OBSERVATION: 'Visual Observation',
};

export function CitationList({ citations }: CitationListProps) {
  if (!citations || citations.length === 0) return null;

  // Deduplicate by source
  const unique = citations.filter(
    (c, i, arr) => arr.findIndex((x) => x.source === c.source) === i
  );

  return (
    <View style={styles.container}>
      <Text variant="caption" color={colors.moss} style={styles.label}>
        Sources:
      </Text>
      <View style={styles.badges}>
        {unique.map((citation, i) => (
          <View key={i} style={styles.badge}>
            <Text variant="caption" color={colors.forest} style={styles.badgeText}>
              {SOURCE_LABELS[citation.source] ?? citation.source}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: colors.sage + '18',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
