import { api } from './api';

export interface Garden {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  hardiness_zone: string | null;
  soil_type: string | null;
  privacy: string;
  zones: Zone[];
  plant_count: number;
}

export interface Zone {
  id: string;
  garden_id: string;
  name: string;
  light_type: string | null;
  zone_type: string | null;
  sort_order: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface Plant {
  id: string;
  garden_id: string;
  zone_id: string | null;
  species_id: string | null;
  custom_name: string;
  planting_date: string | null;
  location_detail: string | null;
  container_type: string | null;
  notes: string | null;
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  is_active: boolean;
  position_x: number;
  position_y: number;
  cover_photo_url: string | null;
}

// Gardens
export async function createGarden(data: { name: string; description?: string; location_lat?: number; location_lng?: number }) {
  const { data: garden } = await api.post<Garden>('/api/v1/gardens', data);
  return garden;
}

export async function listGardens() {
  const { data } = await api.get<Garden[]>('/api/v1/gardens');
  return data;
}

export async function getGarden(gardenId: string) {
  const { data } = await api.get<Garden>(`/api/v1/gardens/${gardenId}`);
  return data;
}

export async function updateGarden(gardenId: string, updates: Partial<Garden>) {
  const { data } = await api.patch<Garden>(`/api/v1/gardens/${gardenId}`, updates);
  return data;
}

// Zones
export async function createZone(gardenId: string, data: { name: string; zone_type?: string; light_type?: string; position_x?: number; position_y?: number; width?: number; height?: number }) {
  const { data: zone } = await api.post<Zone>(`/api/v1/gardens/${gardenId}/zones`, data);
  return zone;
}

export async function listZones(gardenId: string) {
  const { data } = await api.get<Zone[]>(`/api/v1/gardens/${gardenId}/zones`);
  return data;
}

// Plants
export async function createPlant(gardenId: string, data: { custom_name: string; species_id?: string; zone_id?: string; position_x?: number; position_y?: number }) {
  const { data: plant } = await api.post<Plant>(`/api/v1/gardens/${gardenId}/plants`, data);
  return plant;
}

export async function listPlants(gardenId: string, filters?: { zone_id?: string; health_status?: string }) {
  const { data } = await api.get<Plant[]>(`/api/v1/gardens/${gardenId}/plants`, { params: filters });
  return data;
}

export async function getPlant(plantId: string) {
  const { data } = await api.get<Plant>(`/api/v1/plants/${plantId}`);
  return data;
}

export async function updatePlant(plantId: string, updates: Partial<Plant>) {
  const { data } = await api.patch<Plant>(`/api/v1/plants/${plantId}`, updates);
  return data;
}
