# 🔐 Configuración de Variables de Entorno

Este documento explica cómo configurar las variables de entorno necesarias para el proyecto.

## 📋 Variables Requeridas

El proyecto necesita las siguientes variables de entorno:

- `VITE_NOTION_API_KEY` - API Key de Notion
- `VITE_NOTION_DATABASE_ID` - ID de la base de datos de Notion
- `VITE_SERVER_URL` - URL del servidor (opcional, solo para producción)

## 🏠 Desarrollo Local

1. Crea un archivo `.env` en la raíz del proyecto:

```bash
# .env
VITE_NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_SERVER_URL=https://tu-proyecto.supabase.co
```

2. **⚠️ IMPORTANTE**: El archivo `.env` ya está en `.gitignore`, así que NO se subirá a GitHub.

## ☁️ Configuración en GitHub Pages

### Paso 1: Configurar GitHub Secrets

Como GitHub Pages solo sirve archivos estáticos, las variables de entorno deben configurarse durante el build usando GitHub Actions:

1. Ve a tu repositorio en GitHub
2. Click en **Settings** → **Secrets and variables** → **Actions**
3. Click en **New repository secret**
4. Agrega cada variable:
   - **Name**: `VITE_NOTION_API_KEY`
   - **Secret**: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click **Add secret**
5. Repite para las demás variables:
   - `VITE_NOTION_DATABASE_ID`
   - `VITE_SERVER_URL` (opcional)

### Paso 2: Habilitar GitHub Pages

1. Ve a **Settings** → **Pages**
2. En **Source**, selecciona **GitHub Actions**
3. Guarda los cambios

### Paso 3: El Workflow de GitHub Actions

El proyecto incluye un workflow (`.github/workflows/deploy.yml`) que:
- Se ejecuta automáticamente cuando haces push a `main`
- Usa los secrets de GitHub para las variables de entorno
- Hace el build con las variables configuradas
- Despliega automáticamente a GitHub Pages

**No necesitas hacer nada más**, el workflow ya está configurado. Solo asegúrate de tener los secrets configurados.

### Verificar el Despliegue

1. Ve a la pestaña **Actions** en tu repositorio
2. Verifica que el workflow se ejecute correctamente después de cada push
3. Si hay errores, revisa los logs para ver qué variable falta

## 🔄 Otras Opciones de Hosting (No GitHub Pages)

Dependiendo de dónde estés desplegando:

#### **Vercel**
1. Ve a tu proyecto en Vercel
2. Click en **Settings** → **Environment Variables**
3. Agrega cada variable:
   - Key: `VITE_NOTION_API_KEY`
   - Value: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Environments: Selecciona Production, Preview, Development
   - Click **Save**
4. Repite para las demás variables
5. **Re-deploy** tu aplicación para que los cambios surtan efecto

#### **Netlify**
1. Ve a tu sitio en Netlify
2. Click en **Site settings** → **Environment variables**
3. Click en **Add a variable**
4. Agrega cada variable:
   - Key: `VITE_NOTION_API_KEY`
   - Value: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Scope: Selecciona All scopes o específico
   - Click **Create variable**
5. Repite para las demás variables
6. **Trigger a new deploy** para aplicar los cambios

#### **Supabase**
1. Ve a tu proyecto en Supabase
2. Click en **Project Settings** → **Edge Functions** → **Environment variables**
3. Agrega cada variable:
   - Key: `VITE_NOTION_API_KEY`
   - Value: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Click **Save**
4. Repite para las demás variables

#### **Railway / Render / Otros**
1. Ve a la sección de **Environment Variables** o **Config** de tu servicio
2. Agrega las variables con el formato:
   - Key: `VITE_NOTION_API_KEY`
   - Value: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. Reinicia o re-despliega la aplicación

## 🔑 Cómo Obtener los Valores

### Notion API Key
1. Ve a https://www.notion.so/my-integrations
2. Click en **+ New integration**
3. Dale un nombre (ej: "Mapeo Verde")
4. Selecciona el workspace
5. Click **Submit**
6. Copia el **Internal Integration Token** (empieza con `secret_`)

### Notion Database ID
1. Abre tu base de datos en Notion
2. Click en los **...** (tres puntos) en la esquina superior derecha
3. Click en **Copy link**
4. El ID es la parte larga entre `notion.so/` y `?v=`
   - Ejemplo: `https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...`
   - El ID es: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Server URL
- Si usas Supabase: `https://tu-proyecto.supabase.co`
- Si usas otro servicio: La URL base de tu API

## ✅ Verificación

Para verificar que las variables están configuradas correctamente:

1. En desarrollo local, reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. En producción, verifica en la consola del navegador que no aparezcan errores relacionados con Notion.

3. Revisa los logs del servidor para confirmar que las variables se están leyendo correctamente.

## 📝 Notas Importantes

- ⚠️ **NUNCA** subas el archivo `.env` a GitHub
- ✅ El archivo `.env.example` está en el repositorio como plantilla
- 🔄 Después de agregar variables en producción, siempre re-despliega
- 🔐 Las variables que empiezan con `VITE_` son expuestas al cliente (frontend)
- 🛡️ Considera usar variables de servidor para información sensible

## 🆘 Troubleshooting

### Las variables no se están leyendo
- Verifica que el nombre de la variable sea exactamente el mismo (case-sensitive)
- Asegúrate de reiniciar el servidor después de agregar variables
- En producción, verifica que hayas re-desplegado después de agregar las variables

### Error de CORS con Notion
- Verifica que `VITE_SERVER_URL` esté configurada correctamente
- Asegúrate de que el endpoint del servidor esté funcionando

### Error 401 (Unauthorized)
- Verifica que `VITE_NOTION_API_KEY` sea correcta
- Asegúrate de que la integración tenga acceso a la base de datos

