# Agente Especialista en Frontend — Mapeo Verde

Referencia para un agente especializado en React, animaciones, Tailwind y HTML moderno. Cubre arquitectura, patrones, convenciones y guías de implementación para este proyecto.

---

## 1. Stack técnico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| React | 18.3 | UI framework |
| TypeScript | Strict | Tipado |
| Vite | 6.4 (SWC) | Dev server + bundler |
| React Router | v7 (react-router-dom) | Routing SPA client-side |
| Tailwind CSS | v4.1.3 | Estilos (bundle pre-compilado en `src/index.css`) |
| Motion | v11+ (`motion/react`) | Animaciones declarativas |
| Radix UI | Múltiples primitivas | Componentes accesibles headless |
| Lucide React | 0.487 | Iconografía SVG |
| Pigeon Maps | — | Mapas interactivos (OpenStreetMap) |
| Recharts | 2.15 | Gráficas/charts |
| Vitest | 4.0 + jsdom | Testing unitario |
| React Testing Library | 16.3 | Testing de componentes |

### No incluido actualmente

| Tecnología | Estado |
|------------|--------|
| **GSAP** | No instalado ni usado. Si se necesita, instalar `gsap` y registrar plugins. Ver sección 8 para guía de integración. |
| **react-hook-form** | En `package.json` pero **sin imports** en código. Los forms usan `useState` controlado. Disponible para uso futuro. |
| **Error boundaries** | No implementadas. Considerar agregar para producción. |

---

## 2. Arquitectura de archivos

```
src/
├── main.tsx                    # Entry point, BrowserRouter, auth URL snapshot
├── App.tsx                     # Shell raíz, rutas, providers, transiciones
├── index.css                   # Bundle Tailwind v4 compilado (NO editar tokens aquí)
├── styles/globals.css          # Fuente de tokens semánticos (NO importado en runtime)
├── context/
│   └── DataContext.ts          # Único contexto global de datos
├── hooks/
│   ├── useData.ts              # Wrapper de DataContext
│   ├── useSEO.ts               # Meta tags, OG, JSON-LD por ruta
│   └── useSupabaseQuery.ts     # Hook genérico async (disponible, no usado)
├── lib/supabase/               # Clientes, queries, cache, tipos (ver SUPABASE_SPECIALIST.md)
├── components/
│   ├── common/                 # LogoMap, PasswordField
│   └── layout/                 # NavBar, Footer
├── features/
│   ├── home/components/        # HeroSection, StatsSection, FeatureList, FeaturePreview, etc.
│   ├── agenda/components/      # EventsPage, ImpactDetailPage
│   ├── green-areas/components/ # GreenAreasPage, GreenAreaDetailPage
│   ├── participation/          # ParticipationPage (form + mapa)
│   ├── admin/components/       # AdminEventsPage, AdminAccountPage, IngresoPage, etc.
│   ├── gazettes/               # GazettesPage
│   ├── newsletters/            # NewslettersPage
│   ├── manifesto/              # ManifestoPage
│   ├── linktree/               # LinktreePage
│   ├── legal/                  # PrivacyPage
│   └── shared/components/      # EventLocationField (mapa + geocoding compartido)
├── data/
│   └── static.ts               # Datos estáticos de fallback
├── utils/
│   ├── auth/                   # authUrlSnapshot, authRedirect, adminPasswordSetup, eventsModerator
│   ├── supabase/info.tsx       # Project ID + anon key (autogenerado, NO editar)
│   └── helpers/                # Helpers de rutas, layout, transformación
└── test/                       # Tests Vitest + setup
```

### Convención de features

Cada feature sigue la estructura:

```
src/features/<nombre>/
├── index.ts                    # Barrel re-export
└── components/
    ├── index.ts                # Barrel de componentes
    ├── <Nombre>Page.tsx        # Componente de página principal
    └── <SubComponente>.tsx     # Componentes auxiliares (opcional)
```

**Excepción:** `home` no tiene `HomePage.tsx`. Sus secciones se componen directamente en `App.tsx` con `React.lazy`.

---

## 3. Routing y navegación

### Estructura de rutas (`App.tsx`)

