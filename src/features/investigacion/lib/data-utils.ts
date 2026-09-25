import type { BoletinesData, Proyecto, Resolutivo, Boletin } from './types';
import {
  calcularEstadoCumplimiento,
  obtenerAutoridad,
  obtenerColorEstado,
  type EstadoCumplimiento,
} from './boletines-v2-utils';
import { getCalendarParts } from './date-utils';

export interface BoletinFueraDeTiempo extends Boletin {
  dias_retraso: number;
  fecha_creacion_archivo: string | null;
}

export interface ProyectoConFaltantes {
  proyecto: Proyecto;
  faltantes: string[];
  boletin_fecha: string;
  boletin_url: string;
}

export interface FilterOptions {
  search?: string;
  municipioFilter?: string;
  tipoFilter?: string;
  yearFilter?: string;
  monthFilter?: string;
  activeTab?: string;
}

export function getStats(data: BoletinesData) {
  const totalBoletines = data.boletines.length;
  const totalProyectos = data.boletines.reduce((sum, b) => sum + b.cantidad_ingresados, 0);
  const totalResolutivos = data.boletines.reduce((sum, b) => sum + b.cantidad_resolutivos, 0);

  const municipios = new Set<string>();
  const giros = new Set<string>();
  const tiposEstudio = new Set<string>();

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.municipio) municipios.add(p.municipio);
      if (p.giro) giros.add(p.giro);
      if (p.tipo_estudio) tiposEstudio.add(p.tipo_estudio);
    });
  });

  return {
    totalBoletines,
    totalProyectos,
    totalResolutivos,
    municipios: Array.from(municipios).sort(),
    giros: Array.from(giros).sort(),
    tiposEstudio: Array.from(tiposEstudio).sort(),
  };
}

export function getTimeSeriesData(data: BoletinesData) {
  // Mapeo de números de mes a nombres en español
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const byMonth = data.boletines.reduce(
    (acc, boletin) => {
      // Extraer año y mes de fecha_publicacion
      if (!boletin.fecha_publicacion) {
        console.warn('Boletín sin fecha de publicación:', boletin);
        return acc;
      }

      const fecha = new Date(boletin.fecha_publicacion);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12

      // Validar que la fecha sea válida
      if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) {
        console.warn('Boletín con fecha inválida:', boletin.fecha_publicacion, boletin);
        return acc;
      }

      const key = `${año}-${String(mes).padStart(2, '0')}`;
      const fechaDisplay = `${año}-${meses[mes - 1]}`;

      if (!acc[key]) {
        acc[key] = {
          fecha: fechaDisplay,
          proyectos: 0,
          resolutivos: 0,
        };
      }
      acc[key].proyectos += boletin.cantidad_ingresados || 0;
      acc[key].resolutivos += boletin.cantidad_resolutivos || 0;
      return acc;
    },
    {} as Record<string, { fecha: string; proyectos: number; resolutivos: number }>,
  );

  const result = Object.values(byMonth).sort((a, b) => {
    // Extraer año y mes para ordenar correctamente
    const [añoA, mesA] = a.fecha.split('-');
    const [añoB, mesB] = b.fecha.split('-');
    const mesIndexA = meses.indexOf(mesA);
    const mesIndexB = meses.indexOf(mesB);

    if (añoA !== añoB) {
      return parseInt(añoA) - parseInt(añoB);
    }
    return mesIndexA - mesIndexB;
  });

  return result;
}

// Función para normalizar expedientes (manejar inconsistencias como "20" vs "2025")
export function normalizeExpediente(expediente: string | null | undefined): string {
  const normalized = typeof expediente === 'string' ? expediente.trim() : '';

  if (!normalized) {
    return '';
  }

  // Si el expediente termina en "-20", asumir que es "-2025"
  if (normalized.endsWith('-20')) {
    return normalized.replace('-20', '-2025');
  }

  return normalized;
}

