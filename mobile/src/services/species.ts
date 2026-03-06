import { api } from './api';

export interface Species {
  id: string;
  common_name: string;
  scientific_name: string | null;
  family: string | null;
  category: string | null;
  hardiness_zones: string | null;
  sun_requirement: string | null;
  water_needs: string | null;
  frost_tolerant: boolean;
  icon_emoji: string | null;
}

export interface SpeciesDetail extends Species {
  soil_ph_low: number | null;
  soil_ph_high: number | null;
  soil_type_preferred: string | null;
  humidity_preference: string | null;
  temp_min_f: number | null;
  temp_max_f: number | null;
  temp_ideal_low_f: number | null;
  temp_ideal_high_f: number | null;
  growth_rate: string | null;
  mature_height: string | null;
  mature_spread: string | null;
  days_to_maturity: number | null;
  lifespan_type: string | null;
  care_calendar: Record<string, string[]> | null;
  common_pests: string[] | null;
  common_diseases: string[] | null;
  healthy_description: string | null;
  symptom_guide: Array<{ symptom: string; likely_cause: string; visual_description: string }> | null;
  companions: string[] | null;
  antagonists: string[] | null;
}

export async function searchSpecies(query?: string, category?: string) {
  const { data } = await api.get<Species[]>('/api/v1/species', {
    params: { q: query, category },
  });
  return data;
}

export async function getPopularSpecies() {
  const { data } = await api.get<Species[]>('/api/v1/species/popular');
  return data;
}

export async function getSpeciesDetail(speciesId: string) {
  const { data } = await api.get<SpeciesDetail>(`/api/v1/species/${speciesId}`);
  return data;
}