```
/                   → MainApp (Home: HeroSection + secciones)
/inicio             → MainApp (Home)
/agenda             → MainApp (EventsPage)
/agenda/:id         → MainApp (ImpactDetailPage)
/areas-verdes       → MainApp (GreenAreasPage)
/areas-verdes/:id   → MainApp (GreenAreaDetailPage)
/boletines          → MainApp (NewslettersPage)
/gacetas            → MainApp (GazettesPage)
/participacion      → MainApp (ParticipationPage)
/manifiesto         → ManifestoPage (sin NavBar/Footer)
/links              → LinktreePage (sin NavBar/Footer)
/privacidad         → PrivacyPage (sin NavBar/Footer)
/ingreso            → IngresoPage (auth login)
/admin              → AdminEventsPage (requiere sesión)
/admin/cuenta       → AdminAccountPage
/admin/usuarios     → AdminModerationUsersPage
/admin/registro     → AdminRegisterPage
*                   → Navigate to /
```

### Patrones de navegación

- **Tabs ↔ Rutas:** `TAB_ROUTES` en `App.tsx` mapea IDs de tabs (`HOME`, `AGENDA`, `GREEN_AREAS`, `PARTICIPATION`) a paths.
- **`handleNavigate(tabId, id?)`**: Navega a la ruta del tab, opcionalmente con ID (detalle) o query params (`?event=`).
- **`pathToTab(pathname)`**: Resuelve qué tab está activo basado en el pathname.
- **Basename dinámico:** `/mapeo-verde` en GitHub Pages, `/` en local.

### Lazy loading

Componentes de página se cargan con `React.lazy` + `Suspense` con `PageLoader` (spinner animado con Motion).

```tsx
const EventsPage = React.lazy(() => import('./features/agenda/components/EventsPage'));
```

### Transiciones de ruta

`AnimatePresence mode="wait"` con `motion.div` keyed por `location.pathname`:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ type: "spring", damping: 25, stiffness: 200 }}
  >
    {renderContent()}
  </motion.div>
</AnimatePresence>
```

---

## 4. Estado y datos

### DataContext (fuente única de datos públicos)

```tsx
interface DataContextType {
  greenAreas: any[];
  projects: any[];
  gazettes: any[];
  events: any[];
  pastEvents: any[];
  refresh: () => Promise<void>;
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
  supabaseError: string | null;
}
```

**Uso en componentes:**

```tsx
import { useData } from '../hooks';
const { greenAreas, events, loading, error } = useData();
```

**Cadena de prioridad de datos:**
1. `documentos_json` (tabla Supabase normalizada)
2. Tablas relacionales Supabase
3. JSON legacy en Supabase
4. Archivos JSON en `/public/`
5. `src/data/static.ts` (último fallback)

**Polling:** La agenda se refresca cada 60s (`VITE_AGENDA_REFRESH_MS`). Se puede forzar refresh con el evento `mapeo-verde:events-updated`.

### Estado local

- **No hay estado global** más allá de `DataContext`.
- Cada componente maneja su estado con `useState`.
- Admin usa `getSupabaseAuthClient()` directamente, no `DataContext`.

---

## 5. Animaciones con Motion

### Import

Siempre importar desde `motion/react` (no `framer-motion`):

```tsx
import { motion, AnimatePresence } from 'motion/react';
```

### Patrones implementados

#### 5.1 Transiciones de página

```tsx
<AnimatePresence mode="wait">
  <motion.div key={pathname} initial={...} animate={...} exit={...}>
```

#### 5.2 Variants con stagger

```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  }}
>
  <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
```

**Usado en:** `HeroSection.tsx`, `LinktreePage.tsx`.

#### 5.3 Scroll-triggered (`whileInView`)

```tsx
<motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  whileInView={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.8, type: "spring" }}
>
```

**Usado en:** `StatCircle.tsx`.

#### 5.4 Gestos (`whileHover`, `whileTap`)

```tsx
<motion.button
  whileHover={{ scale: 1.05, backgroundColor: "#ff7e67", color: "#fff" }}
  whileTap={{ scale: 0.95 }}
>
```

**Usado en:** `HeroSection.tsx`, `LinktreePage.tsx`, `ManifestoPage.tsx`, `EventsPage.tsx`.

#### 5.5 Layout animations

```tsx
{activeTab === tab.id && (
  <motion.div layoutId="activeTabIcon" className="w-2 h-2 bg-black rounded-full" />
)}
```

**Usado en:** `NavBar.tsx` (indicador de tab activo).

```tsx
<motion.li key={event.id} layout className="space-y-0">
```

**Usado en:** `AdminEventsPage.tsx` (reordenamiento de lista).

#### 5.6 Expand/collapse

```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
    >
