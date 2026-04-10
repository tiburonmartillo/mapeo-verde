import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  OrganizationProfileRevisionRow,
  OrganizationProfileRow,
  OrganizationProfileUpsertPayload,
} from './organizationProfileTypes';

export async function fetchOrganizationProfileByOwner(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<OrganizationProfileRow | null> {
  const { data, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) {
    console.error('fetchOrganizationProfileByOwner', error);
    return null;
  }
  return data as OrganizationProfileRow | null;
}

export async function insertOrganizationProfile(
  supabase: SupabaseClient,
  ownerId: string,
  payload: OrganizationProfileUpsertPayload,
): Promise<{ data: OrganizationProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('organization_profiles')
    .insert({ ...payload, owner_id: ownerId })
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as OrganizationProfileRow, error: null };
}

export async function updateOrganizationProfile(
  supabase: SupabaseClient,
  profileId: string,
  payload: OrganizationProfileUpsertPayload,
): Promise<{ data: OrganizationProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('organization_profiles')
    .update(payload)
    .eq('id', profileId)
    .select()
    .single();
  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as OrganizationProfileRow, error: null };
}

export async function fetchOrganizationProfileRevisions(
  supabase: SupabaseClient,
  profileId: string,
  limit = 25,
): Promise<OrganizationProfileRevisionRow[]> {
  const { data, error } = await supabase
    .from('organization_profile_revisions')
    .select('id, profile_id, revised_at, revised_by, snapshot')
    .eq('profile_id', profileId)
    .order('revised_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchOrganizationProfileRevisions', error);
    return [];
  }
  return (data ?? []) as OrganizationProfileRevisionRow[];
}
