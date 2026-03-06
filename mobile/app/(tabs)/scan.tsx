import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { StatusDot } from '../../src/components/ui/StatusDot';
import { PlantSprite } from '../../src/components/garden/sprites/PlantSprites';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

interface PlantItem {
  id: string;
  custom_name: string;
  health_status: string;
  species_name: string | null;
}

export default function ScanScreen() {
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlants = useCallback(async () => {
    try {
      const gardensRes = await api.get('/api/v1/gardens');
      if (gardensRes.data.length > 0) {
        const plantsRes = await api.get(`/api/v1/gardens/${gardensRes.data[0].id}/plants`);
        setPlants(plantsRes.data);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchPlants(); }, [fetchPlants]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading1" color={colors.soil}>Diagnose a Plant</Text>
        <Text variant="body" color={colors.bark} style={styles.subtitle}>
          Choose a plant to photograph and get an AI health assessment.
        </Text>
      </View>

      {plants.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="body" color={colors.bark} style={{ opacity: 0.7 }}>
            Add plants to your garden first, then come back to diagnose them.
          </Text>
          <Button variant="primary" onPress={() => router.push('/garden/add-plant' as any)}>
            Add Plant
          </Button>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/plant/${item.id}/diagnose` as any)}>
              <Card style={styles.plantRow}>
                <PlantSprite species={item.species_name ?? item.custom_name} size={40} />
                <View style={styles.plantInfo}>
                  <Text variant="bodySemibold" color={colors.soil}>{item.custom_name}</Text>
                  {item.species_name && <Text variant="caption" color={colors.moss}>{item.species_name}</Text>}
                </View>
                <StatusDot status={item.health_status as any} size={10} />
                <Text variant="caption" color={colors.sage}>Scan</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  subtitle: { opacity: 0.7, marginTop: spacing.xs },
  empty: { padding: spacing.xxl, gap: spacing.lg, alignItems: 'center' },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  plantRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.sm, padding: spacing.md,
  },
  plantInfo: { flex: 1 },
});
