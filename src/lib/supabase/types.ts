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
      areas_donacion: {
        Row: AreasDonacionRow;
        Insert: AreasDonacionInsert;
        Update: AreasDonacionUpdate;
      };
      documentos_json: {
        Row: DocumentosJsonRow;
        Insert: DocumentosJsonInsert;
        Update: DocumentosJsonUpdate;
      };
    };
  };
}

// Áreas de donación (CSV "Áreas de donación-Vista de cuadrícula": Lugar, ID, Tipo, Dirección, Latitud, Longitud, etc.)
export interface AreasDonacionRow {
  id: number;
  lugar?: string | null;   // nombre del sitio en el CSV
  nombre?: string | null;
  name?: string | null;
  tipo?: string | null;    // Parque, Andador, Espacio público, etc.
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  portada?: string | null;
  evidencia?: string | null;
  video?: string | null;
  estado?: string | null;
  necesidad?: string | null;
  // Cuando los datos provienen de la tabla areas_donacion_json, todo el registro
  // original del CSV vive dentro de esta propiedad.
  data?: any;
  [key: string]: unknown;
}

export interface AreasDonacionInsert {
  id?: number;
  nombre?: string | null;
  name?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  portada?: string | null;
  evidencia?: string | null;
  video?: string | null;
  estado?: string | null;
  necesidad?: string | null;
  [key: string]: unknown;
}

export interface AreasDonacionUpdate {
  nombre?: string | null;
  name?: string | null;
  direccion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  portada?: string | null;
  evidencia?: string | null;
  video?: string | null;
  estado?: string | null;
  necesidad?: string | null;
  [key: string]: unknown;
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

// Documentos JSON unificados (areas_donacion, boletines, gacetas)
export interface DocumentosJsonRow {
  id: number;
  source_type: 'areas_donacion' | 'boletines' | 'gacetas';
  source_id: number;
  data: any; // JSONB - puede contener cualquier estructura según source_type
  updated_at: string;
}

export interface DocumentosJsonInsert {
  source_type: 'areas_donacion' | 'boletines' | 'gacetas';
  source_id: number;
  data: any;
  updated_at?: string;
}

export interface DocumentosJsonUpdate {
  source_type?: 'areas_donacion' | 'boletines' | 'gacetas';
  source_id?: number;
  data?: any;
  updated_at?: string;
}

