/**
 * Saneo de las filas hijas de un boletin (`proyectos_ingresados` y
 * `boletines_resolutivos`).
 *
 * La ingesta de los PDF no es idempotente: al re-procesar un boletin inserta filas
 * repetidas, y cuando el PDF no trae la seccion de resolutivos inserta filas de
 * relleno con todas las columnas en NULL o con el placeholder literal "X" que usa
 * el PDF como marcador de posicion. Como esas tablas solo tienen PK + FK, los
 * duplicados se acumulan y PostgREST los devuelve tal cual, asi que el generador de
 * correos y el dashboard los renderizan todos.
 *
 * Esto es la contraparte en cliente de scripts/cleanup-boletines-dup.sql. El script
 * limpia lo que ya esta en la BD; estas funciones protegen la UI cuando una ingesta
 * futura vuelva a traer datos sucios.
 */

/** Valores que el PDF usa como relleno y que no son informacion real. */
const PLACEHOLDERS = new Set(['X', 'N/A', 'NA', '-', '--', 'S/N', 'SIN DATO']);

/** Campos que describen un proyecto de ingreso. */
export const PROYECTO_FIELDS = [
  'numero',
  'tipo_estudio',
  'promovente',
  'nombre_proyecto',
  'naturaleza_proyecto',
  'giro',
  'municipio',
  'expediente',
  'fecha_ingreso',
  'coordenadas_x',
  'coordenadas_y',
] as const;

/** Campos que describen un resolutivo. */
export const RESOLUTIVO_FIELDS = [
  'tipo_estudio',
  'promovente',
  'nombre_proyecto',
  'naturaleza_proyecto',
  'giro',
  'municipio',
  'expediente',
  'no_oficio_resolutivo',
  'fecha_ingreso',
  'fecha_resolutivo',
  'extraordinario',
] as const;

type Row = Record<string, unknown>;

function text(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/** Sin acentos, sin signos y en mayusculas: "MULTI VI" y "MULTIVIA" colapsan igual. */
function squash(value: unknown): string {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function isPlaceholder(value: unknown): boolean {
  const raw = text(value);
  if (!raw) return true;
  return PLACEHOLDERS.has(raw.toUpperCase());
}

/**
 * Una fila es relleno cuando ninguno de sus campos de contenido tiene un valor real.
 * No confundir con "tiene el expediente vacio": un proyecto sin expediente es valido.
 */
export function isPlaceholderRow(row: Row, fields: readonly string[]): boolean {
  return fields.every((field) => isPlaceholder(row[field]));
}

/** Huella de contenido: identifica filas que son el mismo registro. */
function signature(row: Row, fields: readonly string[]): string {
  return fields.map((field) => text(row[field]).toUpperCase()).join('|');
}

/**
 * Clave de proyecto: expediente + nombre normalizado.
 *
 * Ojo: el expediente SOLO no sirve como clave. Hay boletines donde dos proyectos
 * distintos comparten expediente (en el 201747, "RESORTES MONTICELLO" y "VITECHMEX"
 * los dos con SMAE-DIRA-1650-17), asi que agregar el nombre normalizado es lo que
 * evita borrarlos. El nombre es ademas lo que captura el ruido de OCR, como
 * "CONSTRUCCIÓN" contra "CONSTRUCCIÓN".
 */
function projectKey(row: Row): string | null {
  const expediente = text(row.expediente);
  if (!expediente) return null;
  return `${expediente.toUpperCase()}|${squash(row.nombre_proyecto)}`;
}

export interface SanitizeOptions {
  /** Campos que componen la huella de contenido. */
  fields: readonly string[];
  /**
   * Deduplicar tambien por expediente + nombre normalizado, para proyectos que solo
   * difieren por ruido de OCR. Apagado por defecto en resolutivos, donde el
   * expediente si es unico por boletin.
   */
  collapseOcrVariants?: boolean;
}

/**
 * Descarta filas de relleno y filas repetidas dentro de un mismo boletin,
 * conservando la primera aparicion (la del id mas bajo, o sea la primera ingesta).
 */
export function sanitizeBoletinRows<T extends Row>(
  rows: T[] | null | undefined,
  { fields, collapseOcrVariants = false }: SanitizeOptions,
): T[] {
  if (!rows || rows.length === 0) return [];

  const seenSignatures = new Set<string>();
  const seenProjects = new Set<string>();
  const result: T[] = [];

  for (const row of rows) {
    if (isPlaceholderRow(row, fields)) continue;

    const sig = signature(row, fields);
    if (seenSignatures.has(sig)) continue;

    if (collapseOcrVariants) {
      const key = projectKey(row);
      if (key) {
        if (seenProjects.has(key)) continue;
        seenProjects.add(key);
      }
    }

    seenSignatures.add(sig);
    result.push(row);
  }

  return result;
}

/** Como {@link sanitizeBoletinRows}, pero para `proyectos_ingresados`. */
export function sanitizeProyectos<T extends Row>(rows: T[] | null | undefined): T[] {
  return sanitizeBoletinRows(rows, {
    fields: PROYECTO_FIELDS,
    collapseOcrVariants: true,
  });
}

/** Como {@link sanitizeBoletinRows}, pero para `boletines_resolutivos`. */
export function sanitizeResolutivos<T extends Row>(rows: T[] | null | undefined): T[] {
  return sanitizeBoletinRows(rows, { fields: RESOLUTIVO_FIELDS });
}

/** Cuantas filas se descartaron, para poder avisarle al usuario. */
export function countDiscarded<T extends Row>(raw: T[] | null | undefined, clean: T[]): number {
  return (raw?.length ?? 0) - clean.length;
}
