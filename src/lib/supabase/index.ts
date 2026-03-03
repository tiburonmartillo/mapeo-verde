export { getSupabaseClient, resetSupabaseClient, checkSupabaseConnection } from './client';
export { queryCache } from './cache';
export { requestDeduplicator } from './requestDeduplication';
export {
  getGreenAreas,
  getParticipationGreenAreas,
  getAreasDonacion,
  getProjects,
  getGazettes,
  getEvents,
  getParticipationEvents,
  getPastEvents,
  getAreasDonacionFromJson,
  getProjectsFromJson,
  getGazettesFromJson,
  clearCache,
  type GreenArea,
  type Project,
  type Gazette,
  type Event,
} from './queries';
export type * from './types';

