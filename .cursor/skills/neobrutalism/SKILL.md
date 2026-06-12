---
name: neobrutalism-mapeo-verde
description: >-
  Neobrutalismo (sombras duras, bordes fuertes, superficies planas) aplicado al proyecto Mapeo Verde:
  solo tokens de color en src/index.css, consistencia en inicio/agenda/áreas verdes/participación,
  sin paleta por defecto de TypeUI ni hex arbitrarios nuevos.
license: MIT
metadata:
  author: typeui.sh
  project: Mapeo Verde
---

# Mapeo Verde — overrides obligatorios (leer primero)

Estas reglas **tienen prioridad** sobre la plantilla TypeUI y sobre la sección «Style Foundations» más abajo.

## Override de color / tokens

| Evitar | Usar |
|--------|------|
| Hex de la plantilla TypeUI (`#FDC800`, `#432DD7`, `#FBFBF9`, `#1C293C`, …) | Utilidades semánticas Tailwind del tema: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-muted`, `text-muted-foreground`, `bg-destructive`, `text-destructive-foreground`, `border-border`, `ring-ring`, y tokens *sidebar* si aplican. |
| Nuevos `bg-[#…]` o `text-gray-*` sueltos para “unificar” | Solo variables en `:root` / `.dark` en **`src/index.css`** (archivo de tokens que carga la app). Al editar un archivo existente, **preferir** migrar hardcode a tokens. |
| Negro puro `#000` en bordes si rompe contraste en tema oscuro | `border-foreground`, `border-border`, o sombras derivadas de tokens según contraste. |

- **Sí** aplicar lo neobrutalista en **forma**: sombras duras sin blur, bordes gruesos, superficies planas sin degradados, estados hover / focus-visible / active / disabled explícitos.
- **No** introducir una segunda paleta; el **primary** del proyecto es oscuro (`#030213` en claro) — en botones primarios usar siempre `text-primary-foreground` y validar contraste WCAG.

## Ámbito Mapeo Verde (superficies públicas)

| Ruta(s) | Componentes principales |
|---------|---------------------------|
| `/`, `/inicio` | `src/features/home/` (Hero, texto, stats, FeatureList, Cta, FeaturePreview en desktop) |
| `/agenda`, `/agenda/:id` | `EventsPage`, `ImpactDetailPage` |
| `/areas-verdes`, `/areas-verdes/:id` | `GreenAreasPage`, `GreenAreaDetailPage` |
| `/participacion` | `ParticipationPage` |

Objetivo: misma **familia** de interacción (CTA, espaciado, tipografía) sin cambiar copy ni jerarquía ya acordada.

## Consistencia (botones, tipo, espaciado)

- **CTA públicos**: reutilizar el *patrón* de interacción de `src/utils/adminButtonClasses.ts` (transición, sombra tipo sello, lift en hover) pero **colores** vía tokens; no copiar `#ff7e67` como obligatorio en superficie pública salvo que ya exista en ese bloque.
- **Tipografía**: prioridad a escalas Tailwind del proyecto (`text-sm`, `text-base`, `font-medium`, …). La escala 13/15/17… de TypeUI es **referencia secundaria**.
- **Espaciado**: múltiplos coherentes con Tailwind (`gap-4`, `p-6`, …), evitar `px-[17px]` salvo caso extremo.
- **Shell**: `App.tsx` puede seguir usando colores legacy hasta refactor; **no añadir** más arbitrarios en nuevos cambios.
- **Componentes**: antes de crear uno nuevo, componer con existentes; código muerto se limpia en tareas dedicadas.

## Accesibilidad (contraste con primary oscuro)

- Botones con `bg-primary` y `text-primary-foreground` deben mantener **contraste mínimo** legible; si el amarillo/lima de acento se usa como fondo, combinar con texto oscuro explícito según tokens.
- Focus visible: anillos `ring-ring` o `focus-visible:ring-*` coherentes con el peso de bordes neobrutalistas.

---

<!-- TYPEUI_SH_MANAGED_START -->
# neobrutalism Design System Skill (Universal)

## Mission
You are an expert design-system guideline author for neobrutalism design.
Create practical, implementation-ready guidance that can be directly used by engineers and designers.

## Brand


## Style Foundations
- Visual style: modern, clean, high-contrast
- Typography scale: 13/15/17/21/27/35 | Fonts: primary=Inter, display=Inter, mono=JetBrains Mono | weights=100, 200, 300, 400, 500, 600, 700, 800, 900
- **Note (Mapeo Verde):** Ignore default hex tokens below for this repo; use semantic tokens from `src/index.css` as described in the overrides section above.
- Color palette (TypeUI reference only): primary=#FDC800, secondary=#432DD7, success=#16A34A, warning=#D97706, danger=#DC2626, surface=#FBFBF9, text=#1C293C
- Spacing scale: 4/8/12/16/24/32

## Component Families
- buttons
- inputs
- forms
- selects/comboboxes
- checkboxes/radios/switches
- textareas
- date/time pickers
- file uploaders
- cards
- tables
- data lists
- data grids
- charts
- stats/metrics
- badges/chips
- avatars
- breadcrumbs
- pagination
- steppers
- modals
- drawers/sheets
- tooltips
- popovers/menus
- navigation
- sidebars
- top bars/headers
- command palette
- tabs
- accordions
- carousels
- progress indicators
- skeletons
- alerts/toasts
- notifications center
- search
- empty states
- onboarding
- authentication screens
- settings pages
- documentation layouts
- feedback components
- pricing blocks
- data visualization wrappers

## Accessibility
WCAG 2.2 AA, keyboard-first interactions, visible focus states

## Writing Tone
concise, confident, helpful

## Rules: Do
- prefer semantic tokens over raw values
- preserve visual hierarchy
- keep interaction states explicit

## Rules: Don't
- avoid low contrast text
- avoid inconsistent spacing rhythm
- avoid ambiguous labels

## Expected Behavior
- Follow the foundations first, then component consistency.
- When uncertain, prioritize accessibility and clarity over novelty.
- Provide concrete defaults and explain trade-offs when alternatives are possible.
- Keep guidance opinionated, concise, and implementation-focused.

## Guideline Authoring Workflow
1. Restate the design intent in one sentence before proposing rules.
2. Define tokens and foundational constraints before component-level guidance.
3. Specify component anatomy, states, variants, and interaction behavior.
4. Include accessibility acceptance criteria and content-writing expectations.
5. Add anti-patterns and migration notes for existing inconsistent UI.
6. End with a QA checklist that can be executed in code review.

## Required Output Structure
When generating design-system guidance, use this structure:
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Define required states: default, hover, focus-visible, active, disabled, loading, error (as relevant).
- Describe interaction behavior for keyboard, pointer, and touch.
- State spacing, typography, and color-token usage explicitly.
- Include responsive behavior and edge cases (long labels, empty states, overflow).

## Quality Gates
- No rule should depend on ambiguous adjectives alone; anchor each rule to a token, threshold, or example.
- Every accessibility statement must be testable in implementation.
- Prefer system consistency over one-off local optimizations.
- Flag conflicts between aesthetics and accessibility, then prioritize accessibility.

## Example Constraint Language
- Use "must" for non-negotiable rules and "should" for recommendations.
- Pair every do-rule with at least one concrete don't-example.
- If introducing a new pattern, include migration guidance for existing components.

<!-- TYPEUI_SH_MANAGED_END -->
