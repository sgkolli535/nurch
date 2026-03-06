import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { createGarden } from '../../src/services/gardens';
import { updateProfile } from '../../src/services/auth';

export default function CreateGardenScreen() {
  const [gardenName, setGardenName] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setLocation(coords);
        await updateProfile({ location_lat: coords.lat, location_lng: coords.lng });
      }
    } catch {
      // Location is optional
    }
  };

  const handleCreate = async () => {
    if (!gardenName.trim()) {
      setError('Please enter a garden name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createGarden({
        name: gardenName.trim(),
        location_lat: location?.lat,
        location_lng: location?.lng,
      });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to create garden');
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
        <Text variant="handwritten" color={colors.terracotta}>new garden</Text>
        <Text variant="heading1" color={colors.soil} style={styles.title}>
          Create a Garden
        </Text>
        <Text variant="body" color={colors.bark} style={styles.body}>
          A garden is a digital twin of a real space — your backyard, balcony,
          or kitchen windowsill.
        </Text>

        <Input
          label="Garden Name"
          value={gardenName}
          onChangeText={setGardenName}
          placeholder="e.g., My Backyard, Apartment Herbs"
          error={error || undefined}
          containerStyle={styles.input}
        />

        {location ? (
          <Card style={styles.locationCard}>
            <Text variant="caption" color={colors.sprout}>
              Location set ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
            </Text>
          </Card>
        ) : (
          <Button variant="ghost" onPress={requestLocation}>
            Add Location (optional)
          </Button>
        )}

        <View style={styles.spacer} />

        {loading ? (
          <LoadingPulse size={40} />
        ) : (
          <Button variant="primary" onPress={handleCreate}>
            Create Garden
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  content: { flex: 1, padding: spacing.xxl, justifyContent: 'center' },
  title: { marginBottom: spacing.sm },
  body: { marginBottom: spacing.xl, opacity: 0.85, lineHeight: 22 },
  input: { marginBottom: spacing.lg },
  locationCard: { padding: spacing.md, marginBottom: spacing.lg },
  spacer: { height: spacing.lg },
});
