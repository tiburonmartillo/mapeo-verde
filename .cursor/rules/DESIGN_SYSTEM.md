# Sistema de Diseño — Mapeo Verde

Referencia de tokens, patrones y componentes extraídos del código fuente. El estilo visual es **neo-brutalista / editorial**: marcos negros de 1-2 px, sombras duras con offset, tipografía mixta (mono para estructura, serif para lectura, sans como base) y una paleta reducida de colores sólidos.

---

## 1. Paleta de colores

### 1.1 Colores de marca (hex fijos)

Cada sección de la app tiene un color asignado. Se usan directamente como clases Tailwind arbitrarias.

| Token | Hex | Rol | Uso en Tailwind |
|-------|-----|-----|-----------------|
| **Verde lima** | `#b4ff6f` | Color primario de marca. Inicio, CTAs, `::selection`, tags | `bg-[#b4ff6f]` `hover:bg-[#b4ff6f]` |
| **Coral** | `#ff7e67` | Sección Agenda | `bg-[#ff7e67]` `hover:bg-[#ff7e67]` |
| **Amarillo** | `#fccb4e` | Sección Áreas Verdes, filtros, acentos | `bg-[#fccb4e]` `hover:bg-[#fccb4e]` |
| **Púrpura** | `#d89dff` | Sección Participación, focus en admin | `bg-[#d89dff]` `hover:bg-[#d89dff]` |
| **Azul claro** | `#9dcdff` | Sección Gacetas, toggles | `bg-[#9dcdff]` |
| **Off-white** | `#f3f4f0` | Fondo de página / canvas | `bg-[#f3f4f0]` |
| **Negro** | `#0a0a0a` | Texto principal, marcos | `text-[#0a0a0a]` `border-black` |
| **WhatsApp verde** | `#25D366` | Botón de compartir WhatsApp | `bg-[#25D366]` |

### 1.2 Logo SVG

El logo "Mapeo Verde" usa dos colores fijos:
- **`#242424`** — texto/letras "MAPEO"
- **`#7FB800`** — texto/letras "VERDE"

### 1.3 Tokens semánticos (CSS custom properties)

Definidos en `src/styles/globals.css` y `src/index.css` (esquema shadcn/ui). Soportan modo claro y oscuro (`.dark`).

#### Modo claro (`:root`)

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `--background` | `#ffffff` | Fondo base |
| `--foreground` | `oklch(0.145 0 0)` | Texto base (~negro) |
| `--primary` | `#030213` | Color primario (casi negro) |
| `--primary-foreground` | `oklch(1 0 0)` | Texto sobre primario (blanco) |
| `--secondary` | `oklch(0.95 0.0058 264.53)` | Secundario (gris azulado claro) |
| `--secondary-foreground` | `#030213` | Texto sobre secundario |
| `--muted` | `#ececf0` | Superficies atenuadas |
| `--muted-foreground` | `#717182` | Texto atenuado |
| `--accent` | `#e9ebef` | Acento (gris claro) |
| `--accent-foreground` | `#030213` | Texto sobre acento |
| `--destructive` | `#d4183d` | Rojo destructivo |
| `--destructive-foreground` | `#ffffff` | Texto sobre destructivo |
| `--border` | `rgba(0, 0, 0, 0.1)` | Bordes sutiles |
| `--input-background` | `#f3f3f5` | Fondo de inputs |
| `--switch-background` | `#cbced4` | Fondo de switches |
| `--ring` | `oklch(0.708 0 0)` | Anillo de focus |
| `--radius` | `0.625rem` (10px) | Radio base |
| `--card` | `#ffffff` | Fondo de tarjetas |
| `--popover` | `oklch(1 0 0)` | Fondo de popovers |

#### Charts

| Variable | Valor |
|----------|-------|
| `--chart-1` | `oklch(0.646 0.222 41.116)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` |

### 1.4 Neutrales (Tailwind)

Se usa predominantemente la escala `gray-*` de Tailwind (50–900) para superficies, bordes y texto secundario. `zinc-*` aparece ocasionalmente en secciones oscuras.

### 1.5 Estados / feedback

| Estado | Color | Ejemplo |
|--------|-------|---------|
| Error / alerta | `red-400` a `red-600`, fondo `#fff0f0` | Paneles de error con `border-red-500` |
| Conexión pendiente | `amber-500` | Indicador en footer |
| Óptimo / OK | `green-600` | Badges de estado en inventario |

---

## 2. Tipografía

### 2.1 Familias tipográficas