export function getAllProyectos(
  data: BoletinesData,
): (Proyecto & { fecha_publicacion: string; boletin_url: string })[] {
  const proyectos = data.boletines.flatMap((boletin) =>
    (boletin.proyectos_ingresados || []).map((p) => ({
      ...p,
      expediente: normalizeExpediente(p.expediente), // Normalizar expediente
      fecha_publicacion: boletin.fecha_publicacion,
      boletin_url: boletin.url || boletin.filename,
    })),
  );

  const sortedProjects = proyectos.sort((a, b) => {
    const pubDiff =
      new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime();
    if (pubDiff !== 0) return pubDiff;
    return new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime();
  });

  // Agrupar por expediente y mantener el mejor (con coordenadas válidas, luego más reciente)
  const projectsByExpediente = new Map<string, (typeof sortedProjects)[0]>();

  for (const project of sortedProjects) {
    if (!project.expediente) {
      // Proyectos sin expediente: mantener todos (no se pueden deduplicar)
      continue;
    }

    const existing = projectsByExpediente.get(project.expediente);
    const hasValidCoords = (p: typeof project) =>
      p.coordenadas_x != null &&
      p.coordenadas_y != null &&
      Number.isFinite(p.coordenadas_x) &&
      Number.isFinite(p.coordenadas_y);

    if (!existing) {
      projectsByExpediente.set(project.expediente, project);
    } else if (hasValidCoords(project) && !hasValidCoords(existing)) {
      // Preferir el que tiene coordenadas válidas
      projectsByExpediente.set(project.expediente, project);
    }
    // Si ambos tienen o no tienen coordenadas, mantener el existente (más reciente por sort)
  }

  // Incluir proyectos sin expediente + deduplicados
  const withoutExpediente = sortedProjects.filter((p) => !p.expediente);
  const deduplicated = Array.from(projectsByExpediente.values());

  return [...withoutExpediente, ...deduplicated];
}

export function getAllResolutivos(data: BoletinesData): (Resolutivo & {
  fecha_publicacion: string;
  boletin_url: string;
  coordenadas_x: number | null;
  coordenadas_y: number | null;
  boletin_ingreso_url: string | null;
  boletin_ingreso_id: number | null;
  boletin_ingreso_fecha_publicacion: string | null;
})[] {
  // Primero obtener todos los proyectos con sus coordenadas
  const proyectosConCoordenadas = getAllProyectos(data);

  const resolutivosConCoordenadas = data.boletines.flatMap((boletin) =>
    (boletin.resolutivos_emitidos || []).map((r) => {
      // Normalizar expediente
      const expedienteNormalizado = normalizeExpediente(r.expediente);

      // Buscar el proyecto correspondiente por expediente normalizado
      let proyectoRelacionado = proyectosConCoordenadas.find(
        (p) => p.expediente === expedienteNormalizado,
      );

      // Si no se encuentra, intentar buscar con años diferentes (ej: 2024 vs 2025)
      if (!proyectoRelacionado) {
        const expedienteBase = expedienteNormalizado.replace(/-202[0-9]$/, '');
        proyectoRelacionado = proyectosConCoordenadas.find((p) => {
          const pExpedienteBase = normalizeExpediente(p.expediente).replace(/-202[0-9]$/, '');
          return pExpedienteBase === expedienteBase;
        });
      }

      const resolutivoConCoordenadas = {
        ...r,
        expediente: expedienteNormalizado, // Usar expediente normalizado
        fecha_publicacion: boletin.fecha_publicacion,
        boletin_url: boletin.url || boletin.filename,
        coordenadas_x: proyectoRelacionado?.coordenadas_x || r.coordenadas_x || null,
        coordenadas_y: proyectoRelacionado?.coordenadas_y || r.coordenadas_y || null,
        boletin_ingreso_url: proyectoRelacionado?.boletin_url || null,
        boletin_ingreso_id: proyectoRelacionado?.boletin_id ?? null,
        boletin_ingreso_fecha_publicacion: proyectoRelacionado?.fecha_publicacion ?? null,
      };

      return resolutivoConCoordenadas;
    }),
  );

  return resolutivosConCoordenadas;
}

