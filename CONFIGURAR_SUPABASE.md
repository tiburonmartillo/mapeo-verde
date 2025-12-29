# 🔧 Configuración de Supabase para Notion

## ¿Por qué usar Supabase?

Supabase actúa como proxy para la API de Notion, evitando problemas de CORS cuando se llama directamente desde el navegador.

## Pasos para configurar

### 1. Configurar NOTION_API_KEY en Supabase

1. Ve a tu proyecto en Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/jvwtihesgbzixitfwxaf
   - O busca tu proyecto en: https://supabase.com/dashboard

2. Ve a **Project Settings** → **Edge Functions** → **Secrets**

3. Agrega un nuevo secret:
   - **Name**: `NOTION_API_KEY`
   - **Value**: Tu API Key de Notion (empieza con `secret_`)
   - Click **Save**

### 2. Verificar que el servidor esté desplegado

El código del servidor ya está en `src/supabase/functions/server/index.tsx` y debería estar desplegado automáticamente. Si no, necesitas desplegarlo manualmente.

### 3. Configurar VITE_SERVER_URL (Opcional)

Si quieres especificar la URL manualmente, agrega en GitHub Secrets:
- **Name**: `VITE_SERVER_URL`
- **Value**: `https://jvwtihesgbzixitfwxaf.supabase.co`

**Nota**: Si no configuras `VITE_SERVER_URL`, el código construirá automáticamente la URL desde el `projectId` de Supabase.

## Verificación

Después de configurar, el código:
1. Intentará usar Supabase como proxy primero
2. Si falla, intentará usar la API de Notion directamente (puede fallar por CORS)
3. Si todo falla, usará datos estáticos como fallback

Para verificar errores en producción:
1. Abre https://mapeoverde.org/ en el navegador
2. Abre la consola (F12)
3. Ejecuta: `window.__NOTION_ERROR__`
4. Si hay un error, verás el mensaje específico
