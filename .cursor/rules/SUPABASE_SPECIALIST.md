# Agente Especialista en Supabase — Mapeo Verde

Referencia completa de la integración con Supabase en este proyecto. Cubre clientes, tablas, RLS, autenticación, storage, Edge Functions y patrones de datos.

---

## 1. Proyecto Supabase

| Campo | Valor |
|-------|-------|
| Project ID | `dejczezthzpeuxfxgvpx` |
| URL | `https://dejczezthzpeuxfxgvpx.supabase.co` |
| Anon key | Hardcoded en `src/utils/supabase/info.tsx` (archivo autogenerado, **NO EDITAR**) |
| Config local | `supabase/config.toml` (API 54321, DB 54322, Studio 54323) |

> **Nota:** El anon key es público y depende de RLS para seguridad. El service role key solo se usa en Edge Functions (secrets del dashboard).

---

## 2. Clientes Supabase (frontend)

Se definen en `src/lib/supabase/client.ts`. Hay **dos singletons**:

### `getSupabaseClient()` — Lectura pública (anon)

```typescript
createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-client-info': 'mapeo-verde@1.0.0' } },
});
```

- **Sin sesión persistida**. Para lecturas públicas y participación ciudadana.
- Usado por `queries.ts`, `DataContext.ts`, `ParticipationPage.tsx`.

### `getSupabaseAuthClient()` — Admin autenticado

```typescript
createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: { headers: { 'x-client-info': 'mapeo-verde-admin@1.0.0' } },
});
```

- **Sesión persistida en localStorage**. Para panel admin y operaciones RLS-protegidas.
- Usado por `IngresoPage`, `AdminEventsPage`, `AdminAccountPage`, `AdminModerationUsersPage`, `OrganizationProfileForm`.

### Funciones auxiliares

| Función | Archivo | Propósito |
|---------|---------|-----------|
| `resetSupabaseClient()` | `client.ts` | Limpia singleton anon (tests) |
| `resetSupabaseAuthClient()` | `client.ts` | Limpia singleton auth (tests) |
| `checkSupabaseConnection()` | `client.ts` | Prueba `select('id').limit(1)` en varias tablas hasta encontrar una que responda |

---

## 3. Esquema de base de datos

### 3.1 Tablas principales

No hay carpeta `supabase/migrations/`. Las migraciones se ejecutan manualmente vía SQL Editor con los scripts `RUN_*.sql`.

| Tabla | Script SQL | Descripción |
|-------|-----------|-------------|
| `events` | `RUN_IN_SUPABASE_SQL_EDITOR.sql` | Eventos de la agenda. Campos: `id`, `title`, `date`, `time`, `iso_start`, `iso_end`, `location`, `category`, `image`, `description`, `visible`, `status` (`pending`/`published`), `source`, `contact_name`, `contact_email`, `created_by`, `created_at`, `updated_at` |
| `event_moderators` | `RUN_IN_SUPABASE_SQL_EDITOR.sql` | Relación usuario ↔ permiso de moderación. PK: `user_id` (FK → `auth.users`) |
| `green_areas` | (referenciado en queries) | Áreas verdes con datos geográficos |
| `areas_donacion` | (referenciado en queries) | Áreas de donación con imágenes en Storage |
| `projects` | (referenciado en queries) | Proyectos/boletines ambientales |
| `gazettes` | (referenciado en queries) | Gacetas de SEMARNAT |
| `participation_submissions` | (referenciado en queries) | Propuestas ciudadanas. Campo `type`: `'GREEN_AREA'` o `'EVENT'` |
| `documentos_json` | (referenciado en queries) | Documentos JSON por `source_type`: `'areas_donacion'`, `'boletines'`, `'gacetas'` |
| `areas_donacion_json` | (referenciado en queries) | JSON legacy de áreas de donación |
| `boletines_json` | (referenciado en queries) | JSON legacy de boletines |
| `gacetas_json` | (referenciado en queries) | JSON legacy de gacetas |
| `kv_store_183eaf28` | `kv_store.tsx` (autogenerado) | Key-value store: `key` TEXT PK, `value` JSONB. Usado por Edge Function `server` |
| `organization_profiles` | `RUN_ORGANIZATION_PROFILES_PHASE1.sql` | Perfiles de organización con campos de visibilidad |
| `organization_profile_revisions` | `RUN_ORGANIZATION_PROFILES_PHASE1.sql` | Historial de revisiones de perfiles |

### 3.2 Funciones y RPCs