export function getDistributionByMunicipio(data: BoletinesData) {
  const distribution: Record<string, number> = {};

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.municipio) {
        distribution[p.municipio] = (distribution[p.municipio] || 0) + 1;
      }
    });
  });

  return Object.entries(distribution)
    .map(([municipio, count]) => ({ municipio, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDistributionByGiro(data: BoletinesData) {
  const distribution: Record<string, number> = {};

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.giro) {
        distribution[p.giro] = (distribution[p.giro] || 0) + 1;
      }
    });
  });

  return Object.entries(distribution)
    .map(([giro, count]) => ({ giro, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Filtra boletines según los criterios especificados (V2)
 * @param boletines - Array de boletines a filtrar
 * @param filters - Objeto con los filtros a aplicar
 * @returns Array de boletines filtrados
 */
export function filterBoletinesV2(
  boletines: Boletin[],
  filters: {
    search?: string;
    año?: string;
    mes?: string;
    tipo?: string;
    autoridad?: string;
    municipio?: string;
    estadoCumplimiento?: string;
  },
): Boletin[] {
  return boletines.filter((boletin) => {
    // Filtro de búsqueda (busca en id, fecha, secretario, director)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        boletin.id.toString().includes(searchLower) ||
        boletin.fecha_publicacion?.toLowerCase().includes(searchLower) ||
        boletin.secretario?.toLowerCase().includes(searchLower) ||
        boletin.director?.toLowerCase().includes(searchLower) ||
        // Buscar en proyectos
        (boletin.proyectos_ingresados || []).some(
          (p) =>
            p.nombre_proyecto?.toLowerCase().includes(searchLower) ||
            p.expediente?.toLowerCase().includes(searchLower) ||
            p.municipio?.toLowerCase().includes(searchLower) ||
            p.promovente?.toLowerCase().includes(searchLower) ||
            p.giro?.toLowerCase().includes(searchLower) ||
            p.tipo_estudio?.toLowerCase().includes(searchLower),
        ) ||
        // Buscar en resolutivos
        (boletin.resolutivos_emitidos || []).some(
          (r) =>
            r.expediente?.toLowerCase().includes(searchLower) ||
            r.municipio?.toLowerCase().includes(searchLower) ||
            r.nombre_proyecto?.toLowerCase().includes(searchLower) ||
            r.promovente?.toLowerCase().includes(searchLower) ||
            r.giro?.toLowerCase().includes(searchLower) ||
            r.tipo_estudio?.toLowerCase().includes(searchLower),
        );

      if (!matchesSearch) return false;
    }

    // Filtro por año
    if (filters.año && filters.año !== 'all') {
      const añoBoletin = boletin.año || new Date(boletin.fecha_publicacion).getFullYear();
      if (añoBoletin.toString() !== filters.año) return false;
    }

    // Filtro por mes (número 1-12)
    if (filters.mes && filters.mes !== 'all') {
      const parts = getCalendarParts(boletin.fecha_publicacion);
      if (parts?.month !== filters.mes) return false;
    }

    // Filtro por tipo (tipo de estudio)
    if (filters.tipo && filters.tipo !== 'all') {
      const tieneTipo =
        (boletin.proyectos_ingresados || []).some((p) => p.tipo_estudio === filters.tipo) ||
        (boletin.resolutivos_emitidos || []).some((r) => r.tipo_estudio === filters.tipo);
      if (!tieneTipo) return false;
    }

    // Filtro por autoridad
    if (filters.autoridad && filters.autoridad !== 'all') {
      const autoridadBoletin = obtenerAutoridad(boletin);
      if (autoridadBoletin !== filters.autoridad) return false;
    }

    // Filtro por municipio
    if (filters.municipio && filters.municipio !== 'all') {
      const tieneMunicipio =
        (boletin.proyectos_ingresados || []).some((p) => p.municipio === filters.municipio) ||
        (boletin.resolutivos_emitidos || []).some((r) => r.municipio === filters.municipio);
      if (!tieneMunicipio) return false;
    }

    // Filtro por estado de cumplimiento
    if (filters.estadoCumplimiento && filters.estadoCumplimiento !== 'all') {
      const estado = calcularEstadoCumplimiento(boletin);
      if (estado !== filters.estadoCumplimiento) return false;
    }

    return true;
  });
}

/**
 * Filtra proyectos según las opciones de filtro
 */
export function filterProyectos(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  options: FilterOptions,
): (Proyecto & { fecha_publicacion: string; boletin_url: string })[] {
  return proyectos.filter((proyecto) => {
    // Filtro de búsqueda
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchesSearch =
        proyecto.nombre_proyecto?.toLowerCase().includes(searchLower) ||
        proyecto.expediente?.toLowerCase().includes(searchLower) ||
        proyecto.promovente?.toLowerCase().includes(searchLower) ||
        proyecto.municipio?.toLowerCase().includes(searchLower) ||
        proyecto.giro?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Filtro por municipio
    if (options.municipioFilter && options.municipioFilter !== 'all') {
      if (proyecto.municipio !== options.municipioFilter) return false;
    }

    // Filtro por tipo de estudio
    if (options.tipoFilter && options.tipoFilter !== 'all') {
      if (proyecto.tipo_estudio !== options.tipoFilter) return false;
    }

    // Filtro por año (publicación del boletín)
    if (options.yearFilter && options.yearFilter !== 'all') {
      const parts = getCalendarParts(proyecto.fecha_publicacion);
      if (parts?.year !== options.yearFilter) return false;
    }

    // Filtro por mes (publicación del boletín)
    if (options.monthFilter && options.monthFilter !== 'all') {
      const parts = getCalendarParts(proyecto.fecha_publicacion);
      if (parts?.month !== options.monthFilter) return false;
    }

    return true;
  });
}

/**
 * Filtra resolutivos según las opciones de filtro
 */
export function filterResolutivos(
  resolutivos: (Resolutivo & {
    fecha_publicacion: string;
    boletin_url: string;
    coordenadas_x: number | null;
    coordenadas_y: number | null;
    boletin_ingreso_url: string | null;
  })[],
  options: FilterOptions,
): (Resolutivo & {
  fecha_publicacion: string;
  boletin_url: string;
  coordenadas_x: number | null;
  coordenadas_y: number | null;
  boletin_ingreso_url: string | null;
})[] {
  return resolutivos.filter((resolutivo) => {
    // Filtro de búsqueda
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchesSearch =
        resolutivo.nombre_proyecto?.toLowerCase().includes(searchLower) ||
        resolutivo.expediente?.toLowerCase().includes(searchLower) ||
        resolutivo.promovente?.toLowerCase().includes(searchLower) ||
        resolutivo.municipio?.toLowerCase().includes(searchLower) ||
        resolutivo.giro?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Filtro por municipio
    if (options.municipioFilter && options.municipioFilter !== 'all') {
      if (resolutivo.municipio !== options.municipioFilter) return false;
    }

    // Filtro por tipo de estudio
    if (options.tipoFilter && options.tipoFilter !== 'all') {
      if (resolutivo.tipo_estudio !== options.tipoFilter) return false;
    }

    // Filtro por año (publicación del boletín)
    if (options.yearFilter && options.yearFilter !== 'all') {
      const parts = getCalendarParts(resolutivo.fecha_publicacion);
      if (parts?.year !== options.yearFilter) return false;
    }

    // Filtro por mes (publicación del boletín)
    if (options.monthFilter && options.monthFilter !== 'all') {
      const parts = getCalendarParts(resolutivo.fecha_publicacion);
      if (parts?.month !== options.monthFilter) return false;
    }

    return true;
  });
}

/**
 * Obtiene datos de series temporales filtrados
 */
export function getFilteredTimeSeriesData(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  resolutivos: (Resolutivo & {
    fecha_publicacion: string;
    boletin_url: string;
    coordenadas_x: number | null;
    coordenadas_y: number | null;
    boletin_ingreso_url: string | null;
  })[],
  options: FilterOptions,
) {
  const proyectosFiltrados = filterProyectos(proyectos, options);
  const resolutivosFiltrados = filterResolutivos(resolutivos, options);

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const byMonth: Record<string, { fecha: string; proyectos: number; resolutivos: number }> = {};

  // Procesar proyectos filtrados
  proyectosFiltrados.forEach((proyecto) => {
    if (!proyecto.fecha_publicacion) return;

    const fecha = new Date(proyecto.fecha_publicacion);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) return;

    const key = `${año}-${String(mes).padStart(2, '0')}`;
    const fechaDisplay = `${año}-${meses[mes - 1]}`;

    if (!byMonth[key]) {
      byMonth[key] = {
        fecha: fechaDisplay,
        proyectos: 0,
        resolutivos: 0,
      };
    }
    byMonth[key].proyectos += 1;
  });

  // Procesar resolutivos filtrados
  resolutivosFiltrados.forEach((resolutivo) => {
    if (!resolutivo.fecha_publicacion) return;

    const fecha = new Date(resolutivo.fecha_publicacion);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    if (isNaN(año) || isNaN(mes) || mes < 1 || mes > 12) return;

    const key = `${año}-${String(mes).padStart(2, '0')}`;
    const fechaDisplay = `${año}-${meses[mes - 1]}`;

    if (!byMonth[key]) {
      byMonth[key] = {
        fecha: fechaDisplay,
        proyectos: 0,
        resolutivos: 0,
      };
    }
    byMonth[key].resolutivos += 1;
  });

  return Object.values(byMonth).sort((a, b) => {
    const [añoA, mesA] = a.fecha.split('-');
    const [añoB, mesB] = b.fecha.split('-');
    const mesIndexA = meses.indexOf(mesA);
    const mesIndexB = meses.indexOf(mesB);

    if (añoA !== añoB) {
      return parseInt(añoA) - parseInt(añoB);
    }
    return mesIndexA - mesIndexB;
  });
}

/**
 * Obtiene estadísticas filtradas
 */
export function getFilteredStats(
  proyectos: (Proyecto & { fecha_publicacion: string; boletin_url: string })[],
  resolutivos: (Resolutivo & {
    fecha_publicacion: string;
    boletin_url: string;
    coordenadas_x: number | null;
    coordenadas_y: number | null;
    boletin_ingreso_url: string | null;
  })[],
  options: FilterOptions,
  totalBoletines: number,
) {
  const proyectosFiltrados = filterProyectos(proyectos, options);
  const resolutivosFiltrados = filterResolutivos(resolutivos, options);

  const municipios = new Set<string>();
  const giros = new Set<string>();
  const tiposEstudio = new Set<string>();

  proyectosFiltrados.forEach((p) => {
    if (p.municipio) municipios.add(p.municipio);
    if (p.giro) giros.add(p.giro);
    if (p.tipo_estudio) tiposEstudio.add(p.tipo_estudio);
  });

  resolutivosFiltrados.forEach((r) => {
    if (r.municipio) municipios.add(r.municipio);
    if (r.giro) giros.add(r.giro);
    if (r.tipo_estudio) tiposEstudio.add(r.tipo_estudio);
  });

  return {
    totalBoletines,
    totalProyectos: proyectosFiltrados.length,
    totalResolutivos: resolutivosFiltrados.length,
    municipios: Array.from(municipios).sort(),
    giros: Array.from(giros).sort(),
    tiposEstudio: Array.from(tiposEstudio).sort(),
  };
}

export function getDistributionByTipoEstudio(data: BoletinesData) {
  const distribution: Record<string, number> = {};

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      if (p.tipo_estudio) {
        distribution[p.tipo_estudio] = (distribution[p.tipo_estudio] || 0) + 1;
      }
    });
  });

  return Object.entries(distribution)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);
}

