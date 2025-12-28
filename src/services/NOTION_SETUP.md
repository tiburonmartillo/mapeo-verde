# Configuración de Notion para Bitácora de Impacto

Para que la sección de "Bitácora de Impacto" obtenga datos desde Notion, necesitas configurar las siguientes variables de entorno:

## Variables de Entorno Requeridas

### Opción 1: Usando la API de Notion directamente

```env
VITE_NOTION_DATABASE_ID=tu-database-id-aqui
VITE_NOTION_API_KEY=tu-api-key-aqui
```

### Opción 2: Usando un endpoint proxy

```env
VITE_NOTION_PROXY_URL=https://tu-proxy.com/api/notion
```

## Pasos para Configurar

### 1. Crear una base de datos en Notion

1. Crea una nueva base de datos en Notion
2. Agrega las siguientes propiedades:
   - **title** (Título): Campo de título - **Requerido**
   - **date** (Fecha): Campo de fecha - **Requerido**
   - **category** (Categoría): Campo de selección o texto - **Requerido**
   - **stats** (Estadísticas): Campo de texto - **Opcional**

**Nota importante**: NO necesitas crear una propiedad "content". El contenido se obtiene automáticamente desde el cuerpo de cada página (los bloques que escribes dentro de la página).

### 2. Obtener el Database ID

1. Abre tu base de datos en Notion
2. Copia la URL - debería verse así: `https://www.notion.so/tu-workspace/DATABASE_ID?v=...`
3. El `DATABASE_ID` es la parte después de `/` y antes de `?`

### 3. Crear una integración de Notion

1. Ve a https://www.notion.so/my-integrations
2. Crea una nueva integración
3. Dale un nombre (ej: "Mapeo Verde")
4. Copia el "Internal Integration Token" - este es tu `VITE_NOTION_API_KEY`
5. Comparte tu base de datos con esta integración:
   - Abre tu base de datos
   - Click en "..." (tres puntos) → "Connections" → Selecciona tu integración

### 4. Configurar las variables de entorno

Crea un archivo `.env` en la raíz del proyecto:


**Nota**: En producción, configura estas variables en tu plataforma de hosting (Vercel, Netlify, etc.)

## Estructura de Datos Esperada

Cada página en Notion debe tener las siguientes **propiedades** en la base de datos:

- **title** (Título): El título del evento/misión
- **date** (Fecha): La fecha en formato ISO (YYYY-MM-DD)
- **category** (Categoría): La categoría (ej: "Resultados", "Misión Cumplida", "Data")
- **stats** (Estadísticas): Estadísticas destacadas (opcional)

## Contenido de la Página

**Importante**: El contenido completo se obtiene automáticamente desde el **cuerpo de la página** (los bloques que escribes dentro de la página), no desde las propiedades.

Puedes escribir el contenido directamente en la página usando cualquier tipo de bloque de Notion:
- Párrafos de texto
- Encabezados (H1, H2, H3)
- Listas (con viñetas, numeradas, tareas)
- Citas y callouts
- Código con sintaxis
- Imágenes
- Enlaces
- Y más...

Todos estos bloques se convertirán automáticamente a markdown y se renderizarán en la aplicación.

### Tipos de Bloques Soportados

El sistema convierte automáticamente los siguientes tipos de bloques de Notion a markdown:

- **Párrafos**: Texto normal con formato (negritas, cursivas, código inline, enlaces)
- **Encabezados**: H1, H2, H3
- **Listas**:
  - Listas con viñetas
  - Listas numeradas
  - Listas de tareas (checkboxes)
- **Citas**: Bloques de cita
- **Callouts**: Bloques destacados con iconos
- **Código**: Bloques de código con resaltado de sintaxis
- **Imágenes**: Se convierten a formato markdown de imágenes
- **Videos**: Se convierten a enlaces
- **Enlaces/Bookmarks**: Se convierten a formato markdown
- **Divisores**: Líneas horizontales

### Formato de Texto Soportado

Dentro de los bloques de texto, puedes usar:
- **Negritas**: `**texto**` o `__texto__`
- *Cursivas*: `*texto*` o `_texto_`
- `Código inline`: Texto con formato de código
- ~~Tachado~~: Texto tachado
- [Enlaces](url): Enlaces a otras páginas o URLs

## Ejemplo de Página en Notion

### Propiedades de la Base de Datos:
- **Título**: Limpieza Masiva: Río San Pedro
- **Fecha**: 2025-02-08
- **Categoría**: Resultados
- **Estadísticas**: 350kg Recolectados

### Contenido dentro de la Página (bloques):

```
Gracias a los 45 voluntarios que asistieron, logramos retirar más de media tonelada de residuos sólidos del cauce del río.

## Resultados

- 350kg de residuos recolectados
- 3 áreas limpiadas
- 45 voluntarios participantes

### Impacto Ambiental

Este esfuerzo conjunto no solo mejora la estética del lugar, sino que previene la contaminación del agua y reduce riesgos de inundaciones.

> 💡 Próximos pasos: Continuaremos con la limpieza mensual del río.
```

**Nota**: El contenido se escribe directamente en el cuerpo de la página usando los bloques de Notion. No necesitas crear una propiedad "content" - el sistema obtiene automáticamente todo el contenido de los bloques de la página.

## Fallback

Si no se configura Notion o hay un error al obtener los datos, la aplicación usará automáticamente los datos estáticos definidos en `src/data/static.ts`.

