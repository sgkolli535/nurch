import { useCallback, useState } from 'react';
import { api } from '../services/api';

interface DiagnosisResult {
  id: string;
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
}

export function useDiagnosis() {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = useCallback(async (plantId: string, photoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(`/api/v1/plants/${plantId}/diagnoses`, {
        photo_id: photoId,
      });
      setResult(data);
      return data;
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Diagnosis failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLatest = useCallback(async (plantId: string) => {
    try {
      const { data } = await api.get(`/api/v1/plants/${plantId}/diagnoses/latest`);
      setResult(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  return { result, loading, error, runDiagnosis, getLatest };
}