const ESTADO_LABELS: Record<EstadoCumplimiento, string> = {
  con_resolutivo: 'Con resolutivo',
  sin_resolutivo: 'Sin resolutivo',
  en_proceso: 'En proceso',
  desconocido: 'Estado desconocido',
};

export function getDistributionByEstado(data: BoletinesData) {
  const distribution: Record<EstadoCumplimiento, number> = {
    con_resolutivo: 0,
    sin_resolutivo: 0,
    en_proceso: 0,
    desconocido: 0,
  };

  data.boletines.forEach((boletin) => {
    const estado = calcularEstadoCumplimiento(boletin);
    distribution[estado] = (distribution[estado] || 0) + 1;
  });

  return (Object.keys(distribution) as EstadoCumplimiento[])
    .filter((estado) => distribution[estado] > 0)
    .map((estado) => ({
      estado,
      nombre: ESTADO_LABELS[estado],
      color: obtenerColorEstado(estado),
      count: distribution[estado],
    }))
    .sort((a, b) => b.count - a.count);
}

/** Diferencia en días calendario (b - a). Devuelve null si alguna fecha no es válida. */
export function diasEntreFechas(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null;
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (isNaN(ta) || isNaN(tb)) return null;
  return Math.floor((tb - ta) / 86400000);
}

