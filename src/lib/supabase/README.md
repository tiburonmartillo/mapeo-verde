# Supabase Client Optimizado

Este módulo proporciona una conexión optimizada con Supabase que incluye:

## Características

### 1. **Singleton Pattern**
- Reutiliza la misma instancia del cliente en toda la aplicación
- Evita crear múltiples conexiones innecesarias

### 2. **Sistema de Caché**
- Caché en memoria con TTL configurable (5 minutos por defecto)
- Reduce requests redundantes a Supabase
- Limpieza automática de entradas expiradas

### 3. **Deduplicación de Requests**
- Evita hacer múltiples requests idénticos simultáneamente
- Reutiliza la misma promesa para requests duplicadas dentro de 1 segundo

### 4. **Fallback a Datos Estáticos**
- Si Supabase falla, automáticamente usa datos estáticos locales
- Garantiza que la aplicación siempre tenga datos disponibles

### 5. **Manejo de Errores Robusto**
- Captura y maneja errores de forma elegante
- Logs informativos para debugging
- No rompe la aplicación si hay problemas de conexión

## Uso

### Cliente de Supabase

```typescript
import { getSupabaseClient } from '@/lib/supabase';

const supabase = getSupabaseClient();
```

### Queries con Caché

```typescript
import { getGreenAreas, getProjects } from '@/lib/supabase';

// Con caché (por defecto)
const areas = await getGreenAreas();

// Sin caché
const areas = await getGreenAreas({ useCache: false });

// Con TTL personalizado
const areas = await getGreenAreas({ 
  useCache: true, 
  cacheTTL: 10 * 60 * 1000 // 10 minutos
});

// Con fallback
const areas = await getGreenAreas({ 
  fallback: DEFAULT_AREAS 
});
```

### Hook Personalizado

```typescript
import { useSupabaseQuery } from '@/hooks';
import { getGreenAreas } from '@/lib/supabase';

function MyComponent() {
  const { data, loading, error, refetch } = useSupabaseQuery(
    () => getGreenAreas(),
    {
      enabled: true,
      refetchOnMount: false,
      fallback: DEFAULT_AREAS
    }
  );

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
}
```

### Limpiar Caché

```typescript
import { clearCache } from '@/lib/supabase';

// Limpiar todo el caché
clearCache();
```

## Estructura de Archivos

```
src/lib/supabase/
├── client.ts              # Cliente singleton de Supabase
├── cache.ts               # Sistema de caché en memoria
├── requestDeduplication.ts # Deduplicación de requests
├── queries.ts             # Funciones de query optimizadas
└── index.ts               # Exports principales
```

## Optimizaciones Implementadas

1. **Connection Pooling**: Una sola instancia del cliente
2. **Request Deduplication**: Evita requests duplicados simultáneos
3. **In-Memory Caching**: Reduce llamadas a la API
4. **Automatic Cleanup**: Limpia caché y requests antiguas automáticamente
5. **Error Resilience**: Fallback automático a datos estáticos
6. **Type Safety**: TypeScript completo con tipos definidos

## Configuración

Las credenciales de Supabase se obtienen de:
- `src/utils/supabase/info.tsx` (projectId y publicAnonKey)

La URL se construye automáticamente como: `https://{projectId}.supabase.co`