```

**Usado en:** `FeaturePreview.tsx`, `EventsPage.tsx` (acordeones).

#### 5.7 Sheets (bottom/side)

```tsx
<motion.div
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
>
```

**Usado en:** `EventsPage.tsx` (bottom sheet móvil, side sheet desktop).

### Convenciones de animación

| Propiedad | Valor típico |
|-----------|-------------|
| Tipo de transición | `type: "spring"` con `damping: 25, stiffness: 200` |
| Duración fade | `duration: 0.3` a `0.5` |
| Stagger | `staggerChildren: 0.1` a `0.2` |
| Easing CSS | `ease-in-out` (Tailwind `transition-*`) |

---

## 6. Tailwind CSS

### Configuración

- **Tailwind v4.1.3** — bundle pre-compilado en `src/index.css` (no hay `tailwind.config.*` ni PostCSS).
- Solo las utilidades presentes en el bundle están disponibles.
- Tokens semánticos en `src/styles/globals.css` (referencia, no importado en runtime).
- Path alias: `@` → `src/` (configurado en `vite.config.ts`).

### Estilo visual: Neo-brutalista

Ver `DESIGN_SYSTEM.md` para referencia completa. Resumen rápido:

| Patrón | Implementación |
|--------|---------------|
| **Marco negro** | `border-2 border-black` |
| **Sombra dura** | `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` |
| **Pressed** | `active:translate-y-1 active:shadow-none` |
| **Pill CTA** | `rounded-full bg-[#b4ff6f] font-mono uppercase tracking-widest` |
| **Label editorial** | `font-mono text-xs uppercase tracking-widest` |
| **Canvas** | `bg-[#f3f4f0]` |
| **Selection** | `selection:bg-[#b4ff6f] selection:text-black` |

### Colores de sección (NavBar)

```tsx
const tabs = [
  { id: 'HOME',          color: 'bg-[#b4ff6f]' },  // Verde lima
  { id: 'AGENDA',        color: 'bg-[#ff7e67]' },  // Coral
  { id: 'GREEN_AREAS',   color: 'bg-[#fccb4e]' },  // Amarillo
  { id: 'PARTICIPATION', color: 'bg-[#d89dff]' },  // Púrpura
];
// Gacetas usa #9dcdff (azul claro)
```

### Responsive

- **Mobile-first**: clases base son para móvil, override con `sm:`, `md:`, `lg:`.
- **Breakpoint principal:** `md:` (768px) para layout cambios (ej: `flex-col md:flex-row`).
- **NavBar:** `md:hidden` para versión móvil, desktop es sticky con tabs visibles.
- **JS responsive:** `window.innerWidth < 768` en scroll handlers (alineado con `md:`).

### Utilidades personalizadas en `index.css`

| Clase | Uso |
|-------|-----|
| `.scrollbar-hide` | Ocultar scrollbar cross-browser |
| `.admin-account-*` | Fixes de layout para admin (utilidades faltantes en bundle) |

---

## 7. HTML semántico y accesibilidad

### Elementos semánticos usados

| Elemento | Dónde |
|----------|-------|
| `<main>` | `App.tsx` (contenido ruteado), páginas admin |
| `<nav>` | `NavBar.tsx` (móvil + desktop) |
| `<header>` | `HeroSection`, páginas admin, `PrivacyPage` |
| `<footer>` | `Footer.tsx` |
| `<section>` | Secciones de home, subsecciones de forms |
| `<article>` | `PrivacyPage` (prosa legal) |

### No usados (oportunidad de mejora)

`<aside>`, `<figure>`, `<figcaption>`, `<dialog>` nativo, `<details>`, `<summary>`.

### Patrones de accesibilidad

#### ARIA

```tsx
// NavBar
<nav aria-label="Navegación principal">
<button aria-expanded={isMenuOpen} aria-label="Abrir menú">
<a aria-current={isActive ? 'page' : undefined}>

// PasswordField
<input aria-invalid={!!error}>
<button aria-label="Mostrar contraseña" aria-pressed={showPassword}>
<p role="alert">{error}</p>

// EventsPage calendar
<div role="button" tabIndex={0} onKeyDown={handleKeyboard}>
```

#### Focus management

- `focus:outline-none focus:ring-2 focus:ring-[color]` en elementos interactivos.
- `focus-visible` en forms admin (`OrganizationProfileForm`).
- `sr-only` para headings visuales reemplazados por logos.

#### Keyboard

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
}}
```

**Usado en:** `EventsPage` calendar cells.

#### Radix UI

Solo `@radix-ui/react-popover` está en uso runtime actualmente (calendario en `EventsPage`). Las demás primitivas están instaladas pero no importadas. Usar Radix para nuevos componentes que necesiten accesibilidad built-in (dialogs, menus, tooltips, etc.).

### Imágenes

- `<img>` estándar con `alt` descriptivo.
- `onError` handler para ocultar imágenes rotas.
- **No hay** lazy loading (`loading="lazy"`), `srcSet`, ni `<picture>`.
- Considerar agregar `loading="lazy"` a imágenes below-the-fold.

---

## 8. Guía para integrar GSAP

GSAP no está instalado actualmente. Si se necesita para animaciones complejas (ScrollTrigger, timelines, SVG morph, etc.):

### Instalación

```bash
npm install gsap
```

### Patrón de uso con React

```tsx
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MyComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(elementRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <div ref={elementRef}>Contenido animado</div>
    </div>
  );
};
```

### Convenciones a seguir

1. **Siempre usar `gsap.context()`** y `ctx.revert()` en cleanup del `useEffect` para evitar memory leaks.
2. **Registrar plugins** fuera del componente (nivel de módulo).
3. **No mezclar** GSAP y Motion en el mismo elemento — elegir uno por componente.
4. **Usar GSAP para:** ScrollTrigger complejo, timelines coordinadas, SVG morph, animaciones de texto (SplitText), physics.
5. **Seguir usando Motion para:** transiciones de página, `AnimatePresence`, layout animations, gestos simples.

---

## 9. SEO (`useSEO`)

Hook que actualiza `document.title`, meta tags, Open Graph, Twitter Cards, canonical y JSON-LD.

### Uso

```tsx
// Automático por ruta (usa mapa interno seoByRoute)
useSEO();

