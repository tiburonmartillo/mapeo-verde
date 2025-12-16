/**
 * Tipos TypeScript para las tablas de Supabase
 * Estos tipos deben coincidir con el esquema de la base de datos
 */

export interface Database {
  public: {
    Tables: {
      green_areas: {
        Row: GreenAreaRow;
        Insert: GreenAreaInsert;
        Update: GreenAreaUpdate;
      };
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      gazettes: {
        Row: GazetteRow;
        Insert: GazetteInsert;
        Update: GazetteUpdate;
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: EventUpdate;
      };
    };
  };
}

// Green Areas
export interface GreenAreaRow {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  tags: string[];
  need: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface GreenAreaInsert {
  name: string;
  address: string;
  lat: number;
  lng: number;
  tags?: string[];
  need?: string | null;
  image?: string | null;
}

export interface GreenAreaUpdate {
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  need?: string | null;
  image?: string | null;
}

// Projects
export interface ProjectRow {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description: string | null;
  impact: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description?: string | null;
  impact?: string | null;
}

export interface ProjectUpdate {
  project?: string;
  promoter?: string;
  type?: string;
  date?: string;
  year?: string;
  status?: string;
  lat?: number;
  lng?: number;
  description?: string | null;
  impact?: string | null;
}

// Gazettes
export interface GazetteRow {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description: string | null;
  impact: string | null;
  created_at: string;
  updated_at: string;
}

export interface GazetteInsert {
  id: string;
  project: string;
  promoter: string;
  type: string;
  date: string;
  year: string;
  status: string;
  lat: number;
  lng: number;
  description?: string | null;
  impact?: string | null;
}

export interface GazetteUpdate {
  project?: string;
  promoter?: string;
  type?: string;
  date?: string;
  year?: string;
  status?: string;
  lat?: number;
  lng?: number;
  description?: string | null;
  impact?: string | null;
}

// Events
export interface EventRow {
  id: number;
  title: string;
  date: string;
  time: string;
  iso_start: string;
  iso_end: string;
  location: string;
  category: string;
  image: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  title: string;
  date: string;
  time: string;
  iso_start: string;
  iso_end: string;
  location: string;
  category: string;
  image?: string | null;
  description?: string | null;
}

export interface EventUpdate {
  title?: string;
  date?: string;
  time?: string;
  iso_start?: string;
  iso_end?: string;
  location?: string;
  category?: string;
  image?: string | null;
  description?: string | null;
}

