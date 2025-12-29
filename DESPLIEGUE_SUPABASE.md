# 🚀 Despliegue del Servidor Supabase

## Opción 1: Usando Supabase CLI (Recomendado)

### 1. Instalar Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**O usando npm:**
```bash
npm install -g supabase
```

### 2. Iniciar sesión en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte.

### 3. Vincular el proyecto

```bash
cd "/Users/oergano/Projects/Mapeo Verde"
supabase link --project-ref jvwtihesgbzixitfwxaf
```

### 4. Desplegar la función

```bash
supabase functions deploy server --project-ref jvwtihesgbzixitfwxaf
```

### 5. Configurar el secret NOTION_API_KEY

```bash
supabase secrets set NOTION_API_KEY=tu-api-key-de-notion --project-ref jvwtihesgbzixitfwxaf
```

**Nota**: Reemplaza `tu-api-key-de-notion` con tu API Key real de Notion.

## Opción 2: Desde el Dashboard de Supabase

1. Ve a: https://supabase.com/dashboard/project/jvwtihesgbzixitfwxaf
2. Ve a **Edge Functions**
3. Crea una nueva función llamada `server`
4. Copia el contenido de `src/supabase/functions/server/index.tsx`
5. También necesitas copiar los archivos de dependencias:
   - `db.ts`
   - `data.ts`
   - `kv_store.tsx`
6. Configura el secret `NOTION_API_KEY` en **Project Settings** → **Edge Functions** → **Secrets**

## Verificación

Después del despliegue, verifica que funcione:

```bash
curl https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/health
```

Deberías recibir: `{"status":"ok"}`

## Notas

- La función debe estar desplegada en: `https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/`
- El secret `NOTION_API_KEY` debe estar configurado en Supabase
- El código del servidor está en `src/supabase/functions/server/index.tsx`