// Con override
useSEO({
  title: 'Mi Título Custom',
  description: 'Descripción custom',
  image: 'https://example.com/image.jpg',
});
```

### Agregar SEO para nueva ruta

En `src/hooks/useSEO.ts`, agregar entrada en `seoByRoute`:

```tsx
'/nueva-ruta': {
  title: 'Título - Mapeo Verde',
  description: 'Descripción para motores de búsqueda.',
  keywords: 'palabras, clave, relevantes',
  type: 'website'
},
```

---

## 10. Testing

### Herramientas

- **Vitest** con jsdom environment.
- **React Testing Library** para rendering.
- **axe-core** para tests de accesibilidad.

### Ejecutar

```bash
npm run test          # Correr una vez
npm run test:watch    # Watch mode
npm run test:a11y     # Solo test de accesibilidad
```

### Patrones de mock

```tsx
// Mock Supabase
vi.mock('../lib/supabase/client', () => ({
  getSupabaseClient: () => mockClient,
  getSupabaseAuthClient: () => mockClient,
}));

// Mock IntersectionObserver (en setup.ts)
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
```

### Test de accesibilidad

```tsx
import axe from 'axe-core';

const results = await axe.run(container);
expect(results.violations).toEqual([]);
```

---

## 11. Convenciones de código

### Al crear un nuevo componente de página

1. Crear en `src/features/<nombre>/components/<Nombre>Page.tsx`.
2. Exportar desde barrel `index.ts`.
3. Agregar ruta en `App.tsx` (dentro de `MainApp` si necesita NavBar/Footer, standalone si no).
4. Si es tab de navegación, agregar a `TAB_ROUTES` y `pathToTab` en `App.tsx`, y a `tabs` en `NavBar.tsx` con su color de sección.
5. Agregar SEO en `useSEO.ts` → `seoByRoute`.
6. Usar `React.lazy` para code splitting.

### Al crear un componente reutilizable

1. Si es UI genérico → `src/components/common/`.
2. Si es específico de un feature pero compartido → `src/features/shared/components/`.
3. Si es layout → `src/components/layout/`.
4. Exportar desde el barrel `index.ts` correspondiente.

### Estilo

- Clases Tailwind inline (no CSS modules, no styled-components).
- **No usar `cn()`** (no está implementado, aunque `clsx` y `tailwind-merge` están disponibles).
- Respetar la paleta de colores de marca (ver `DESIGN_SYSTEM.md`).
- Mantener el estilo neo-brutalista: marcos negros, sombras duras, tipografía mono para structure.

### Animaciones

- Preferir `motion/react` para la mayoría de animaciones.
- Usar `AnimatePresence` para montar/desmontar.
- Usar `whileInView` para animaciones scroll-triggered simples.
- Considerar GSAP solo para animaciones complejas no cubiertas por Motion.

### Forms

- Los forms actuales usan `useState` controlado.
- Si se adopta `react-hook-form`, mantener consistencia en todo el form (no mezclar controlled + uncontrolled).

### Datos

- Datos públicos: siempre desde `useData()` (DataContext).
- Datos admin: directamente desde `getSupabaseAuthClient()` + funciones de `queries.ts`.
- Nunca hacer queries Supabase directas en componentes públicos.
