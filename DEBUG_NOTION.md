# Debug de Notion en Producción

Para verificar si las variables de entorno están configuradas correctamente en producción:

1. Abre la consola del navegador en https://mapeoverde.org/
2. Ejecuta: `window.__NOTION_ERROR__`
3. Si hay un error, verás el mensaje. Si es `undefined`, las variables están configuradas pero puede haber otro problema.

## Verificar variables de entorno en el build

Las variables deben estar disponibles durante el build. Para verificar:

1. Ve a: https://github.com/tiburonmartillo/mapeo-verde/actions
2. Abre el último workflow ejecutado
3. Revisa el paso "Build" para ver si hay errores
4. Verifica que las variables estén configuradas en: Settings → Secrets and variables → Actions

## Variables requeridas

- `VITE_NOTION_DATABASE_ID` - ID de la base de datos de Notion
- `VITE_NOTION_API_KEY` - API Key de Notion (para usar API directamente)

O alternativamente:

- `VITE_NOTION_DATABASE_ID` - ID de la base de datos de Notion
- `VITE_SERVER_URL` - URL del servidor Supabase (si usas Supabase como proxy)

## Verificar en el código compilado

Las variables de Vite se reemplazan en tiempo de build. Para verificar si están incluidas:

1. Descarga el artifact del build
2. Busca en los archivos JS compilados por `VITE_NOTION_DATABASE_ID` o `VITE_NOTION_API_KEY`
3. Si encuentras estas cadenas literales (no reemplazadas), las variables no se están inyectando correctamente
