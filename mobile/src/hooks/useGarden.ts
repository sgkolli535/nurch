import { useCallback, useEffect, useState } from 'react';
import { useGardenStore } from '../stores/gardenStore';
import * as gardenService from '../services/gardens';

export function useGarden() {
  const { gardens, activeGardenId, setGardens, setActiveGarden, getActiveGarden } = useGardenStore();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await gardenService.listGardens();
      setGardens(data as any);
      if (data.length > 0 && !activeGardenId) {
        setActiveGarden(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [activeGardenId, setGardens, setActiveGarden]);

  const create = useCallback(async (data: { name: string; location_lat?: number; location_lng?: number }) => {
    const garden = await gardenService.createGarden(data);
    await refresh();
    return garden;
  }, [refresh]);

  return {
    gardens,
    activeGarden: getActiveGarden(),
    loading,
    refresh,
    create,
    setActiveGarden,
  };
}
