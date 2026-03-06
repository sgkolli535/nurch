import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Text } from '../../src/components/ui/Text';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { updateProfile } from '../../src/services/auth';
import { createGarden } from '../../src/services/gardens';

type Step = 'welcome' | 'location' | 'garden' | 'done';

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [gardenName, setGardenName] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
      setStep('garden');
    }
  };

  const handleCreateGarden = async () => {
    if (!gardenName.trim()) return;
    setLoading(true);
    try {
      await createGarden({
        name: gardenName.trim(),
        location_lat: location?.lat,
        location_lng: location?.lng,
      });
      setStep('done');
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text variant="display" color={colors.soil} style={styles.title}>
            Welcome to Nurch
          </Text>
          <Text variant="body" color={colors.bark} style={styles.body}>
            Let's set up your garden in just a few steps. We'll help you track your
            plants, diagnose issues with AI, and keep everything thriving.
          </Text>
          <Button variant="primary" onPress={() => setStep('location')}>
            Get Started
          </Button>
        </View>
      </View>
    );
  }

  if (step === 'location') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          {loading ? (
            <LoadingPulse size={60} />
          ) : (
            <>
              <Text variant="heading1" color={colors.soil} style={styles.title}>
                Where's your garden?
              </Text>
              <Text variant="body" color={colors.bark} style={styles.body}>
                Your location helps us provide local weather, hardiness zone data,
                and seasonal care recommendations.
              </Text>
              <View style={styles.buttonGroup}>
                <Button variant="primary" onPress={requestLocation}>
                  Use My Location
                </Button>
                <Button variant="ghost" onPress={() => setStep('garden')}>
                  Skip for Now
                </Button>
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  if (step === 'garden') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text variant="heading1" color={colors.soil} style={styles.title}>
            Name your garden
          </Text>
          <Text variant="body" color={colors.bark} style={styles.body}>
            This is your virtual garden — a digital twin of your real garden space.
          </Text>
          <Input
            label="Garden Name"
            value={gardenName}
            onChangeText={setGardenName}
            placeholder="e.g., My Backyard, Apartment Herbs"
            containerStyle={styles.inputContainer}
          />
          {location && (
            <Card style={styles.locationCard}>
              <Text variant="caption" color={colors.sage}>
                Location set ({location.lat.toFixed(2)}, {location.lng.toFixed(2)})
              </Text>
            </Card>
          )}
          <Button
            variant="primary"
            onPress={handleCreateGarden}
            disabled={loading || !gardenName.trim()}
          >
            {loading ? 'Creating...' : 'Create Garden'}
          </Button>
        </View>
      </View>
    );
  }

  // Done
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <Text variant="display" color={colors.sage} style={styles.title}>
          You're all set!
        </Text>
        <Text variant="body" color={colors.bark} style={styles.body}>
          Your garden is ready. Start adding plants, take photos for AI health
          assessments, and let Nurch help you grow.
        </Text>
        <Button variant="primary" onPress={() => router.replace('/(tabs)')}>
          Go to My Garden
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.linen,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    opacity: 0.85,
    lineHeight: 22,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  locationCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
});
