import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Text } from '../../../src/components/ui/Text';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { LoadingPulse } from '../../../src/components/ui/LoadingPulse';
import { ConfidenceBadge } from '../../../src/components/trust/ConfidenceBadge';
import { ReasoningChain } from '../../../src/components/trust/ReasoningChain';
import { CitationList } from '../../../src/components/trust/CitationList';
import { DiagnosisResult } from '../../../src/components/scan/DiagnosisResult';
import { colors } from '../../../src/theme/colors';
import { spacing, borderRadius } from '../../../src/theme/spacing';
import { api } from '../../../src/services/api';

type Step = 'capture' | 'review' | 'processing' | 'result' | 'error';

export default function DiagnoseScreen() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const [step, setStep] = useState<Step>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [error, setError] = useState('');

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('review');
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('review');
    }
  };

  const runDiagnosis = async () => {
    if (!imageUri || !plantId) return;
    setStep('processing');

    try {
      // Step 1: Get presigned upload URL from backend
      const uploadRes = await api.post('/api/v1/photos/upload-url', {
        plant_id: plantId,
        content_type: 'image/jpeg',
      });
      const { upload_url, photo_id } = uploadRes.data;

      // Step 2: Upload photo to Supabase Storage
      const imageResponse = await fetch(imageUri);
      const blob = await imageResponse.blob();
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      // Step 3: Confirm the upload
      await api.patch(`/api/v1/photos/${photo_id}/confirm`, {});

      // Step 4: Run AI diagnosis
      const diagRes = await api.post(`/api/v1/plants/${plantId}/diagnoses`, {
        photo_id: photo_id,
      });

      setDiagnosis(diagRes.data);
      setStep('result');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Diagnosis failed. Please try again.');
      setStep('error');
    }
  };

  if (step === 'capture') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text variant="heading1" color={colors.soil} style={styles.title}>
            Take a Photo
          </Text>
          <Text variant="body" color={colors.bark} style={styles.body}>
            For best results, photograph the affected area in natural daylight.
            Get close to leaves, stems, or spots you're concerned about.
          </Text>
          <Card style={styles.tipsCard}>
            <Text variant="caption" color={colors.forest} style={styles.tipTitle}>TIPS</Text>
            <Text variant="caption" color={colors.bark}>Hold steady in natural light</Text>
            <Text variant="caption" color={colors.bark}>Get close to affected areas</Text>
            <Text variant="caption" color={colors.bark}>Include both healthy and unhealthy parts</Text>
            <Text variant="caption" color={colors.bark}>Try the leaf underside for pests</Text>
          </Card>
          <View style={styles.buttonGroup}>
            <Button variant="primary" onPress={takePhoto}>Open Camera</Button>
            <Button variant="secondary" onPress={pickFromLibrary}>Choose from Library</Button>
          </View>
        </View>
      </View>
    );
  }

  if (step === 'review') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text variant="heading2" color={colors.soil} style={styles.title}>
            Review Photo
          </Text>
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </View>
          )}
          <View style={styles.buttonGroup}>
            <Button variant="primary" onPress={runDiagnosis}>Run Diagnosis</Button>
            <Button variant="ghost" onPress={() => setStep('capture')}>Retake</Button>
          </View>
        </View>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <LoadingPulse size={80} color={colors.sage} />
          <Text variant="heading2" color={colors.soil} style={styles.processingText}>
            Analyzing your plant...
          </Text>
          <Text variant="handwritten" color={colors.terracotta}>
            checking hydration, nutrients, pests, disease, environment, growth
          </Text>
        </View>
      </View>
    );
  }

  if (step === 'error') {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text variant="heading2" color={colors.terracotta} style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="body" color={colors.bark} style={styles.body}>
            {error}
          </Text>
          <View style={styles.buttonGroup}>
            <Button variant="primary" onPress={() => setStep('capture')}>Try Again</Button>
            <Button variant="ghost" onPress={() => router.back()}>Go Back</Button>
          </View>
        </View>
      </View>
    );
  }

  // Result
  if (diagnosis) {
    return (
      <ScrollView style={styles.container}>
        <DiagnosisResult diagnosis={diagnosis} />
        <View style={styles.resultActions}>
          <Button variant="secondary" onPress={() => router.push('/agent/chat')}>
            Ask Nurch About This
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            Back to Plant
          </Button>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xxl },
  title: { textAlign: 'center', marginBottom: spacing.md },
  body: { textAlign: 'center', marginBottom: spacing.xl, opacity: 0.85, lineHeight: 22 },
  tipsCard: { marginBottom: spacing.xl, padding: spacing.lg },
  tipTitle: { fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm },
  buttonGroup: { gap: spacing.md },
  imageContainer: { alignItems: 'center', marginBottom: spacing.xl },
  previewImage: {
    width: 280, height: 210, borderRadius: borderRadius.lg,
    backgroundColor: colors.parchment,
  },
  processingText: { marginTop: spacing.xl, textAlign: 'center' },
  resultActions: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxxl },
});
