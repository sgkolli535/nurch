import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';

interface PhotoResult {
  uri: string;
  width: number;
  height: number;
}

export function useCamera() {
  const takePhoto = useCallback(async (): Promise<PhotoResult | null> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, width: asset.width, height: asset.height };
  }, []);

  const pickFromGallery = useCallback(async (): Promise<PhotoResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, width: asset.width, height: asset.height };
  }, []);

  return { takePhoto, pickFromGallery };
}
