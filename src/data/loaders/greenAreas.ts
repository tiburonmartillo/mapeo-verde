import { GREEN_AREAS_DATA } from '../static';
import {
  getAreasDonacion,
  getGreenAreas,
  getParticipationGreenAreas,
  getAreasDonacionFromJson,
  type GreenArea,
} from '../../lib/supabase/queries';

/**
 * Carga áreas verdes con la misma prioridad que el DataContext legacy:
 * documentos_json → areas_donacion → green_areas → estáticos + propuestas.
 */
export async function loadGreenAreas(options?: {
  useCache?: boolean;
  includeParticipation?: boolean;
}): Promise<GreenArea[]> {
  const useCache = options?.useCache ?? true;
  const includeParticipation = options?.includeParticipation !== false;

  const [areasDonacionFromJson, areasDonacion, greenAreasSupabase, participationGreenAreas] =
    await Promise.all([
      getAreasDonacionFromJson({ useCache, fallback: [] }),
      getAreasDonacion({ useCache, fallback: [] }),
      getGreenAreas({ useCache, fallback: [] }),
      includeParticipation ? getParticipationGreenAreas() : Promise.resolve([]),
    ]);

  let greenAreas: GreenArea[] = GREEN_AREAS_DATA as GreenArea[];
  if (areasDonacionFromJson && areasDonacionFromJson.length > 0) {
    greenAreas = areasDonacionFromJson;
  } else if (areasDonacion && areasDonacion.length > 0) {
    greenAreas = areasDonacion;
  } else if (greenAreasSupabase && greenAreasSupabase.length > 0) {
    greenAreas = greenAreasSupabase;
  }

  if (participationGreenAreas && participationGreenAreas.length > 0) {
    greenAreas = [...greenAreas, ...participationGreenAreas];
  }

  return greenAreas?.length ? greenAreas : (GREEN_AREAS_DATA as GreenArea[]);
}

export type GreenAreaStats = {
  total: number;
  withNeed: number;
};

/** Stats ligeras a partir de la lista ya cargada (home). */
export function computeGreenAreaStats(areas: GreenArea[]): GreenAreaStats {
  const withNeed = areas.filter((a) => Boolean((a as { need?: string }).need)).length;
  return { total: areas.length, withNeed };
}
