# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para el proyecto Mapeo Verde.

## Paso 1: Crear las Tablas

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `migrations/001_create_tables.sql`
4. Ejecuta el script

Este script creará:
- Tabla `green_areas` (Áreas Verdes)
- Tabla `projects` (Proyectos/Boletines)
- Tabla `gazettes` (Gacetas)
- Tabla `events` (Eventos/Agenda)
- Índices para optimizar queries
- Políticas RLS para acceso público de lectura

## Paso 2: Insertar Datos Iniciales (Opcional)

1. En el **SQL Editor**, copia y pega el contenido de `migrations/002_seed_data.sql`
2. Ejecuta el script para insertar datos de ejemplo

## Paso 3: Verificar Configuración

### Verificar Credenciales

Asegúrate de que `src/utils/supabase/info.tsx` tenga las credenciales correctas:

```typescript
export const projectId = "tu-project-id"
export const publicAnonKey = "tu-public-anon-key"
```

Puedes encontrar estas credenciales en:
- **Settings** → **API** → **Project URL** (extrae el ID del proyecto)
- **Settings** → **API** → **anon/public key**

### Verificar Políticas RLS

Las tablas deben tener Row Level Security (RLS) habilitado con políticas de lectura pública. Esto ya está configurado en el script de migración.

## Paso 4: Probar la Conexión

Una vez configurado, la aplicación debería:

1. Intentar obtener datos de Supabase
2. Si falla, usar datos estáticos como fallback
3. Mostrar datos en la interfaz

Puedes verificar en la consola del navegador si hay errores de conexión.

## Estructura de Datos

### Green Areas
```typescript
{
  id: number,
  name: string,
  address: string,
  lat: number,
  lng: number,
  tags: string[],
  need: string,
  image: string
}
```

### Projects
```typescript
{
  id: string,
  project: string,
  promoter: string,
  type: string,
  date: string (YYYY-MM-DD),
  year: string,
  status: string,
  lat: number,
  lng: number,
  description: string,
  impact: string
}
```

### Gazettes
```typescript
{
  id: string,
  project: string,
  promoter: string,
  type: string,
  date: string (YYYY-MM-DD),
  year: string,
  status: string,
  lat: number,
  lng: number,
  description: string,
  impact: string
}
```

### Events
```typescript
{
  id: number,
  title: string,
  date: string (YYYY-MM-DD),
  time: string,
  iso_start: string (ISO 8601),
  iso_end: string (ISO 8601),
  location: string,
  category: string,
  image: string,
  description: string
}
```

## Troubleshooting

### Error: "Missing Supabase credentials"
- Verifica que `src/utils/supabase/info.tsx` tenga las credenciales correctas
- Asegúrate de que el `projectId` y `publicAnonKey` estén definidos

### Error: "relation does not exist"
- Ejecuta el script de migración `001_create_tables.sql`
- Verifica que las tablas se crearon correctamente en el SQL Editor

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén creadas
- Asegúrate de que las políticas permitan SELECT público

### Los datos no se cargan
- Revisa la consola del navegador para errores
- Verifica que las tablas tengan datos
- La aplicación debería usar datos estáticos como fallback si Supabase falla

## Próximos Pasos

1. **Importar datos existentes**: Si tienes datos en JSON, puedes crear un script para importarlos
2. **Configurar actualizaciones automáticas**: Considera usar Supabase Realtime para actualizaciones en vivo
3. **Optimizar queries**: Revisa los índices y ajusta según tus necesidades de consulta

