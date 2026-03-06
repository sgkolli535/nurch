import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { api } from '../../src/services/api';

const ZONE_TYPES = [
  { value: 'raised_bed', label: 'Raised Bed' },
  { value: 'in_ground', label: 'In Ground' },
  { value: 'container', label: 'Container/Pot' },
  { value: 'windowsill', label: 'Windowsill' },
  { value: 'indoor', label: 'Indoor' },
];

const LIGHT_TYPES = [
  { value: 'full_sun', label: 'Full Sun' },
  { value: 'partial_shade', label: 'Partial Shade' },
  { value: 'shade', label: 'Shade' },
  { value: 'indoor', label: 'Indoor Light' },
];

export default function AddZoneScreen() {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('raised_bed');
  const [lightType, setLightType] = useState('full_sun');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a zone name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Get first garden
      const gardensRes = await api.get('/api/v1/gardens');
      const gardenId = gardensRes.data[0]?.id;
      if (!gardenId) {
        setError('Create a garden first');
        return;
      }

      await api.post(`/api/v1/gardens/${gardenId}/zones`, {
        name: name.trim(),
        zone_type: zoneType,
        light_type: lightType,
        position_x: Math.random() * 0.6 + 0.1,
        position_y: Math.random() * 0.5 + 0.1,
        width: 0.35,
        height: 0.3,
      });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="handwritten" color={colors.terracotta}>new zone</Text>
        <Text variant="heading1" color={colors.soil} style={styles.title}>
          Add a Zone
        </Text>
        <Text variant="body" color={colors.bark} style={styles.body}>
          Zones are areas in your garden — a raised bed, a row of pots, a windowsill.
        </Text>

        <Input
          label="Zone Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Backyard Raised Bed"
          error={error || undefined}
          containerStyle={styles.inputContainer}
        />

        <Text variant="caption" color={colors.moss} style={styles.selectorLabel}>ZONE TYPE</Text>
        <View style={styles.chips}>
          {ZONE_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.chip, zoneType === t.value && styles.chipActive]}
              onPress={() => setZoneType(t.value)}
            >
              <Text variant="caption" color={zoneType === t.value ? colors.cream : colors.bark}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="caption" color={colors.moss} style={styles.selectorLabel}>LIGHT</Text>
        <View style={styles.chips}>
          {LIGHT_TYPES.map((t) => (
            <Pressable
              key={t.value}
              style={[styles.chip, lightType === t.value && styles.chipActive]}
              onPress={() => setLightType(t.value)}
            >
              <Text variant="caption" color={lightType === t.value ? colors.cream : colors.bark}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.spacer} />
        <Button variant="primary" onPress={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Add Zone'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },
  title: { marginBottom: spacing.sm },
  body: { marginBottom: spacing.xl, opacity: 0.85, lineHeight: 22 },
  inputContainer: { marginBottom: spacing.lg },
  selectorLabel: { fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, backgroundColor: colors.parchment,
  },
  chipActive: { backgroundColor: colors.sage },
  spacer: { height: spacing.lg },
});