| Función | Script | Tipo | Descripción |
|---------|--------|------|-------------|
| `is_events_moderator()` | `RUN_IN_SUPABASE_SQL_EDITOR.sql` | `SECURITY DEFINER` | `true` si `app_metadata.role = 'admin'` O existe en `event_moderators` |
| `moderator_list_auth_users(p_limit, p_search)` | `RUN_MODERATOR_USER_MANAGEMENT.sql` | `SECURITY DEFINER` | Lista usuarios de `auth.users` (solo moderadores) |
| `moderator_grant_events_moderator(target_user_id)` | `RUN_MODERATOR_USER_MANAGEMENT.sql` | `SECURITY DEFINER` | Agrega usuario a `event_moderators` |
| `moderator_revoke_events_moderator(target_user_id)` | `RUN_MODERATOR_USER_MANAGEMENT.sql` | `SECURITY DEFINER` | Elimina usuario de `event_moderators` |
| `community_directory_search(...)` | `RUN_ORGANIZATION_PROFILES_PHASE1.sql` | `SECURITY DEFINER` | Búsqueda en directorio comunitario |
| `community_directory_preview_levels(...)` | `RUN_ORGANIZATION_PROFILES_PHASE1.sql` | `SECURITY DEFINER` | Preview de niveles en directorio |

### 3.3 Triggers

| Trigger | Tabla | Comportamiento |
|---------|-------|---------------|
| `set_updated_at` | `events` | Actualiza `updated_at` en cada UPDATE |
| `enforce_pending_from_participation` | `events` | Fuerza `status = 'pending'` cuando `source = 'participation'` en INSERT |

---

## 4. Row Level Security (RLS)

### `events`

| Política | Rol | Operación | Condición |
|----------|-----|-----------|-----------|
| `anon_select_events` | `anon` | SELECT | `visible = true AND status = 'published'` |
| `anon_insert_events_pending` | `anon` | INSERT | `WITH CHECK (status = 'pending')` |
| `auth_select_events` | `authenticated` | SELECT | Sin restricción (moderadores ven todo) |
| `auth_insert_events` | `authenticated` | INSERT | Sin restricción |
| `auth_update_events` | `authenticated` | UPDATE | `is_events_moderator()` |
| `auth_delete_events` | `authenticated` | DELETE | `is_events_moderator()` |

### `organization_profiles`

- Usuarios autenticados pueden CRUD su propio perfil (`user_id = auth.uid()`).
- Moderadores (`is_events_moderator()`) pueden SELECT todos los perfiles.

### Storage: `organization_logos`

- INSERT/UPDATE/DELETE: autenticado, primer segmento del path = `auth.uid()`.
- SELECT público (anon puede leer).

### Storage: `event_banners`

- Uploads desde anon (`ParticipationPage`) y auth (`AdminEventsPage`).

---

## 5. Autenticación

### 5.1 Flujos soportados

| Flujo | Ubicación | Método |
|-------|-----------|--------|
| **Magic link (OTP)** | `IngresoPage.tsx`, `AdminRegisterPage.tsx` | `signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser: true } })` |
| **Contraseña** | `IngresoPage.tsx` | `signInWithPassword({ email, password })` |
| **Establecer contraseña** | `AdminPasswordSetupModal.tsx` | `updateUser({ password, data: { mv_admin_password_done: true } })` |
| **Sign out** | `AdminEventsPage`, `AdminAccountPage`, `AdminModerationUsersPage` | `supabase.auth.signOut()` |

### 5.2 Redirect URL

Definida en `src/utils/auth/authRedirect.ts`:

- Primero: `VITE_AUTH_EMAIL_REDIRECT_URL` (env var)
- Fallback: `VITE_SITE_URL` + `/admin`
- Fallback final: `https://mapeoverde.org/admin`

### 5.3 Snapshot de tokens en URL

`src/utils/auth/authUrlSnapshot.ts` — Se llama **antes** de crear el auth client en `main.tsx`. Detecta si la URL inicial contenía `access_token=` (hash) o `code=` (query PKCE). Si sí, `App.tsx` redirige de `/` a `/admin` cuando se establece la sesión.

### 5.4 Detección de contraseña en JWT

`src/utils/auth/adminPasswordSetup.ts` — Decodifica `session.access_token` para leer `amr` (Authentication Methods Reference) y determinar si el usuario ya usó contraseña en esta sesión. Controla si mostrar el modal de setup de contraseña.

### 5.5 Resolución de moderador

`src/utils/auth/eventsModerator.ts`:

1. Intenta RPC `is_events_moderator`.
2. Fallback: `user.app_metadata.role === 'admin'` (JWT).

### 5.6 Guards (React, no middleware)

No hay middleware server-side. La protección se hace con `<Navigate>`:

| Ruta | Comportamiento |
|------|---------------|
| `/ingreso` | Si hay sesión → redirige a `/admin` |
| `/admin/registro` | Si hay sesión → redirige a `/admin` |
| `/admin`, `/admin/cuenta`, `/admin/usuarios` | Si no hay sesión → redirige a `/ingreso` |

