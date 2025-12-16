-- Migración: Crear tablas para Mapeo Verde
-- Ejecutar en Supabase SQL Editor

-- Tabla: green_areas (Áreas Verdes)
CREATE TABLE IF NOT EXISTS green_areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  tags TEXT[] DEFAULT '{}',
  need TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: projects (Proyectos/Boletines)
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  promoter TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  impact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: gazettes (Gacetas)
CREATE TABLE IF NOT EXISTS gazettes (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  promoter TEXT NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  impact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: events (Eventos/Agenda)
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  iso_start TEXT NOT NULL,
  iso_end TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance de queries
CREATE INDEX IF NOT EXISTS idx_green_areas_location ON green_areas(lat, lng);
CREATE INDEX IF NOT EXISTS idx_projects_date ON projects(date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_gazettes_date ON gazettes(date DESC);
CREATE INDEX IF NOT EXISTS idx_gazettes_status ON gazettes(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_green_areas_updated_at BEFORE UPDATE ON green_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gazettes_updated_at BEFORE UPDATE ON gazettes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS) para acceso público de lectura
ALTER TABLE green_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE gazettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir lectura pública
CREATE POLICY "Allow public read access on green_areas"
  ON green_areas FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on gazettes"
  ON gazettes FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on events"
  ON events FOR SELECT
  USING (true);