/**
 * Diferencia en días calendario (b - a) usando solo el día AAAA-MM-DD, sin
 * verse afectada por la hora o zona horaria de los valores (b > a = positivo).
 */
export function diferenciaDiasCalendario(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  const ka = diaKey(a);
  const kb = diaKey(b);
  if (!ka || !kb) return null;
  const da = Date.UTC(Number(ka.slice(0, 4)), Number(ka.slice(5, 7)) - 1, Number(ka.slice(8, 10)));
  const db = Date.UTC(Number(kb.slice(0, 4)), Number(kb.slice(5, 7)) - 1, Number(kb.slice(8, 10)));
  return Math.round((db - da) / 86400000);
}

/** Clave calendario (AAAA-MM-DD) sin depender de la zona horaria del navegador. */
function diaKey(fecha: string | null | undefined): string | null {
  if (!fecha) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha));
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export interface BoletinConFechaInconsistente extends Boletin {
  fecha_creacion: string;
  fuente_creacion: 'pdf' | 'bd';
  dif_dias: number;
}

/**
 * Boletines donde la fecha de creación (metadatos del PDF, o created_at si
 * faltan) es un día calendario distinto a su fecha de publicación. dif_dias
 * positivo = el archivo se creó después de publicar (retraso); negativo =
 * se creó antes de publicar.
 */