---

## 6. Capa de datos (queries + cache)

### 6.1 Arquitectura

```
DataContext.ts
  ├── checkSupabaseConnection()
  ├── Promise.all([
  │     getAreasDonacionFromJson()  ← documentos_json
  │     getAreasDonacion()          ← areas_donacion + areas_donacion_json
  │     getGreenAreas()             ← green_areas
  │     getParticipationGreenAreas()← participation_submissions
  │     getProjectsFromJson()       ← documentos_json
  │     getProjects()               ← projects + boletines_json
  │     getGazettesFromJson()       ← documentos_json
  │     getGazettes()               ← gazettes + gacetas_json
  │     getEvents()                 ← events (visible + published)
  │     getPastEvents()             ← events (filtrado por fecha)
  │   ])
  └── Polling agenda cada 60s (VITE_AGENDA_REFRESH_MS)
```

### 6.2 Prioridad de datos

1. `documentos_json` (tabla JSON normalizada)
2. Tablas relacionales (`areas_donacion`, `projects`, etc.)
3. JSON legacy (`areas_donacion_json`, `boletines_json`, `gacetas_json`)
4. Fetch de archivos JSON en `/public/`
5. Datos estáticos en `src/data/static.ts` (último fallback)

### 6.3 Cache y deduplicación

| Módulo | Archivo | Comportamiento |
|--------|---------|---------------|
| `QueryCache` | `src/lib/supabase/cache.ts` | TTL 5 min, limpieza cada 10 min. `generateKey(table, filters?)` |
| `RequestDeduplicator` | `src/lib/supabase/requestDeduplication.ts` | Ventana 1s: llamadas concurrentes idénticas comparten una promesa |
| `clearCache()` | `queries.ts` | Se llama tras cada mutación admin (insert/update/delete event) |

### 6.4 Manejo de error `42703` (columna inexistente)

`getEvents()` y `getPastEvents()` intentan filtrar por `visible` y `status`. Si la tabla aún no tiene esas columnas (error PostgreSQL `42703`), hacen un retry sin esos filtros. Esto permite compatibilidad gradual con migraciones.

### 6.5 Funciones admin (requieren auth client)

| Función | Operación | Tabla |
|---------|-----------|-------|
| `getEventsAll(supabase)` | SELECT * | `events` |
| `insertEvent(supabase, event)` | INSERT | `events` |
| `updateEvent(supabase, id, event)` | UPDATE | `events` |
| `deleteEvent(supabase, id)` | DELETE | `events` |
| `moderatorListAuthUsers(supabase)` | RPC | `moderator_list_auth_users` |
| `moderatorGrantEventsModerator(supabase, userId)` | RPC | `moderator_grant_events_moderator` |
| `moderatorRevokeEventsModerator(supabase, userId)` | RPC | `moderator_revoke_events_moderator` |

### 6.6 Perfiles de organización

Queries en `src/lib/supabase/organizationProfileQueries.ts`:

| Función | Operación |
|---------|-----------|
| `getOrganizationProfile(supabase, userId)` | SELECT de `organization_profiles` |
| `upsertOrganizationProfile(supabase, profile)` | UPSERT en `organization_profiles` |
| `getOrganizationProfileRevisions(supabase, userId)` | SELECT de `organization_profile_revisions` |

Tipos en `src/lib/supabase/organizationProfileTypes.ts`.

---

## 7. Storage (buckets)

| Bucket | Uso | Cliente | Archivos |
|--------|-----|---------|----------|
| `public-data` | Imágenes de áreas de donación | URL construida manualmente | `areas_donacion/*.webp` |
| `event_banners` | Banners de eventos | Anon (participación) + Auth (admin) | `event-banners/<uid>/...` |
| `organization_logos` | Logos de organizaciones | Auth | `<uid>/logo-<timestamp>.<ext>` |

### Patrón de upload

```typescript
const { data, error } = await supabase.storage
  .from('bucket_name')
  .upload(path, file, { cacheControl: '3600', upsert: false });

const { data: publicUrl } = supabase.storage
  .from('bucket_name')
  .getPublicUrl(data.path);
```

### URL manual para `public-data`

