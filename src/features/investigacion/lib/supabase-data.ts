import { createClient, SupabaseClient } from '@supabase/supabase-js'

const INVESTIGACION_PROJECT_ID = 'jvwtihesgbzixitfwxaf'
const INVESTIGACION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3RpaGVzZ2J6aXhpdGZ3eGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQ0OTcsImV4cCI6MjA4MTA2MDQ5N30.nb5cDSxrMh-8u8yW-8NnMDcVte0lqcO__7SYzWLnwik'

let investigacionClient: SupabaseClient | null = null

export function getInvestigacionClient(): SupabaseClient {
  if (!investigacionClient) {
    investigacionClient = createClient(
      `https://${INVESTIGACION_PROJECT_ID}.supabase.co`,
      INVESTIGACION_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' },
      },
    )
  }
  return investigacionClient
}

export function getBoletinesDataUrl(): string {
  return '/data/boletines.json'
}

export function getGacetasDataUrl(): string {
  return '/data/gacetas_semarnat_analizadas.json'
}

export function addCacheBust(url: string, key = 'v'): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${key}=${Date.now()}`
}
