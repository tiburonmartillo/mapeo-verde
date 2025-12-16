-- Seed: Datos iniciales para Mapeo Verde
-- Ejecutar después de crear las tablas

-- Insertar Áreas Verdes
INSERT INTO green_areas (name, address, lat, lng, tags, need, image) VALUES
  ('Jardín de San Marcos', 'Jesús F. Contreras, Barrio de San Marcos', 21.8798, -102.3025, 
   ARRAY['Jardín Histórico', 'Turismo'], 'Mantenimiento de balaustrada',
   'https://images.unsplash.com/photo-1596276122653-651a3898309f?q=80&w=1000&auto=format&fit=crop'),
  ('Parque Tres Centurias', 'Av. Alameda 301, Barrio de la Estación', 21.8943, -102.2832,
   ARRAY['Parque Recreativo', 'Patrimonio Industrial'], 'Reforestación zona norte',
   'https://images.unsplash.com/photo-1555899434-94d1368b7af6?q=80&w=1000&auto=format&fit=crop'),
  ('Parque Rodolfo Landeros', 'Blvd. José María Chávez s/n', 21.8605, -102.2850,
   ARRAY['Reserva Ecológica', 'Fauna'], 'Sistema de riego eficiente',
   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop'),
  ('Línea Verde (Tramo 1)', 'Av. Poliducto, Villas de Nuestra Señora', 21.9050, -102.2550,
   ARRAY['Corredor Biológico', 'Deportivo'], 'Seguridad e iluminación',
   'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- Insertar Eventos
INSERT INTO events (title, date, time, iso_start, iso_end, location, category, image, description) VALUES
  ('Reforestación Urbana: Corredor Oriente', '2025-02-14', '08:00 AM - 12:00 PM',
   '20250214T080000', '20250214T120000', 'Av. Tecnológico esq. Poliducto', 'Voluntariado',
   'https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?q=80&w=1000&auto=format&fit=crop',
   'Únete a la brigada para plantar 50 mezquites nativos. Trae ropa cómoda, gorra y tu botella de agua. Nosotros ponemos la herramienta.'),
  ('Taller: Huertos en Espacios Pequeños', '2025-02-15', '10:00 AM - 02:00 PM',
   '20250215T100000', '20250215T140000', 'Casa de la Cultura (Centro)', 'Educación',
   'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop',
   'Aprende a cultivar tus propios alimentos en macetas y balcones. Incluye kit de semillas de temporada.'),
  ('Avistamiento de Aves: Bosque de los Cobos', '2025-02-16', '07:00 AM - 11:00 AM',
   '20250216T070000', '20250216T110000', 'Entrada Principal Bosque de los Cobos', 'Recorrido',
   'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1000&auto=format&fit=crop',
   'Caminata guiada por ornitólogos locales. Identificaremos especies migratorias que visitan nuestra ciudad en invierno.'),
  ('Mercado de Trueque y Reciclaje', '2025-02-16', '11:00 AM - 04:00 PM',
   '20250216T110000', '20250216T160000', 'Parque Rodolfo Landeros', 'Comunidad',
   'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop',
   'Trae tus residuos separados (vidrio, cartón, electrónicos) y cámbialos por productos locales o plantas.')
ON CONFLICT DO NOTHING;

