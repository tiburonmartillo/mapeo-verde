/**
 * Clases compartidas para botones/enlaces del panel admin e ingreso:
 * transición clara, hover “vivo”, clic con feedback, foco y disabled.
 */

const transitionBase =
  'cursor-pointer motion-reduce:transition-none ' +
  'transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]';

export const adminPressableFocus =
  `${transitionBase} ` +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';

export const adminDisabled =
  'disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100';

/** Sombra tipo sello: hover con sombra coral (#ff7e67); clic vuelve a sombra negra compacta. */
export const adminLiftShadow =
  'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ' +
  'motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-[8px_8px_0px_0px_#ff7e67] ' +
  'motion-safe:active:translate-y-0.5 motion-safe:active:scale-[0.98] motion-safe:active:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ' +
  'motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ' +
  'motion-reduce:active:scale-100';

/** Botón secundario / fantasma (p. ej. cerrar sesión) */
export const adminGhostPressable =
  `${adminPressableFocus} ` +
  'motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.02] hover:border-gray-800 ' +
  'hover:shadow-[3px_3px_0px_0px_#ff7e67] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99] motion-safe:active:shadow-none ' +
  'motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none';

/** Pestañas o toggles con borde */
export const adminTabPressable =
  `${adminPressableFocus} ` +
  'motion-safe:hover:brightness-[1.04] motion-safe:hover:scale-[1.01] ' +
  'motion-safe:active:brightness-[0.97] motion-safe:active:scale-[0.99] ' +
  'motion-reduce:hover:scale-100';

/** Botón con borde (editar, cancelar, paginación) */
export const adminOutlinePressable =
  `${adminPressableFocus} ` +
  'motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] hover:shadow-[4px_4px_0px_0px_#ff7e67] ' +
  'motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] motion-safe:active:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.35)] ' +
  'motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:hover:shadow-none';

/**
 * Tamaño y ancho unificados para acciones principales en Mi cuenta (perfil de organización, nombre, contraseña).
 * El ancho responsive vive en `index.css` (`.admin-account-primary-btn`): el bundle Tailwind estático no incluye `lg:w-1/4` ni `min-h-[4.25rem]`.
 */
export const adminAccountPrimaryButtonLayout =
  'admin-account-primary-btn inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest border-2 border-black';

/**
 * Layout compartido del panel (/admin, /admin/cuenta, /admin/usuarios):
 * en vista estrecha la marca y las acciones se apilan; evita solapamientos y mejora el wrap.
 */
export const adminPageHeader =
  'border-b border-black bg-white px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between';

export const adminPageHeaderBrand =
  'flex min-w-0 items-center gap-3 sm:gap-4 flex-wrap';

export const adminPageHeaderActions =
  'flex w-full min-w-0 flex-wrap items-center justify-end gap-4 sm:gap-6 sm:w-auto sm:max-w-full';

export const adminPageHeaderUser =
  'flex min-w-0 max-w-full sm:max-w-[20rem] flex-col items-end gap-1.5 text-right';