export function getBoletinesConFechaInconsistente(
  data: BoletinesData,
): BoletinConFechaInconsistente[] {
  const resultado: BoletinConFechaInconsistente[] = [];
  data.boletines.forEach((boletin) => {
    const fechaCreacion = boletin.pdf_creation_date || boletin.created_at;
    if (!fechaCreacion) return;
    const publicada = diaKey(boletin.fecha_publicacion);
    const creada = diaKey(fechaCreacion);
    if (!publicada || !creada || publicada === creada) return;
    const dif = diferenciaDiasCalendario(boletin.fecha_publicacion, fechaCreacion);
    if (dif == null) return;
    resultado.push({
      ...boletin,
      fecha_creacion: fechaCreacion,
      fuente_creacion: boletin.pdf_creation_date ? 'pdf' : 'bd',
      dif_dias: dif,
    });
  });
  return resultado.sort((x, y) =>
    String(y.fecha_publicacion).localeCompare(String(x.fecha_publicacion)),
  );
}

export interface DesbalanceItem {
  expediente: string;
  nombre_proyecto: string;
  promovente: string;
  fecha_boletin: string;
  boletin_url: string;
  fecha_registro: string;
}

export interface Desbalances {
  resolutivosSinIngreso: DesbalanceItem[];
  ingresadosSinResolutivo: DesbalanceItem[];
  sinExpediente: { proyectos: number; resolutivos: number };
  total: number;
}

const claveExpediente = (expediente: string | null | undefined): string =>
  normalizeExpediente(expediente).toLowerCase();

/**
 * Cruce global de expedientes contra todo el historial: resolutivos emitidos
 * cuyo expediente no tiene proyecto ingresado (ni en este ni en otro boletín)
 * y proyectos ingresados cuyo expediente nunca recibió un resolutivo.
 */
