import { useCallback, useState } from 'react';
import { api } from '../services/api';

interface PlantDetail {
  id: string;
  custom_name: string;
  health_status: string;
  species_id: string | null;
  zone_id: string | null;
  planting_date: string | null;
  notes: string | null;
  cover_photo_url: string | null;
}

interface Photo {
  id: string;
  original_url: string;
  thumbnail_url: string | null;
  uploaded_at: string;
}

interface DiagnosisSummary {
  id: string;
  overall_health: string;
  confidence_level: string | null;
  summary: string | null;
  created_at: string;
}

export function usePlant(plantId: string) {
  const [plant, setPlant] = useState<PlantDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [diagnoses, setDiagnoses] = useState<DiagnosisSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlant = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/v1/plants/${plantId}`);
      setPlant(data);
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  const fetchPhotos = useCallback(async () => {
    const { data } = await api.get(`/api/v1/plants/${plantId}/photos`);
    setPhotos(data);
  }, [plantId]);

  const fetchDiagnoses = useCallback(async () => {
    const { data } = await api.get(`/api/v1/plants/${plantId}/diagnoses`);
    setDiagnoses(data);
  }, [plantId]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchPlant(), fetchPhotos(), fetchDiagnoses()]);
  }, [fetchPlant, fetchPhotos, fetchDiagnoses]);

  return { plant, photos, diagnoses, loading, refresh, fetchPlant, fetchPhotos, fetchDiagnoses };
}
