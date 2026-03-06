import { create } from 'zustand';

interface Plant {
  id: string;
  custom_name: string;
  species_id: string | null;
  zone_id: string | null;
  health_status: 'healthy' | 'warning' | 'critical' | 'unknown';
  cover_photo_url: string | null;
  position_x: number;
  position_y: number;
}

interface Zone {
  id: string;
  name: string;
  light_type: string | null;
  zone_type: string | null;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  plants: Plant[];
}

interface Garden {
  id: string;
  name: string;
  hardiness_zone: string | null;
  location_lat: number | null;
  location_lng: number | null;
  zones: Zone[];
  plants: Plant[];
}

interface GardenState {
  gardens: Garden[];
  activeGardenId: string | null;
  setGardens: (gardens: Garden[]) => void;
  setActiveGarden: (id: string) => void;
  getActiveGarden: () => Garden | null;
}

export const useGardenStore = create<GardenState>((set, get) => ({
  gardens: [],
  activeGardenId: null,
  setGardens: (gardens) => set({ gardens }),
  setActiveGarden: (id) => set({ activeGardenId: id }),
  getActiveGarden: () => {
    const { gardens, activeGardenId } = get();
    return gardens.find((g) => g.id === activeGardenId) ?? gardens[0] ?? null;
  },
}));
