
  ## 🌱 Mapeo Verde

  Plataforma web para visibilizar, proteger y expandir las áreas verdes de Aguascalientes, con datos abiertos sobre:

  - Áreas verdes (`Inventario Verde`)
  - Agenda de eventos e impactos
  - Boletines y gacetas
  - Bitácora / participación ciudadana

  El frontend está construido en React + Vite, con una arquitectura por features y una capa de datos que combina Supabase, Google Calendar y JSON estáticos como fallback.

  ---

  ## 🚀 Arranque rápido

  ### Requisitos

  - Node.js 18+
  - npm o pnpm

  ### Instalación

  ```bash
  npm install
  ```

  ### Desarrollo

  ```bash
  npm run dev
  ```

  La app corre normalmente en `http://localhost:5173` (puerto por defecto de Vite).

  ### Build de producción

  ```bash
  npm run build
  npm run preview   # opcional, para probar el build
  ```

  El proyecto está preparado para desplegarse también en GitHub Pages; el `basename` del router se detecta automáticamente en `main.tsx`.

  ---

  ## 🧱 Arquitectura

  - `src/App.tsx`: layout principal, navegación por tabs y rutas (React Router).
  - `src/context/DataContext.ts`: **única fuente de datos** de la app (áreas verdes, proyectos, gacetas, eventos, bitácora).
  - `src/features/*`: páginas por dominio funcional:
    - `home`: portada, hero, stats, secciones de contenido.
    - `agenda`: listado de eventos e impactos + detalle.
    - `green-areas`: inventario de áreas verdes (tabla + grid + mapa + detalle).
    - `newsletters`, `gazettes`, `participation`, `manifesto`, `linktree`.
  - `src/components/*`: componentes reutilizables (layout, logo, etc.).
  - `src/hooks/*`: hooks reutilizables (`useSEO`, `useSupabaseQuery`, `useData`, etc.).
  - `src/lib/supabase/*`: cliente, queries tipadas y pequeña capa de cache/dedupe.
  - `src/utils/helpers/*`: helpers de rutas, layout, transformación de datos, etc.

  El `DataProvider`:

  - Verifica conexión a Supabase (`checkSupabaseConnection`).
  - Carga en paralelo:
    - Áreas de donación / áreas verdes (Supabase + JSON).
    - Proyectos y gacetas (Supabase + JSON + mapeo de boletines/gacetas).
    - Eventos y bitácora (Supabase y datos estáticos; calendario vía build/JSON donde aplique).
  - Aplica una **prioridad de orígenes** (documentos JSON → Supabase → JSON estático).
  - Expone `loading`, `error`, `supabaseConnected` y `supabaseError` para el UI (por ejemplo en el `Footer`).

  ---

  ## ✨ Funcionalidades clave

  - **Inventario Verde**
    - Vista tabla + grid con filtros por categoría/estado y buscador.
    - Mapa interactivo (Pigeon Maps) con overlays por área.
    - Detalle enriquecido de cada área, con CTA de denuncia/voluntariado.
  - **Agenda e Impactos**
    - Listado de eventos, con soporte de filtro por fecha (parámetro `date` en la URL).
    - Página de detalle de impacto enrutada por ID.
  - **Boletines y Gacetas**
    - Transformación de JSON y/o Supabase a un modelo de `projects` y `gazettes`.
  - **Participación / Bitácora**
    - Bitácora desde Supabase con respaldo en datos estáticos; el detalle admite markdown enriquecido.

  ---

  ## 🔧 Stack técnico

  - **React 18** + **TypeScript**
  - **Vite** (desarrollo y build)
  - **React Router** (navegación y deep links)
  - **Tailwind CSS** (estilos utilitarios)
  - **Lucide React** (iconos)
  - **Pigeon Maps** (mapas)
  - **Motion / Framer Motion** (`motion/react`) para transiciones y loaders
  - **Supabase**, **Google Calendar** (vía `.ics` en build) (capa de datos)

  ---

  ## 🔐 Integraciones externas (resumen)

  Las credenciales se leen desde variables de entorno Vite (`import.meta.env.*`).  
  Si alguna integración no está configurada o falla:

  - El `DataContext` cae en **datos estáticos** de `src/data/static.ts` como respaldo.
  - Eventos pasados (bitácora) pueden quedarse solo con la versión estática si Supabase no devuelve filas.
  - El footer muestra el estado de conexión a Supabase.

  Este README está pensado para el código actual; la documentación detallada de despliegue, migraciones SQL y guías internas se ha eliminado intencionalmente para dejar el repositorio más ligero.

  ---

  ## 🛡️ React performance + security scan

  Este repositorio integra `react-perf-analyzer` para detectar anti-patrones de rendimiento y riesgos de seguridad en componentes React.

  ### Instalación local del CLI

  El scanner es un binario de Rust. Instálalo una vez:

  ```bash
  cargo install react-perf-analyzer
  ```

  ### Comandos disponibles

  ```bash
  npm run perf:scan      # escaneo completo con umbral high
  npm run perf:changed   # solo archivos modificados (ideal pre-commit)
  npm run perf:ci        # genera SARIF local: react-perf-results.sarif
  npm run perf:baseline  # genera baseline: .sast-baseline.json
  ```

  ### Política inicial de severidad

  - El proyecto inicia con `--fail-on high` en local y CI para bloquear solo riesgos importantes.
  - Cuando el repositorio reduzca deuda técnica, se puede subir a `medium`.

  ### Estrategia de baseline

  - Decisión actual: **no commitear baseline al inicio** para observar el estado real del código.
  - Si el ruido inicial es alto, generar `.sast-baseline.json` con `npm run perf:baseline` y versionarlo para fallar solo por regresiones nuevas.

  ### CI en GitHub

  El workflow [`/.github/workflows/react-perf-analyzer.yml`](.github/workflows/react-perf-analyzer.yml) corre en `pull_request` hacia `main` y publica resultados SARIF para anotaciones en PR/Security.

  ---

  ## 🤝 Contribución

  - Usa TypeScript de forma estricta donde sea posible.
  - Mantén la separación por `features` y reutiliza helpers/hooks existentes antes de crear nuevos.
  - Evita introducir componentes genéricos que no se usen en al menos una página real.

  Cualquier cambio grande en arquitectura debería acompañarse de una breve nota en este `README.md`.
