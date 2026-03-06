import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { PlantSprite } from '../../src/components/garden/sprites/PlantSprites';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

interface Species {
  id: string;
  common_name: string;
  icon_emoji: string | null;
  category: string | null;
}

interface Zone {
  id: string;
  name: string;
}

export default function AddPlantScreen() {
  const [step, setStep] = useState<'name' | 'species' | 'zone'>('name');
  const [plantName, setPlantName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [speciesResults, setSpeciesResults] = useState<Species[]>([]);
  const [popularSpecies, setPopularSpecies] = useState<Species[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load popular species and zones
    (async () => {
      try {
        const [speciesRes, gardensRes] = await Promise.all([
          api.get('/api/v1/species/popular'),
          api.get('/api/v1/gardens'),
        ]);
        setPopularSpecies(speciesRes.data);

        if (gardensRes.data.length > 0) {
          const zonesRes = await api.get(`/api/v1/gardens/${gardensRes.data[0].id}/zones`);
          setZones(zonesRes.data);
        }
      } catch {}
    })();
  }, []);

  const searchSpecies = useCallback(async (q: string) => {
    setSpeciesQuery(q);
    if (q.length < 2) {
      setSpeciesResults([]);
      return;
    }
    try {
      const { data } = await api.get('/api/v1/species', { params: { q } });
      setSpeciesResults(data);
    } catch {}
  }, []);

  const handleCreate = async () => {
    if (!plantName.trim()) {
      setError('Please enter a plant name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const gardensRes = await api.get('/api/v1/gardens');
      const gardenId = gardensRes.data[0]?.id;
      if (!gardenId) {
        setError('Create a garden first');
        return;
      }

      await api.post(`/api/v1/gardens/${gardenId}/plants`, {
        custom_name: plantName.trim(),
        species_id: selectedSpecies?.id,
        zone_id: selectedZone?.id,
        position_x: 0.3 + Math.random() * 0.4,
        position_y: 0.3 + Math.random() * 0.4,
      });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to add plant');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'name') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Text variant="handwritten" color={colors.terracotta}>new plant</Text>
          <Text variant="heading1" color={colors.soil} style={styles.title}>Name Your Plant</Text>
          <Input
            label="Plant Name"
            value={plantName}
            onChangeText={setPlantName}
            placeholder="e.g., Sun Gold Tomato, Kitchen Basil"
            error={error || undefined}
            containerStyle={styles.inputContainer}
          />
          <Button variant="primary" onPress={() => { if (plantName.trim()) setStep('species'); else setError('Enter a name'); }}>
            Next: Choose Species
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (step === 'species') {
    const displayList = speciesQuery.length >= 2 ? speciesResults : popularSpecies;
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text variant="heading2" color={colors.soil} style={styles.title}>What species?</Text>
          <Input
            label="Search species"
            value={speciesQuery}
            onChangeText={searchSpecies}
            placeholder="e.g., tomato, basil, monstera"
            containerStyle={styles.inputContainer}
          />
          <FlatList
            data={displayList}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.speciesRow, selectedSpecies?.id === item.id && styles.speciesRowActive]}
                onPress={() => setSelectedSpecies(item)}
              >
                <PlantSprite species={item.common_name} size={36} />
                <View>
                  <Text variant="bodySemibold" color={colors.bark}>{item.common_name}</Text>
                  {item.category && <Text variant="caption" color={colors.moss}>{item.category}</Text>}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text variant="caption" color={colors.bark} style={{ opacity: 0.6, padding: spacing.md }}>
                {speciesQuery.length >= 2 ? 'No species found' : 'Popular species'}
              </Text>
            }
          />
          <View style={styles.buttonRow}>
            <Button variant="ghost" onPress={() => { setSelectedSpecies(null); setStep('zone'); }}>
              Skip
            </Button>
            <Button variant="primary" onPress={() => setStep('zone')} disabled={!selectedSpecies}>
              Next: Choose Zone
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // Zone selection + confirm
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading2" color={colors.soil} style={styles.title}>Place in a zone</Text>
        {zones.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text variant="body" color={colors.bark}>No zones yet. You can add the plant without a zone and organize later.</Text>
          </Card>
        ) : (
          zones.map((zone) => (
            <Pressable
              key={zone.id}
              style={[styles.zoneRow, selectedZone?.id === zone.id && styles.zoneRowActive]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text variant="bodySemibold" color={selectedZone?.id === zone.id ? colors.cream : colors.bark}>
                {zone.name}
              </Text>
            </Pressable>
          ))
        )}

        <View style={styles.summary}>
          <Text variant="caption" color={colors.moss}>SUMMARY</Text>
          <Text variant="bodySemibold" color={colors.soil}>{plantName}</Text>
          {selectedSpecies && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PlantSprite species={selectedSpecies.common_name} size={24} />
              <Text variant="caption" color={colors.bark}>{selectedSpecies.common_name}</Text>
            </View>
          )}
          {selectedZone && <Text variant="caption" color={colors.bark}>Zone: {selectedZone.name}</Text>}
        </View>

        {error ? <Text variant="caption" color={colors.terracotta}>{error}</Text> : null}

        <View style={styles.buttonRow}>
          <Button variant="ghost" onPress={() => setStep('species')}>Back</Button>
          <Button variant="primary" onPress={handleCreate} disabled={loading}>
            {loading ? 'Adding...' : 'Add Plant'}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { flex: 1, padding: spacing.xxl },
  title: { marginBottom: spacing.md },
  inputContainer: { marginBottom: spacing.lg },
  list: { flex: 1, marginBottom: spacing.md },
  speciesRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md, marginBottom: spacing.xs,
  },
  speciesRowActive: { backgroundColor: colors.sage + '25' },
  zoneRow: {
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md, backgroundColor: colors.parchment,
    marginBottom: spacing.sm,
  },
  zoneRowActive: { backgroundColor: colors.sage },
  emptyCard: { marginBottom: spacing.lg },
  summary: { marginVertical: spacing.lg, gap: spacing.xs },
  buttonRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' },
});