export function getDesbalances(data: BoletinesData): Desbalances {
  const ingresados = new Set<string>();
  const resueltos = new Set<string>();
  let proyectosSinExp = 0;
  let resolutivosSinExp = 0;

  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((p) => {
      const k = claveExpediente(p.expediente);
      if (k) ingresados.add(k);
      else proyectosSinExp += 1;
    });
    (boletin.resolutivos_emitidos || []).forEach((r) => {
      const k = claveExpediente(r.expediente);
      if (k) resueltos.add(k);
      else resolutivosSinExp += 1;
    });
  });

  const resolutivosSinIngreso: DesbalanceItem[] = [];
  const ingresadosSinResolutivo: DesbalanceItem[] = [];
  const vistosResolutivos = new Set<string>();
  const vistosIngresados = new Set<string>();

  data.boletines.forEach((boletin) => {
    const fecha = boletin.fecha_publicacion ?? '';
    const url = boletin.url || boletin.filename || '';
    (boletin.resolutivos_emitidos || []).forEach((r) => {
      const k = claveExpediente(r.expediente);
      if (!k || ingresados.has(k) || vistosResolutivos.has(k)) return;
      vistosResolutivos.add(k);
      resolutivosSinIngreso.push({
        expediente: normalizeExpediente(r.expediente),
        nombre_proyecto: r.nombre_proyecto ?? '',
        promovente: r.promovente ?? '',
        fecha_boletin: fecha,
        boletin_url: url,
        fecha_registro: r.fecha_resolutivo ?? '',
      });
    });
    (boletin.proyectos_ingresados || []).forEach((p) => {
      const k = claveExpediente(p.expediente);
      if (!k || resueltos.has(k) || vistosIngresados.has(k)) return;
      vistosIngresados.add(k);
      ingresadosSinResolutivo.push({
        expediente: normalizeExpediente(p.expediente),
        nombre_proyecto: p.nombre_proyecto ?? '',
        promovente: p.promovente ?? '',
        fecha_boletin: fecha,
        boletin_url: url,
        fecha_registro: p.fecha_ingreso ?? '',
      });
    });
  });

  resolutivosSinIngreso.sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro));
  ingresadosSinResolutivo.sort((a, b) => b.fecha_registro.localeCompare(a.fecha_registro));

  return {
    resolutivosSinIngreso,
    ingresadosSinResolutivo,
    sinExpediente: { proyectos: proyectosSinExp, resolutivos: resolutivosSinExp },
    total: resolutivosSinIngreso.length + ingresadosSinResolutivo.length,
  };
}

/** Boletines sin proyectos ingresados ni resolutivos emitidos (ni en conteos ni en listas). */
export function getBoletinesVacios(data: BoletinesData): Boletin[] {
  return data.boletines
    .filter((b) => {
      const total =
        (b.cantidad_ingresados || 0) +
        (b.cantidad_resolutivos || 0) +
        (b.proyectos_ingresados || []).length +
        (b.resolutivos_emitidos || []).length;
      return total === 0;
    })
    .sort((a, b) => String(b.fecha_publicacion).localeCompare(String(a.fecha_publicacion)));
}

export interface BoletinConAnomalias {
  boletin: Boletin;
  anomalias: string[];
}

/**
 * Boletines con inconsistencias internas: conteos que no coinciden con las
 * listas reales, sin secretario/director, sin metadatos del PDF o con
 * expedientes duplicados entre proyectos del mismo boletín.
 */
export function getAnomaliasConteos(data: BoletinesData): BoletinConAnomalias[] {
  const resultado: BoletinConAnomalias[] = [];
  data.boletines.forEach((boletin) => {
    const anomalias: string[] = [];
    const nIngresados = (boletin.proyectos_ingresados || []).length;
    const nResolutivos = (boletin.resolutivos_emitidos || []).length;
    const cIngresados = boletin.cantidad_ingresados || 0;
    const cResolutivos = boletin.cantidad_resolutivos || 0;
    if (cIngresados !== nIngresados)
      anomalias.push(
        `Cantidad de ingresados (${cIngresados}) ≠ proyectos listados (${nIngresados})`,
      );
    if (cResolutivos !== nResolutivos)
      anomalias.push(
        `Cantidad de resolutivos (${cResolutivos}) ≠ resolutivos listados (${nResolutivos})`,
      );
    if (!boletin.pdf_creation_date && !boletin.pdf_mod_date && !boletin.pdf_author)
      anomalias.push('Sin metadatos del PDF (creación/modificación/autor)');
    const vistos = new Set<string>();
    let duplicados = 0;
    (boletin.proyectos_ingresados || []).forEach((p) => {
      const k = claveExpediente(p.expediente);
      if (!k) return;
      if (vistos.has(k)) duplicados += 1;
      vistos.add(k);
    });
    if (duplicados > 0) anomalias.push(`${duplicados} expediente(s) duplicado(s) en los proyectos`);
    if (anomalias.length === 0) return;
    resultado.push({ boletin, anomalias });
  });
  return resultado.sort((x, y) =>
    String(y.boletin.fecha_publicacion).localeCompare(String(x.boletin.fecha_publicacion)),
  );
}

