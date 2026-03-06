import { api } from './api';

export interface Photo {
  id: string;
  plant_id: string;
  original_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
}

export interface Diagnosis {
  id: string;
  plant_id: string;
  overall_health: string;
  confidence_score: number;
  confidence_level: string | null;
  summary: string | null;
  reasoning_chain: string[] | null;
  citations: Array<{ source: string; claim: string }> | null;
  uncertainty_notes: string | null;
  hydration_status: any;
  nutrient_status: any;
  pest_status: any;
  disease_status: any;
  environmental_status: any;
  growth_assessment: any;
  predictions: any[] | null;
  created_at: string;
}

export async function listPhotos(plantId: string): Promise<Photo[]> {
  const { data } = await api.get<Photo[]>(`/api/v1/plants/${plantId}/photos`);
  return data;
}

export async function requestUploadUrl(plantId: string, contentType = 'image/jpeg') {
  const { data } = await api.post('/api/v1/photos/upload-url', {
    plant_id: plantId,
    content_type: contentType,
  });
  return data as { upload_url: string; photo_id: string; storage_key: string };
}

export async function confirmUpload(photoId: string, width?: number, height?: number) {
  const { data } = await api.patch(`/api/v1/photos/${photoId}/confirm`, { width, height });
  return data;
}

export async function createDiagnosis(plantId: string, photoId: string): Promise<Diagnosis> {
  const { data } = await api.post<Diagnosis>(`/api/v1/plants/${plantId}/diagnoses`, {
    photo_id: photoId,
  });
  return data;
}

export async function getLatestDiagnosis(plantId: string): Promise<Diagnosis | null> {
  try {
    const { data } = await api.get<Diagnosis>(`/api/v1/plants/${plantId}/diagnoses/latest`);
    return data;
  } catch {
    return null;
  }
}

export async function listDiagnoses(plantId: string): Promise<Diagnosis[]> {
  const { data } = await api.get<Diagnosis[]>(`/api/v1/plants/${plantId}/diagnoses`);
  return data;
}