```typescript
function getAreasDonacionStorageBaseUrl(): string {
  return `https://${projectId}.supabase.co/storage/v1/object/public/public-data/areas_donacion`;
}
```

---

## 8. Edge Functions (Deno)

### 8.1 `server` — API KV

| Ruta | Método | Descripción |
|------|--------|-------------|
| `supabase/functions/server/` | — | Hono + Deno |
| `/health` | GET | Health check |
| `/seed` | POST | Siembra datos iniciales de `data.ts` en KV si no existen |
| `/data/:type` | GET | Retorna colección por prefijo (`green_areas`, `projects`, `gazettes`, `events`, `past_events`) |
| `/participation` | POST | Guarda propuesta ciudadana en KV |
| `/subscribe` | POST | Suscripción a newsletter por email |

**Tabla KV:** `kv_store_183eaf28` — `key` TEXT PK, `value` JSONB.

**Archivos:**
- `index.ts` — rutas Hono
- `db.ts` — cliente service-role + helpers KV (`get`, `set`, `mset`, `getByPrefix`)
- `kv_store.tsx` — API KV alternativa (autogenerada, misma tabla)
- `data.ts` — datos seed (proyectos, gacetas, áreas verdes, eventos)
- `deno.json` + `import_map.json` — dependencias Deno

**Secrets requeridos:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### 8.2 `send-participation-confirmation` — Email

| Campo | Valor |
|-------|-------|
| Ruta | `supabase/functions/send-participation-confirmation/` |
| Input | POST `{ to, type?, title? }` |
| Output | `{ success, id }` o error |
| API externa | Resend (`https://api.resend.com/emails`) |

**Secrets requeridos:** `RESEND_API_KEY`, (opcional) `RESEND_FROM`.

---

## 9. Variables de entorno relacionadas

| Variable | Contexto | Propósito |
|----------|----------|-----------|
| `VITE_SERVER_URL` | Frontend | URL de la Edge Function `server` (si se usa) |
| `VITE_SITE_URL` | Frontend | URL del sitio (redirect de auth, meta tags) |
| `VITE_AUTH_EMAIL_REDIRECT_URL` | Frontend | Override del redirect URL para magic link |
| `VITE_AGENDA_REFRESH_MS` | Frontend | Intervalo de polling de agenda (default 60000) |
| `SUPABASE_URL` | Edge Functions | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Service role key (secreto) |
| `RESEND_API_KEY` | Edge Function email | API key de Resend |
| `RESEND_FROM` | Edge Function email | Remitente (default `onboarding@resend.dev`) |

---

## 10. Tipos TypeScript

### Tipos de fila (DB) — `src/lib/supabase/types.ts`

Interfaces manuales que reflejan el esquema de cada tabla: `GreenAreaRow`, `ProjectRow`, `GazetteRow`, `EventRow`, `AreasDonacionRow`, `DocumentosJsonRow`.

### Tipos de UI — `src/lib/supabase/queries.ts`

Interfaces con nombres camelCase para consumo en componentes: `GreenArea`, `Project`, `Gazette`, `Event`.

### Tipos de organización — `src/lib/supabase/organizationProfileTypes.ts`

`OrganizationProfile`, `OrganizationProfileRevision`, `FieldVisibility`, `DirectoryLevel`, etc.

---

## 11. Patrones y convenciones

### Al agregar una nueva tabla

1. Agregar script SQL en `supabase/RUN_<NOMBRE>.sql`.
2. Definir tipos de fila en `src/lib/supabase/types.ts`.
3. Escribir query en `src/lib/supabase/queries.ts` usando cache + dedup.
4. Exportar desde `src/lib/supabase/index.ts`.
5. Consumir en `DataContext.ts` o directamente en el componente.

### Al agregar una mutación admin

1. Crear función en `queries.ts` que reciba `SupabaseClient` como primer argumento.
2. Llamar `clearCache()` después de la mutación.
3. En el componente, usar `getSupabaseAuthClient()`.

### Al agregar un bucket de Storage

1. Crear bucket en Supabase Dashboard.
2. Agregar políticas RLS en un script `RUN_<NOMBRE>_STORAGE.sql`.
3. Usar patrón `upload` + `getPublicUrl` (ver sección 7).

### Convención de prefijos KV (Edge Function)

El servidor KV usa prefijos como namespace: `green_area:`, `project:`, `gazette:`, `event:`, `past_event:`, `participation:`, `subscriber:`.

---

## 12. Hook disponible (no utilizado)

`src/hooks/useSupabaseQuery.ts` — Hook genérico para queries asíncronas. Actualmente **no se importa** en ningún componente (el flujo principal usa `DataContext`). Disponible para uso futuro.

---

## 13. Testing

Los tests mockean Supabase:

- `src/test/ParticipationPage.test.tsx` — Mock del cliente para probar envío de propuestas.
- `src/test/OrganizationProfileForm.a11y.test.tsx` — Mock del cliente para test de accesibilidad.

Patrón de mock típico:

```typescript
vi.mock('../lib/supabase/client', () => ({
  getSupabaseClient: () => mockSupabaseClient,
  getSupabaseAuthClient: () => mockSupabaseClient,
}));
```
