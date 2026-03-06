import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { IsometricCanvas } from '../../src/components/garden/IsometricCanvas';
import { GardenToolbar } from '../../src/components/garden/GardenToolbar';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

interface Zone {
  id: string;
  name: string;
  zone_type: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  grid_cols: number;
  grid_rows: number;
  plants: Plant[];
}

interface Plant {
  id: string;
  custom_name: string;
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  grid_col: number;
  grid_row: number;
  icon_emoji?: string;
  species_name?: string;
}

interface GardenData {
  id: string;
  name: string;
  hardiness_zone: string | null;
  zones: Zone[];
  plant_count: number;
}

export default function GardenScreen() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [garden, setGarden] = useState<GardenData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGarden = useCallback(async () => {
    try {
      // Get user's gardens
      const gardensRes = await api.get('/api/v1/gardens');
      const gardens = gardensRes.data;
      if (!gardens || gardens.length === 0) {
        setGarden(null);
        setLoading(false);
        return;
      }

      const g = gardens[0]; // Active garden
      // Get garden detail (includes zones)
      const detailRes = await api.get(`/api/v1/gardens/${g.id}`);
      const detail = detailRes.data;

      // Get all plants for this garden
      const plantsRes = await api.get(`/api/v1/gardens/${g.id}/plants`);
      const plants = plantsRes.data;

      // Group plants into zones
      const zonesWithPlants: Zone[] = (detail.zones || []).map((zone: any) => ({
        ...zone,
        grid_cols: zone.grid_cols ?? 3,
        grid_rows: zone.grid_rows ?? 3,
        plants: plants
          .filter((p: any) => p.zone_id === zone.id)
          .map((p: any) => ({
            id: p.id,
            custom_name: p.custom_name,
            health_status: p.health_status,
            grid_col: p.grid_col ?? 0,
            grid_row: p.grid_row ?? 0,
            icon_emoji: p.icon_emoji,
            species_name: p.species_name,
          })),
      }));

      // Plants without a zone go into an "Ungrouped" zone
      const ungrouped = plants.filter((p: any) => !p.zone_id);
      if (ungrouped.length > 0) {
        zonesWithPlants.push({
          id: 'ungrouped',
          name: 'Ungrouped',
          zone_type: 'in_ground',
          position_x: 0.5,
          position_y: 0.7,
          width: 0.4,
          height: 0.25,
          grid_cols: 3,
          grid_rows: 3,
          plants: ungrouped.map((p: any, i: number) => ({
            id: p.id,
            custom_name: p.custom_name,
            health_status: p.health_status,
            grid_col: i % 3,
            grid_row: Math.floor(i / 3),
            icon_emoji: p.icon_emoji,
            species_name: p.species_name,
          })),
        });
      }

      setGarden({
        id: detail.id,
        name: detail.name,
        hardiness_zone: detail.hardiness_zone,
        zones: zonesWithPlants,
        plant_count: plants.length,
      });
    } catch {
      // If API fails (e.g., not authenticated yet), show empty state
      setGarden(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGarden();
    }, [fetchGarden])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingPulse size={60} />
      </View>
    );
  }

  if (!garden) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.empty}>
          <Text variant="heading1" color={colors.soil} style={styles.emptyTitle}>
            Your Garden
          </Text>
          <Text variant="body" color={colors.bark} style={styles.emptyBody}>
            Create your first garden to start placing zones and plants on your isometric map.
          </Text>
          <Button variant="primary" onPress={() => router.push('/garden/create' as any)}>
            Create Garden
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GardenToolbar
        gardenName={garden.name}
        hardinessZone={garden.hardiness_zone}
        plantCount={garden.plant_count}
        isEditMode={isEditMode}
        onToggleEdit={() => setIsEditMode(!isEditMode)}
        onAddPlant={() => router.push('/garden/add-plant' as any)}
        onAddZone={() => router.push('/garden/add-zone' as any)}
      />
      <IsometricCanvas
        zones={garden.zones}
        isEditMode={isEditMode}
        onPlantTap={(id) => router.push(`/plant/${id}` as any)}
        onZoneTap={(id) => {}}
        onPlantMoved={async (plantId, gridCol, gridRow) => {
          try {
            await api.patch(`/api/v1/plants/${plantId}`, { grid_col: gridCol, grid_row: gridRow });
            fetchGarden();
          } catch (e: any) { console.warn('Plant move failed:', e.response?.data); }
        }}
        onZoneGridResize={async (zoneId, cols, rows) => {
          if (!garden) return;
          try {
            await api.patch(`/api/v1/gardens/${garden.id}/zones/${zoneId}`, { grid_cols: cols, grid_rows: rows });
            fetchGarden();
          } catch (e: any) { console.warn('Zone resize failed:', e.response?.data); }
        }}
        onZoneMoved={async (zoneId, posX, posY) => {
          if (!garden) return;
          try {
            await api.patch(`/api/v1/gardens/${garden.id}/zones/${zoneId}`, {
              position_x: Number(Math.max(0, posX).toFixed(3)),
              position_y: Number(Math.max(0, posY).toFixed(3)),
            });
            fetchGarden();
          } catch (e: any) { console.warn('Zone move failed:', e.response?.data); }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.linen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.8,
  },
});