| Token Tailwind | Stack | Uso |
|----------------|-------|-----|
| `font-sans` | `ui-sans-serif, system-ui, sans-serif, Apple Color Emoji…` | Familia por defecto (`<body>`) |
| `font-mono` | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas…` | Labels de navegación, badges, tablas, microcopy uppercase |
| `font-serif` | `ui-serif, Georgia, Cambria, Times New Roman…` | Texto largo: footer, hero subtitle, descripciones de áreas verdes |

**Patrón clave:** La combinación `font-mono uppercase tracking-widest` es la firma tipográfica del estilo editorial/brutalista. Se usa en nav tabs, encabezados de secciones, y etiquetas.

### 2.2 Escala de tamaños

| Clase | Uso típico |
|-------|------------|
| `text-[9px]` / `text-[10px]` | Labels mínimos en tablas y metadata |
| `text-xs` | Badges, etiquetas pequeñas |
| `text-sm` | Texto secundario, descripciones cortas |
| `text-base` | Cuerpo de texto, botones, inputs |
| `text-lg` / `text-xl` | Subtítulos de sección |
| `text-2xl` / `text-3xl` | Títulos de sección |
| `text-4xl` a `text-6xl` | Títulos hero (responsive) |
| `text-8xl` | Display máximo en hero / manifiesto (breakpoints grandes) |

### 2.3 Pesos

| Clase | Uso |
|-------|-----|
| `font-light` | Inputs de admin, texto sutil |
| `font-normal` (`400`) | Cuerpo de texto |
| `font-medium` (`500`) | Labels, botones, headings base |
| `font-bold` | Énfasis, subtítulos |
| `font-black` | Títulos display, hero headings |

### 2.4 Tracking y leading

| Clase | Uso |
|-------|-----|
| `tracking-widest` | Nav tabs, badges mono, uppercase labels |
| `tracking-wider` | Subtítulos editoriales |
| `tracking-tighter` | Títulos display grandes |
| `leading-tight` | Headings compactos |
| `leading-relaxed` | Texto de lectura largo |

---

## 3. Espaciado

### 3.1 Base

El spacing de Tailwind v4 usa `--spacing: 0.25rem` (4px) como unidad base.

### 3.2 Patrones frecuentes

| Contexto | Clases comunes |
|----------|---------------|
| Padding de sección | `p-4`, `p-6`, `p-8`, responsive `md:p-12` |
| Padding horizontal | `px-4`, `sm:px-6` |
| Padding vertical (marketing) | `py-14`, `py-16`, `py-32` |
| Gaps en flex/grid | `gap-2`, `gap-3`, `gap-4` |
| Spacing vertical (stacks) | `space-y-2`, `space-y-4`, `space-y-6` |

---

## 4. Bordes y radios

### 4.1 Bordes (firma visual)

Los **marcos negros sólidos** son la firma visual del diseño neo-brutalista:

| Patrón | Clase | Uso |
|--------|-------|-----|
| Borde inferior | `border-b border-black` | Separadores de sección |
| Marco completo | `border-2 border-black` | Tarjetas, contenedores principales |
| Divisores | `divide-black` | Grids y listas |

### 4.2 Radios

| Token | Valor | Clase Tailwind |
|-------|-------|---------------|
| `--radius` (base) | `0.625rem` (10px) | `rounded-lg` |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 14px | `rounded-xl` |
| `--radius-md` | `calc(var(--radius) - 2px)` = 8px | `rounded-md` |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 6px | `rounded-sm` |

**Uso predominante:**

| Clase | Uso |
|-------|-----|
| `rounded-full` | CTAs tipo pill, botones de nav, spinners, chips KPI |
| `rounded-sm` / `rounded-md` | Admin, formularios, controles |
| Sin redondeo | Muchas superficies se mantienen cuadradas para reforzar el estilo brutalist |

---

## 5. Sombras

### 5.1 Sombra dura (firma del diseño)

La sombra principal es un **offset sólido sin difuminado**, simulando un efecto de "sello":

```
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]    /* estándar */
shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]    /* más pronunciada */
```

Variantes con color de marca:
```
shadow-[4px_4px_0px_0px_#fccb4e]   /* amarillo */
shadow-[4px_4px_0px_0px_#b4ff6f]   /* verde lima */
```

### 5.2 Interacción: efecto "pressed"

```
active:translate-y-1 active:shadow-none
```

Simula el botón hundiéndose al hacer clic, eliminando la sombra y desplazando el elemento.

### 5.3 Sombras estándar Tailwind

| Clase | Uso |
|-------|-----|
| `shadow-sm` | Barras sticky, elevación sutil |
| `shadow-lg` | Spinner/loader del App.tsx |
| `shadow-2xl` | Overlay del menú móvil |

---

## 6. Animaciones y transiciones

### 6.1 Motion (Framer Motion)

Se importa desde `motion/react`. Patrones principales:

| Componente | Uso |
|------------|-----|
| `AnimatePresence` | Transiciones de ruta (App.tsx), menú móvil, listas |
| `motion.div` | Fade-in/out de secciones, slide de menú |
| `layoutId` | Dot animado en tab activo del NavBar |
| `layout` | Animación de reordenamiento en listas de eventos |

### 6.2 Transiciones CSS (Tailwind)

| Clase | Uso |
|-------|-----|
| `transition-colors duration-200` | Hover en botones y enlaces |
| `transition-all duration-300` | Transformaciones complejas |
| `ease-in-out` | Easing por defecto |
| `transition-[top]` | Headers sticky scroll-linked |

### 6.3 Keyframes

| Animación | Uso |
|-----------|-----|
| `animate-spin` | Loaders / spinners |
| `animate-pulse` | Skeleton loading states |
| `@keyframes enter` | Animaciones de entrada (utilidades `animate-in`) |

---

## 7. Componentes reutilizables

### 7.1 Layout

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `NavBar` | `src/components/layout/NavBar.tsx` | Header responsive: logo, tabs con colores de sección, menú hamburguesa móvil, oculto en scroll down |
| `Footer` | `src/components/layout/Footer.tsx` | Footer con branding, links de navegación/legales, indicador de conexión Supabase |

### 7.2 Common

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `LogoMap` | `src/components/common/LogoMap.tsx` | SVG wordmark "Mapeo Verde" reutilizable |
| `PasswordField` | `src/components/common/PasswordField.tsx` | Input de contraseña con toggle show/hide, label, error/helper text |

### 7.3 Iconos

Se usa **Lucide React** (`lucide-react`) en 18 archivos del proyecto. Importación típica:

```tsx
import { Menu, X, ChevronRight, Eye, EyeOff } from 'lucide-react';
```

### 7.4 Notas

- **No existe `src/components/ui/`** ni una librería de componentes UI centralizada (como shadcn/ui), aunque los tokens CSS siguen la convención shadcn.
- **No existe helper `cn()`** para merge de clases. Se usan clases Tailwind inline directamente.
- `clsx` y `tailwind-merge` están en `package.json` pero **no se importan** actualmente en el código.

---

## 8. Patrones visuales recurrentes

### 8.1 Tarjeta brutalista

```
border-2 border-black bg-white
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
active:translate-y-1 active:shadow-none
```

### 8.2 Botón CTA (pill)

```
rounded-full bg-[#b4ff6f] text-black font-mono uppercase tracking-widest
border-2 border-black
shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
hover:bg-[#b4ff6f]/80
active:translate-y-1 active:shadow-none
```

### 8.3 Label de sección

```
font-mono text-xs uppercase tracking-widest text-gray-600
```

### 8.4 Texto selection

```css
::selection {
  background: #b4ff6f;
  color: #000;
}
```

Aplicado en el shell raíz de la app:
```
selection:bg-[#b4ff6f] selection:text-black
```

### 8.5 Scrollbar personalizado

```css
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: #f3f4f0; }
::-webkit-scrollbar-thumb { background: #ccc; border-radius: 5px; }
::-webkit-scrollbar-thumb:hover { background: #999; }
```

---

## 9. Breakpoints

Se usan los breakpoints estándar de Tailwind v4:

| Prefijo | Ancho mínimo |
|---------|-------------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Patrón responsivo más común: diseño mobile-first con cambios principales en `md:` (768px).

---

## 10. Resumen de archivos clave

| Archivo | Contenido |
|---------|-----------|
| `src/index.css` | Bundle compilado de Tailwind v4: theme layer, base, utilities, tokens semánticos, scrollbar, keyframes |
| `src/styles/globals.css` | Fuente de tokens semánticos `:root` / `.dark`, bridge `@theme inline` a Tailwind, tipografía base. **No se importa en runtime** (los tokens están duplicados en `index.css`) |
| `src/components/layout/NavBar.tsx` | Define los colores de sección (tabs) como constantes |
| `src/App.tsx` | Shell raíz: `bg-[#f3f4f0]`, `font-sans`, `selection:bg-[#b4ff6f]` |