const PROYECTO_CAMPOS_LABELS: { campo: keyof Proyecto; label: string }[] = [
  { campo: 'expediente', label: 'Expediente' },
  { campo: 'promovente', label: 'Promovente' },
  { campo: 'nombre_proyecto', label: 'Nombre del proyecto' },
  { campo: 'tipo_estudio', label: 'Tipo de estudio' },
  { campo: 'giro', label: 'Giro' },
  { campo: 'municipio', label: 'Municipio' },
  { campo: 'fecha_ingreso', label: 'Fecha de ingreso' },
  { campo: 'naturaleza_proyecto', label: 'Naturaleza' },
];

function campoVacio(valor: unknown): boolean {
  return valor == null || String(valor).trim() === '';
}

/**
 * Boletines cuyo archivo PDF (pdf_creation_date de los metadatos) se creó
 * después de su fecha de publicación: señales de publicación retrasada o
 * fuera de tiempo. Si faltan metadatos del PDF usa la fecha de la BD.
 */
export function getBoletinesFueraDeTiempo(
  data: BoletinesData,
  umbralDias = 0,
): BoletinFueraDeTiempo[] {
  const resultado: BoletinFueraDeTiempo[] = [];
  data.boletines.forEach((boletin) => {
    const fechaCreacionArchivo = boletin.pdf_creation_date || boletin.created_at;
    const dias = diferenciaDiasCalendario(boletin.fecha_publicacion, fechaCreacionArchivo);
    if (dias == null) return;
    if (dias <= umbralDias) return;
    resultado.push({
      ...boletin,
      dias_retraso: dias,
      fecha_creacion_archivo: fechaCreacionArchivo,
    });
  });
  return resultado.sort((x, y) =>
    String(y.fecha_publicacion).localeCompare(String(x.fecha_publicacion)),
  );
}

/**
 * Proyectos con campos obligatorios vacíos o ausentes. Cada registro indica
 * qué campos faltan y el boletín del que proviene.
 */
export function getProyectosConCamposFaltantes(data: BoletinesData): ProyectoConFaltantes[] {
  const resultado: ProyectoConFaltantes[] = [];
  data.boletines.forEach((boletin) => {
    (boletin.proyectos_ingresados || []).forEach((proyecto) => {
      const faltantes = PROYECTO_CAMPOS_LABELS.filter(({ campo }) => campoVacio(proyecto[campo]));
      const sinCoordenadas = proyecto.coordenadas_x == null && proyecto.coordenadas_y == null;
      if (sinCoordenadas) faltantes.push({ campo: 'coordenadas_x', label: 'Coordenadas' });
      if (faltantes.length === 0) return;
      resultado.push({
        proyecto,
        faltantes: faltantes.map((f) => f.label),
        boletin_fecha: boletin.fecha_publicacion,
        boletin_url: boletin.url || boletin.filename || '',
      });
    });
  });
  return resultado.sort((x, y) => String(y.boletin_fecha).localeCompare(String(x.boletin_fecha)));
}

/** Proyectos con coordenadas ausentes o inválidas (agrupados por expediente, más reciente). */
export function getProyectosSinCoordenadas(data: BoletinesData) {
  return getAllProyectos(data).filter((p) => {
    const x = p.coordenadas_x;
    const y = p.coordenadas_y;
    const validas = x != null && y != null && Number.isFinite(x) && Number.isFinite(y);
    return !validas || p.coord_valida === false;
  });
}

/** Resolutivos emitidos para un expediente concreto (ignora mayúsculas/espacios). */
export function getResolutivosPorExpediente(data: BoletinesData, expediente: string): Resolutivo[] {
  const clave = String(expediente || '')
    .trim()
    .toLowerCase();
  if (!clave) return [];
  const vistos = new Set<string>();
  const resultado: Resolutivo[] = [];
  data.boletines.forEach((boletin) => {
    (boletin.resolutivos_emitidos || []).forEach((resolutivo) => {
      if (
        String(resolutivo.expediente || '')
          .trim()
          .toLowerCase() !== clave
      )
        return;
      const dedupe = `${resolutivo.no_oficio_resolutivo}-${resolutivo.expediente}`;
      if (vistos.has(dedupe)) return;
      vistos.add(dedupe);
      resultado.push(resolutivo);
    });
  });
  return resultado;
}
