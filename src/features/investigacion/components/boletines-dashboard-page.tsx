import { useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Search,
  FilterX,
  ExternalLink,
  Loader2,
  Clock,
  Trophy,
  FolderSearch,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  getStats,
  getAllProyectos,
  getAllResolutivos,
  filterBoletinesV2,
  getProyectosConCamposFaltantes,
  getResolutivosPorExpediente,
  getBoletinesConFechaInconsistente,
  getDesbalances,
  getBoletinesVacios,
  getProyectosSinCoordenadas,
  diferenciaDiasCalendario,
  normalizeExpediente,
} from '../lib/data-utils';
import { getCalendarParts, formatFechaHoraLarga } from '../lib/date-utils';
import { formatearFecha } from '../lib/boletin-utils';
import type { Boletin } from '../lib/types';

interface DashboardFilters {
  search: string;
  año: string;
  mes: string;
  municipio: string;
  giro: string;
  tipo: string;
}

const DEFAULT_FILTERS: DashboardFilters = {
  search: '',
  año: 'all',
  mes: 'all',
  municipio: 'all',
  giro: 'all',
  tipo: 'all',
};

const MESES = [
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

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const numero = new Intl.NumberFormat('es-MX');

function KpiCard({
  label,
  value,
  onClick,
  activo = false,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  activo?: boolean;
}) {
  if (!onClick) {
    return (
      <div className="flex items-center gap-4 bg-white p-4">
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
            {label}
          </p>
          <p className="mt-0.5 text-3xl font-bold tracking-tighter text-[#0d0d0d]">{value}</p>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex items-center gap-4 border border-[#f3f4f0] p-4 text-left transition-colors ${
        activo ? 'bg-[#0d0d0d]' : 'bg-white hover:bg-[#f3f4f0]'
      }`}
    >
      <div className="min-w-0">
        <p
          className={`truncate font-sans text-sm font-bold uppercase tracking-widest ${
            activo ? 'text-white' : 'text-[#0d0d0d]'
          }`}
        >
          {label}
        </p>
        <p
          className={`mt-0.5 text-3xl font-bold tracking-tighter ${
            activo ? 'text-white' : 'text-[#0d0d0d]'
          }`}
        >
          {value}
        </p>
      </div>
    </button>
  );
}

function ChartCard({
  title,
  children,
  action,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col bg-white ${className}`}>
      <div className="flex items-start justify-between gap-2 px-5 py-4">
        <div className="min-w-0">
          <h3 className="font-sans text-xl font-bold uppercase tracking-widest text-[#0d0d0d]">
            {title}
          </h3>
        </div>
        {action}
      </div>
      <div className="grow p-4">{children}</div>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-none border border-[#f3f4f0] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Dato({
  label,
  valor,
  mono = false,
}: {
  label: string;
  valor: string | number | null | undefined;
  mono?: boolean;
}) {
  const texto = valor == null || String(valor).trim() === '' ? '' : String(valor);
  return (
    <div className="bg-[#f3f4f0] px-3 py-2">
      <dt className="font-sans text-sm font-bold uppercase tracking-widest text-gray-600">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-sm ${!texto ? 'font-bold text-[#ff7e67]' : mono ? 'text-gray-800' : 'text-[#0d0d0d]'}`}
      >
        {!texto ? 'Falta dato' : texto}
      </dd>
    </div>
  );
}

export default function BoletinesDashboardPage() {
  const { data, processedData, loading, error } = useDashboardData();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [selectedExpediente, setSelectedExpediente] = useState('');
  const detalleRef = useRef<HTMLDivElement | null>(null);
  const [calFecha, setCalFecha] = useState(() => {
    const ahora = new Date();
    return { year: ahora.getFullYear(), month: ahora.getMonth() + 1 };
  });
  const [calNavegado, setCalNavegado] = useState(false);
  const [calDiaSel, setCalDiaSel] = useState<string | null>(null);
  const [boletinSelId, setBoletinSelId] = useState<number | null>(null);
  const [kpiActivo, setKpiActivo] = useState<string | null>(null);
  const [busquedaNavegacion, setBusquedaNavegacion] = useState('');

  const allBoletines = useMemo(() => data?.boletines ?? [], [data]);

  const filteredBoletines = useMemo(() => {
    if (allBoletines.length === 0) return [];
    let list = filterBoletinesV2(allBoletines, {
      search: filters.search || undefined,
      año: filters.año === 'all' ? undefined : filters.año,
      mes: filters.mes === 'all' ? undefined : filters.mes,
      tipo: filters.tipo === 'all' ? undefined : filters.tipo,
      municipio: filters.municipio === 'all' ? undefined : filters.municipio,
    });
    if (filters.giro !== 'all') {
      list = list.filter((b) =>
        (b.proyectos_ingresados || []).some((p) => p.giro === filters.giro),
      );
    }
    return list;
  }, [allBoletines, filters]);

  const dataGlobal = useMemo(() => ({ boletines: allBoletines }), [allBoletines]);

  const statsGlobal = useMemo(() => getStats(dataGlobal), [dataGlobal]);
  const fechasInconsistentesGlobal = useMemo(
    () => getBoletinesConFechaInconsistente(dataGlobal),
    [dataGlobal],
  );
  const desbalancesGlobal = useMemo(() => getDesbalances(dataGlobal), [dataGlobal]);
  const vaciosGlobal = useMemo(() => getBoletinesVacios(dataGlobal), [dataGlobal]);
  const proyectosGlobal = useMemo(() => getAllProyectos(dataGlobal), [dataGlobal]);
  const resolutivosGlobal = useMemo(() => getAllResolutivos(dataGlobal), [dataGlobal]);
  const proyectosSinCoordsGlobal = useMemo(
    () => getProyectosSinCoordenadas(dataGlobal),
    [dataGlobal],
  );

  const hoyISO = new Date().toISOString().slice(0, 10);
  const ingresadosCriticosGlobal = useMemo(() => {
    return desbalancesGlobal.ingresadosSinResolutivo
      .map((item) => ({
        item,
        dias: diferenciaDiasCalendario(item.fecha_registro, hoyISO),
      }))
      .filter((x) => x.dias != null && x.dias > 120)
      .sort((a, b) => (b.dias || 0) - (a.dias || 0));
  }, [desbalancesGlobal, hoyISO]);

  const fechasInconsistentesPorId = useMemo(() => {
    const map = new Map<number, (typeof fechasInconsistentesGlobal)[number]>();
    fechasInconsistentesGlobal.forEach((f) => map.set(f.id, f));
    return map;
  }, [fechasInconsistentesGlobal]);

  const boletinSel = useMemo(
    () => (boletinSelId != null ? (allBoletines.find((b) => b.id === boletinSelId) ?? null) : null),
    [allBoletines, boletinSelId],
  );

  const boletinSelDia = boletinSel ? getCalendarParts(boletinSel.fecha_publicacion) : null;

  const resultadosNavegacion = useMemo(() => {
    const q = busquedaNavegacion.trim().toLowerCase();
    if (q.length < 2) return [];
    const proyectos = getAllProyectos(dataGlobal)
      .map((p) => ({
        tipo: 'proyecto' as const,
        expediente: p.expediente ?? '',
        nombre: p.nombre_proyecto ?? '',
        promovente: p.promovente ?? '',
        boletin_id: p.boletin_id,
        fecha_publicacion: p.fecha_publicacion,
        url: p.boletin_url,
      }))
      .filter(
        (p) =>
          p.expediente.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          p.promovente.toLowerCase().includes(q),
      )
      .slice(0, 24);
    const resolutivos = resolutivosGlobal
      .map((r) => ({
        tipo: 'resolutivo' as const,
        expediente: r.expediente ?? '',
        nombre: r.nombre_proyecto ?? '',
        promovente: r.promovente ?? '',
        boletin_id: r.boletin_id,
        fecha_publicacion: r.fecha_publicacion,
        url: r.boletin_url,
      }))
      .filter(
        (r) =>
          r.expediente.toLowerCase().includes(q) ||
          r.nombre.toLowerCase().includes(q) ||
          r.promovente.toLowerCase().includes(q),
      )
      .slice(0, 24);
    return [...proyectos, ...resolutivos];
  }, [busquedaNavegacion, dataGlobal, resolutivosGlobal]);

  const navegarABoletin = (boletinId: number, expediente?: string) => {
    const b = allBoletines.find((x) => x.id === boletinId);
    setBoletinSelId(boletinId);
    setCalDiaSel(null);
    if (b) {
      const parts = getCalendarParts(b.fecha_publicacion);
      if (parts) {
        setCalNavegado(true);
        setCalFecha({ year: Number(parts.year), month: Number(parts.month) });
      }
    }
    if (expediente) {
      setSelectedExpediente(expediente);
      requestAnimationFrame(() => {
        detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      setSelectedExpediente('');
    }
  };

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    allBoletines.forEach((b) => {
      const y = getCalendarParts(b.fecha_publicacion)?.year ?? String(b.año);
      if (y) set.add(y);
    });
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [allBoletines]);

  const topPromoventes = useMemo(() => {
    const map = new Map<string, number>();
    allBoletines.forEach((b) => {
      (b.proyectos_ingresados || []).forEach((p) => {
        const key = p.promovente?.trim();
        if (key) map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return [...map.entries()]
      .map(([label, valor]) => ({ label, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [allBoletines]);

  const maxPromovente = useMemo(
    () => Math.max(1, ...topPromoventes.map((p) => p.valor)),
    [topPromoventes],
  );

  const proyectoSeleccionado = useMemo(
    () => proyectosGlobal.find((p) => (p.expediente ?? '') === selectedExpediente),
    [proyectosGlobal, selectedExpediente],
  );
  const resolutivosDeProyecto = useMemo(
    () => (selectedExpediente ? getResolutivosPorExpediente(dataGlobal, selectedExpediente) : []),
    [dataGlobal, selectedExpediente],
  );
  const boletinGlobalPorId = useMemo(
    () => new Map(allBoletines.map((b) => [b.id, b])),
    [allBoletines],
  );
  const boletinDeProyecto = useMemo(
    () =>
      proyectoSeleccionado ? boletinGlobalPorId.get(proyectoSeleccionado.boletin_id) : undefined,
    [proyectoSeleccionado, boletinGlobalPorId],
  );

  const proyectosFaltantesGlobal = useMemo(
    () => getProyectosConCamposFaltantes(dataGlobal),
    [dataGlobal],
  );
  const pctCompletos =
    proyectosGlobal.length > 0 ? 1 - proyectosFaltantesGlobal.length / proyectosGlobal.length : 0;

  const ingresoPorExpediente = useMemo(() => {
    const set = new Set<string>();
    proyectosGlobal.forEach((p) => {
      if (p.expediente) set.add(normalizeExpediente(p.expediente).toLowerCase());
    });
    return set;
  }, [proyectosGlobal]);

  const boletinIngresoPorExpediente = useMemo(() => {
    const map = new Map<
      string,
      { id: number | null; url: string | null; fecha_publicacion: string | null }
    >();
    resolutivosGlobal.forEach((r) => {
      const k = normalizeExpediente(r.expediente).toLowerCase();
      if (!k) return;
      const existing = map.get(k);
      if (!existing || (!existing.id && r.boletin_ingreso_id)) {
        map.set(k, {
          id: r.boletin_ingreso_id ?? null,
          url: r.boletin_ingreso_url,
          fecha_publicacion: r.boletin_ingreso_fecha_publicacion,
        });
      }
    });
    return map;
  }, [resolutivosGlobal]);

  const limpiarFiltros = () => {
    setFilters(DEFAULT_FILTERS);
    setCalDiaSel(null);
    setKpiActivo(null);
  };

  const toggleKpi = (kpi: string) => {
    setKpiActivo((prev) => (prev === kpi ? null : kpi));
  };

  const filtrosActivos = () => {
    const count = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length;
    return count + (filters.search ? 1 : 0) + (calDiaSel ? 1 : 0) + (kpiActivo ? 1 : 0);
  };

  const filterOptions = processedData
    ? [
        {
          value: 'año',
          label: 'Año',
          options: [
            { value: 'all', label: 'Todos' },
            ...yearOptions.map((y) => ({ value: y, label: y })),
          ],
        },
        {
          value: 'mes',
          label: 'Mes',
          options: [
            { value: 'all', label: 'Todos' },
            ...MESES.map((m, i) => ({ value: String(i + 1), label: m })),
          ],
        },
        {
          value: 'municipio',
          label: 'Municipio',
          options: [
            { value: 'all', label: 'Todos' },
            ...processedData.stats.municipios.map((m: string) => ({ value: m, label: m })),
          ],
        },
        {
          value: 'giro',
          label: 'Giro',
          options: [
            { value: 'all', label: 'Todos' },
            ...processedData.stats.giros.map((g: string) => ({ value: g, label: g })),
          ],
        },
        {
          value: 'tipo',
          label: 'Tipo de estudio',
          options: [
            { value: 'all', label: 'Todos' },
            ...processedData.stats.tiposEstudio.map((t: string) => ({ value: t, label: t })),
          ],
        },
      ]
    : [];

  const setFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const calMostrado = (() => {
    if (calNavegado) return calFecha;
    const k = allBoletines[0] ? getCalendarParts(allBoletines[0].fecha_publicacion) : null;
    return k ? { year: Number(k.year), month: Number(k.month) } : calFecha;
  })();

  const calKey = `${calMostrado.year}-${String(calMostrado.month).padStart(2, '0')}`;
  const boletinesDelMes = useMemo(
    () =>
      filteredBoletines.filter((b) => {
        const k = getCalendarParts(b.fecha_publicacion);
        return k && `${k.year}-${String(k.month).padStart(2, '0')}` === calKey;
      }),
    [filteredBoletines, calKey],
  );

  const boletinesPorDia = useMemo(() => {
    const map = new Map<string, Boletin[]>();
    boletinesDelMes.forEach((b) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.fecha_publicacion));
      if (!match) return;
      const key = `${calMostrado.year}-${calMostrado.month}-${String(parseInt(match[3], 10))}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [boletinesDelMes, calMostrado]);

  const primerDia = (new Date(calMostrado.year, calMostrado.month - 1, 1).getDay() + 6) % 7;
  const diasDelMes = new Date(calMostrado.year, calMostrado.month, 0).getDate();
  const moverMes = (delta: number) => {
    setCalNavegado(true);
    setCalFecha((f) => {
      const fecha = new Date(f.year, f.month - 1 + delta, 1);
      return { year: fecha.getFullYear(), month: fecha.getMonth() + 1 };
    });
    setCalDiaSel(null);
  };
  const irAlMesActual = () => {
    setCalNavegado(true);
    const ahora = new Date();
    setCalFecha({ year: ahora.getFullYear(), month: ahora.getMonth() + 1 });
    setCalDiaSel(null);
  };
  const celdasCalendario = (() => {
    const total = Math.ceil((primerDia + diasDelMes) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const dia = i - primerDia + 1;
      if (dia < 1 || dia > diasDelMes) return null;
      const key = `${calMostrado.year}-${calMostrado.month}-${String(dia)}`;
      const publicados = boletinesPorDia.get(key) ?? [];
      const inconsistentes = publicados.filter((b) => fechasInconsistentesPorId.has(b.id)).length;
      const sinMetadato = publicados.filter((b) => !b.pdf_creation_date).length;
      return { dia, key, boletines: publicados, inconsistentes, sinMetadato };
    });
  })();
  const boletinesDiaSel = calDiaSel
    ? (boletinesPorDia.get(calDiaSel) ?? []).map((b) => {
        const inconsistente = fechasInconsistentesPorId.get(b.id);
        const creada = b.pdf_creation_date || b.created_at;
        return { boletin: b, inconsistente, creada };
      })
    : [];
  const totalMes = celdasCalendario.reduce((s, c) => s + (c ? c.boletines.length : 0), 0);

  const anomaliasDelBoletin = useMemo(() => {
    if (!boletinSel) return [];
    const lista: { tipo: string; detalle: string }[] = [];
    const inc = fechasInconsistentesPorId.get(boletinSel.id);
    if (inc) {
      lista.push({
        tipo: 'fecha',
        detalle: `Creado ${inc.dif_dias > 0 ? `${inc.dif_dias} días después` : `${Math.abs(inc.dif_dias)} días antes`} de la publicación${inc.fuente_creacion === 'bd' ? ' · BD' : ''}`,
      });
    }
    if (!boletinSel.pdf_creation_date) {
      lista.push({ tipo: 'metadatos', detalle: 'Sin metadatos PDF (creación/modificación/autor)' });
    }
    const nIngresados = (boletinSel.proyectos_ingresados || []).length;
    const nResolutivos = (boletinSel.resolutivos_emitidos || []).length;
    if ((boletinSel.cantidad_ingresados || 0) !== nIngresados) {
      lista.push({
        tipo: 'conteo',
        detalle: `Conteo de ingresados (${boletinSel.cantidad_ingresados}) ≠ listados (${nIngresados})`,
      });
    }
    if ((boletinSel.cantidad_resolutivos || 0) !== nResolutivos) {
      lista.push({
        tipo: 'conteo',
        detalle: `Conteo de resolutivos (${boletinSel.cantidad_resolutivos}) ≠ listados (${nResolutivos})`,
      });
    }
    const resolutivosSinIngreso = (boletinSel.resolutivos_emitidos || []).filter(
      (r) => !ingresoPorExpediente.has(normalizeExpediente(r.expediente).toLowerCase()),
    );
    if (resolutivosSinIngreso.length > 0) {
      lista.push({
        tipo: 'ingreso',
        detalle: `${resolutivosSinIngreso.length} resolutivo(s) sin proyecto de ingreso correspondiente`,
      });
    }
    const faltantesBoletin = getProyectosConCamposFaltantes({ boletines: [boletinSel] });
    if (faltantesBoletin.length > 0) {
      lista.push({
        tipo: 'faltantes',
        detalle: `${faltantesBoletin.length} proyecto(s) con campos faltantes`,
      });
    }
    return lista;
  }, [boletinSel, fechasInconsistentesPorId, ingresoPorExpediente]);

  const SeleccionarDia = (key: string) => {
    setCalDiaSel(calDiaSel === key ? null : key);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0d0d0d]" aria-hidden />
        <p className="font-sans text-sm uppercase tracking-widest text-gray-600">Cargando datos…</p>
      </div>
    );
  }

  if (error || !data || !processedData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold tracking-tighter text-[#0d0d0d]">
          No se pudieron cargar los datos
        </h2>
        <p className="mt-2 text-sm text-gray-600">{error ?? 'No hay datos disponibles.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#fccb4e] px-5 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-10">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 bg-black px-3 py-1 font-sans text-sm font-bold uppercase tracking-widest text-white">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            SSMAA · Monitor Ambiental
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tighter text-[#0d0d0d] sm:text-4xl">
            Panel de análisis · Boletines Ambientales
          </h1>
          <p className="mt-1 font-sans text-base uppercase tracking-widest text-gray-600">
            {processedData.metadata.lastSync
              ? `Última sincronización: ${formatFechaHoraLarga(processedData.metadata.lastSync)}`
              : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filterOptions.map((fo) => (
              <SelectFilter
                key={fo.value}
                label={fo.label}
                value={filters[fo.value as keyof DashboardFilters]}
                options={fo.options}
                onChange={(v) => setFilter(fo.value as keyof DashboardFilters, v)}
              />
            ))}
          </div>
          <div className="flex items-end justify-end pt-4 lg:w-56 lg:shrink-0 lg:pl-5 lg:pt-3">
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={filtrosActivos() === 0}
              className="inline-flex w-full items-center justify-center gap-2 bg-white px-4 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] disabled:opacity-40 lg:w-auto"
            >
              <FilterX className="h-4 w-4" aria-hidden />
              Limpiar filtros {filtrosActivos() > 0 ? `(${filtrosActivos()})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Boletines" value={numero.format(statsGlobal.totalBoletines)} />
        <KpiCard label="Proyectos ingresados" value={numero.format(statsGlobal.totalProyectos)} />
        <KpiCard label="Resolutivos emitidos" value={numero.format(statsGlobal.totalResolutivos)} />
      </div>

      {/* ===== UN BOLETÍN ===== */}
      <div className="mb-4 flex items-center gap-2 border-t border-[#f3f4f0] pt-8">
        <CalendarDays className="h-5 w-5 text-[#0d0d0d]" aria-hidden />
        <h2 className="font-sans text-2xl font-bold uppercase tracking-tighter text-[#0d0d0d]">
          Un boletín
        </h2>
        <span className="ml-2 hidden font-sans text-sm uppercase tracking-widest text-gray-500 sm:inline">
          de lo general a lo particular
        </span>
      </div>

      {/* Búsqueda de navegación */}
      <div className="mb-6 bg-white p-4">
        <label className="mb-1 block font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
          Ir directo a un expediente, proyecto o promovente
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            aria-hidden
          />
          <input
            type="text"
            value={busquedaNavegacion}
            onChange={(e) => setBusquedaNavegacion(e.target.value)}
            placeholder="Expediente, nombre del proyecto o promovente…"
            className="w-full rounded-none border border-[#f3f4f0] bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        {resultadosNavegacion.length > 0 && (
          <ul className="mt-2 divide-y divide-black/10 border border-[#f3f4f0] bg-[#f3f4f0]/40">
            {resultadosNavegacion.map((r, i) => (
              <li key={`${r.tipo}-${r.expediente}-${r.boletin_id}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    navegarABoletin(r.boletin_id, r.tipo === 'proyecto' ? r.expediente : undefined);
                    setBusquedaNavegacion('');
                  }}
                  className="block w-full px-3 py-2 text-left transition-colors hover:bg-[#fccb4e]/20"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-[#0d0d0d]">
                      {r.tipo === 'proyecto' ? 'Ingreso' : 'Resolutivo'} · {r.expediente || '—'}
                    </span>
                    <span className="font-sans text-sm text-gray-600">
                      Boletín {r.boletin_id} · {formatearFecha(r.fecha_publicacion)}
                    </span>
                  </div>
                  <p className="truncate text-sm text-[#0d0d0d]">{r.nombre || '—'}</p>
                  <p className="truncate text-sm text-gray-600">{r.promovente || ''}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendario */}
        <ChartCard
          title="Calendario de boletines"
          action={
            <span className="bg-[#fccb4e] px-2 py-1 font-sans text-sm font-bold text-[#0d0d0d]">
              {numero.format(totalMes)} este mes
            </span>
          }
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moverMes(-1)}
              className="inline-flex h-8 w-8 items-center justify-center bg-white text-[#0d0d0d] transition-colors hover:bg-[#fccb4e]"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="text-center">
              <p className="font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d]">
                {MESES[calMostrado.month - 1]} {calMostrado.year}
              </p>
              <button
                type="button"
                onClick={irAlMesActual}
                className="mt-0.5 inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
              >
                Mes actual
              </button>
            </div>
            <button
              type="button"
              onClick={() => moverMes(1)}
              className="inline-flex h-8 w-8 items-center justify-center bg-white text-[#0d0d0d] transition-colors hover:bg-[#fccb4e]"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="pb-1 font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]"
              >
                {d}
              </div>
            ))}
            {celdasCalendario.map((celda, i) =>
              celda === null ? (
                <div key={`blank-${i}`} className="min-h-[42px] bg-[#e8e9e2]/60" />
              ) : celda.boletines.length === 0 ? (
                <div
                  key={celda.key}
                  className="flex min-h-[42px] items-center justify-center bg-white text-sm text-gray-400"
                >
                  {celda.dia}
                </div>
              ) : (
                <button
                  key={celda.key}
                  type="button"
                  onClick={() => {
                    SeleccionarDia(celda.key);
                    setBoletinSelId(null);
                  }}
                  aria-label={`Día ${celda.dia}: ${celda.boletines.length} publicados, ${celda.inconsistentes} con creación distinta, ${celda.sinMetadato} sin metadatos`}
                  className={`flex min-h-[42px] flex-col items-center justify-center gap-0.5 text-sm font-bold transition-colors ${
                    calDiaSel === celda.key
                      ? 'bg-black text-[#fccb4e]'
                      : 'bg-[#fccb4e] text-[#0d0d0d] hover:bg-[#fccb4e]/80'
                  }`}
                >
                  {celda.dia}
                  <span className="flex items-center gap-1">
                    {celda.boletines.length > 0 && (
                      <span
                        className={`px-1 text-sm font-bold leading-3 ${calDiaSel === celda.key ? 'bg-[#fccb4e] text-[#0d0d0d]' : 'bg-black text-[#fccb4e]'}`}
                      >
                        {celda.boletines.length}
                      </span>
                    )}
                    {celda.inconsistentes > 0 && (
                      <span
                        className={`px-1 text-sm font-bold leading-3 ${calDiaSel === celda.key ? 'bg-white text-[#0d0d0d]' : 'bg-[#0a0a0a] text-white'}`}
                        title="Fecha de creación distinta a la publicación"
                      >
                        Δ{celda.inconsistentes}
                      </span>
                    )}
                    {celda.sinMetadato > 0 && (
                      <span
                        className={`px-1 text-sm font-bold leading-3 ${calDiaSel === celda.key ? 'bg-white text-[#0d0d0d]' : 'bg-[#ff7e67] text-white'}`}
                        title="Sin metadatos PDF"
                      >
                        !
                      </span>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 font-sans text-sm uppercase tracking-widest text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#fccb4e]" />
              Publicados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#0a0a0a]" />
              Creación ≠ publicación
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 bg-[#ff7e67]" />
              Sin metadatos
            </span>
          </div>
        </ChartCard>

        {/* Boletines del día */}
        <ChartCard
          title={
            calDiaSel ? `Boletines del ${calDiaSel.split('-').join('/')}` : 'Boletines del día'
          }
          action={
            calDiaSel ? (
              <span className="bg-[#0a0a0a] px-2 py-1 font-sans text-sm font-bold text-white">
                {numero.format(boletinesDiaSel.length)}
              </span>
            ) : undefined
          }
        >
          <div className="max-h-[420px] overflow-auto">
            {!calDiaSel ? (
              <p className="flex h-[380px] flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                <CalendarDays className="h-6 w-6 text-gray-400" aria-hidden />
                Elige un día del calendario para ver sus boletines.
              </p>
            ) : boletinesDiaSel.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Sin boletines este día en la selección actual.
              </p>
            ) : (
              <ul className="divide-y divide-black/10">
                {boletinesDiaSel.map(({ boletin, inconsistente, creada }) => {
                  const seleccionado = boletinSelId === boletin.id;
                  return (
                    <li
                      key={boletin.id}
                      className={`flex flex-col gap-1 px-1 py-3 ${seleccionado ? 'bg-[#fccb4e]/15' : ''}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setBoletinSelId(seleccionado ? null : boletin.id)}
                          aria-pressed={seleccionado}
                          className="min-w-0 text-left"
                        >
                          <p className="truncate text-sm font-medium text-[#0d0d0d]">
                            Boletín ID {boletin.id} · {boletin.año} · {boletin.mes}
                          </p>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          {inconsistente && (
                            <span className="bg-[#0a0a0a] px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white">
                              {inconsistente.dif_dias > 0 ? '+' : ''}
                              {inconsistente.dif_dias} d·creación
                            </span>
                          )}
                          {!creada && (
                            <span className="bg-[#ff7e67] px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white">
                              Sin metadatos PDF
                            </span>
                          )}
                          {(boletin.url || boletin.filename) && (
                            <a
                              href={boletin.url || boletin.filename}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                            >
                              Ver <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          )}
                        </div>
                      </div>
                      {seleccionado && (
                        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Dato
                            label="Publicación"
                            valor={formatearFecha(boletin.fecha_publicacion)}
                          />
                          <Dato
                            label="Creación"
                            valor={
                              creada
                                ? `${formatearFecha(creada)}${inconsistente && inconsistente.fuente_creacion === 'bd' ? ' · BD' : ''}`
                                : ''
                            }
                          />
                        </dl>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </ChartCard>

        {/* Detalle del boletín seleccionado */}
        <ChartCard
          title={boletinSel ? `Boletín ${boletinSel.id}` : 'Boletín seleccionado'}
          action={
            boletinSel && (
              <span className="bg-[#0a0a0a] px-2 py-1 font-sans text-sm font-bold text-white">
                {numero.format(boletinSel.cantidad_ingresados)} /{' '}
                {numero.format(boletinSel.cantidad_resolutivos)}
              </span>
            )
          }
        >
          {!boletinSel ? (
            <p className="flex h-[420px] flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
              <CalendarDays className="h-6 w-6 text-gray-400" aria-hidden />
              Elige un boletín del día, o busca un expediente, para ver sus datos, ingresados y
              resolutivos.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Dato label="Publicación" valor={formatearFecha(boletinSel.fecha_publicacion)} />
                <Dato label="Creación" valor={boletinSel.pdf_creation_date || ''} />
                <Dato label="Ingresados" valor={boletinSel.cantidad_ingresados} />
                <Dato label="Resolutivos" valor={boletinSel.cantidad_resolutivos} />
              </dl>
              <div className="flex flex-wrap gap-2">
                {(boletinSel.url || boletinSel.filename) && (
                  <a
                    href={boletinSel.url || boletinSel.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                  >
                    Abrir boletín original <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                )}
              </div>
              {anomaliasDelBoletin.length > 0 && (
                <div className="bg-[#f3f4f0] p-3">
                  <p className="mb-2 flex items-center gap-1.5 font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#ff7e67]" aria-hidden />
                    Anomalías de este boletín
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {anomaliasDelBoletin.map((a, i) => (
                      <li key={i} className="text-sm text-[#0d0d0d]">
                        <span className="mr-1.5 inline-block h-2 w-2 bg-[#ff7e67]" />
                        {a.detalle}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {boletinSelDia && (
                <div>
                  <button
                    type="button"
                    onClick={() => navegarABoletin(boletinSel.id)}
                    className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#fccb4e] hover:text-[#0d0d0d]"
                  >
                    Ubicar en el calendario
                  </button>
                </div>
              )}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Ingresados y resolutivos del boletín */}
      {boletinSel &&
        (() => {
          const ingresados = boletinSel.proyectos_ingresados || [];
          const resolutivos = boletinSel.resolutivos_emitidos || [];
          const faltantesPorExpediente = new Map<string, string[]>();
          getProyectosConCamposFaltantes({ boletines: [boletinSel] }).forEach((f) => {
            if (f.proyecto.expediente)
              faltantesPorExpediente.set(f.proyecto.expediente, f.faltantes);
          });
          return (
            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title={`Ingresados · boletín ${boletinSel.id}`}
                action={
                  <span className="bg-[#fccb4e] px-2 py-1 font-sans text-sm font-bold text-[#0d0d0d]">
                    {numero.format(ingresados.length)}
                  </span>
                }
              >
                <div className="max-h-[420px] overflow-auto">
                  {ingresados.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">
                      Sin proyectos listados.
                    </p>
                  ) : (
                    <ul className="divide-y divide-black/10">
                      {ingresados.map((p) => {
                        const faltantes = faltantesPorExpediente.get(p.expediente ?? '') ?? [];
                        const sinCoords =
                          p.coordenadas_x == null ||
                          p.coordenadas_y == null ||
                          p.coord_valida === false;
                        return (
                          <li key={`${p.expediente}-${p.numero}`}>
                            <button
                              type="button"
                              disabled={!p.expediente}
                              onClick={() => {
                                setSelectedExpediente(p.expediente || '');
                                setBoletinSelId(boletinSel.id);
                                requestAnimationFrame(() => {
                                  detalleRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                  });
                                });
                              }}
                              className={`block w-full px-1 py-3 text-left ${
                                selectedExpediente === p.expediente ? 'bg-[#ff7e67]/10' : ''
                              }`}
                            >
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="text-sm font-bold text-[#0d0d0d]">
                                  {p.expediente || 'Sin expediente'} · {p.nombre_proyecto || '—'}
                                </span>
                                <span className="shrink-0 font-sans text-sm text-gray-600">
                                  {formatearFecha(p.fecha_ingreso)}
                                </span>
                              </div>
                              <p className="truncate text-sm text-gray-600">
                                {p.promovente || '—'} · {p.municipio || '—'} ·{' '}
                                {p.tipo_estudio || '—'}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {sinCoords && (
                                  <span className="inline-flex items-center gap-1 bg-[#0a0a0a] px-1.5 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white">
                                    <MapPin className="h-3 w-3" aria-hidden />
                                    Sin coordenadas válidas
                                  </span>
                                )}
                                {faltantes.map((f) => (
                                  <span
                                    key={f}
                                    className="bg-[#ff7e67] px-1.5 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </ChartCard>

              <ChartCard
                title={`Resolutivos · boletín ${boletinSel.id}`}
                action={
                  <span className="bg-[#0a0a0a] px-2 py-1 font-sans text-sm font-bold text-white">
                    {numero.format(resolutivos.length)}
                  </span>
                }
              >
                <div className="max-h-[420px] overflow-auto">
                  {resolutivos.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-500">
                      Sin resolutivos listados.
                    </p>
                  ) : (
                    <ul className="divide-y divide-black/10">
                      {resolutivos.map((r) => {
                        const sinIngreso = !ingresoPorExpediente.has(
                          normalizeExpediente(r.expediente).toLowerCase(),
                        );
                        const ingresoInfo = boletinIngresoPorExpediente.get(
                          normalizeExpediente(r.expediente).toLowerCase(),
                        );
                        const boletinIngreso =
                          ingresoInfo?.id != null
                            ? boletinGlobalPorId.get(ingresoInfo.id)
                            : undefined;
                        const boletinIngresoFecha =
                          boletinIngreso?.fecha_publicacion || ingresoInfo?.fecha_publicacion || '';
                        return (
                          <li key={`${r.expediente}-${r.numero}`} className="px-1 py-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <button
                                type="button"
                                disabled={!r.expediente}
                                onClick={() => {
                                  setSelectedExpediente(r.expediente || '');
                                  setBoletinSelId(boletinSel.id);
                                  requestAnimationFrame(() => {
                                    detalleRef.current?.scrollIntoView({
                                      behavior: 'smooth',
                                      block: 'start',
                                    });
                                  });
                                }}
                                className="min-w-0 text-left"
                              >
                                <p className="text-sm font-bold text-[#0d0d0d]">
                                  {r.no_oficio_resolutivo || r.expediente || 'Sin expediente'}
                                </p>
                                <p className="truncate text-sm text-[#0d0d0d]">
                                  {r.nombre_proyecto || '—'}
                                </p>
                                <p className="truncate text-sm text-gray-600">
                                  {r.promovente || '—'} · resolutivo{' '}
                                  {formatearFecha(r.fecha_resolutivo)}
                                </p>
                              </button>
                              <div className="flex shrink-0 flex-col items-end gap-1.5">
                                {sinIngreso && (
                                  <span className="bg-[#ff7e67] px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white">
                                    Sin proyecto de ingreso
                                  </span>
                                )}
                                {(boletinSel.url || boletinSel.filename) && (
                                  <a
                                    href={boletinSel.url || boletinSel.filename}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                                  >
                                    Boletín <ExternalLink className="h-3 w-3" aria-hidden />
                                  </a>
                                )}
                                {ingresoInfo &&
                                  (boletinIngreso?.url ||
                                    boletinIngreso?.filename ||
                                    ingresoInfo.url) && (
                                    <a
                                      href={
                                        boletinIngreso?.url ||
                                        boletinIngreso?.filename ||
                                        ingresoInfo.url ||
                                        ''
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#fccb4e] hover:text-[#0d0d0d]"
                                    >
                                      Boletín de ingreso
                                      {boletinIngresoFecha
                                        ? ` · ${formatearFecha(boletinIngresoFecha)}`
                                        : ''}{' '}
                                      <ExternalLink className="h-3 w-3" aria-hidden />
                                    </a>
                                  )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </ChartCard>
            </div>
          );
        })()}

      {/* Detalle de proyecto y su resolutivo */}
      {proyectoSeleccionado && (
        <div className="mb-6" ref={detalleRef}>
          <ChartCard title={`Proyecto ${proyectoSeleccionado.expediente ?? ''}`}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Dato label="Expediente" valor={proyectoSeleccionado.expediente} />
                  <Dato label="Nombre" valor={proyectoSeleccionado.nombre_proyecto} />
                  <Dato label="Promovente" valor={proyectoSeleccionado.promovente} />
                  <Dato label="Tipo de estudio" valor={proyectoSeleccionado.tipo_estudio} />
                  <Dato label="Giro" valor={proyectoSeleccionado.giro} />
                  <Dato label="Municipio" valor={proyectoSeleccionado.municipio} />
                  <Dato
                    label="Fecha de ingreso"
                    valor={
                      proyectoSeleccionado.fecha_ingreso
                        ? formatearFecha(proyectoSeleccionado.fecha_ingreso)
                        : ''
                    }
                  />
                  <Dato
                    label="Coordenadas"
                    valor={
                      proyectoSeleccionado.coordenadas_x != null &&
                      proyectoSeleccionado.coordenadas_y != null
                        ? `${proyectoSeleccionado.coordenadas_x.toFixed(5)}, ${proyectoSeleccionado.coordenadas_y.toFixed(5)}`
                        : ''
                    }
                    mono
                  />
                  <Dato label="Naturaleza" valor={proyectoSeleccionado.naturaleza_proyecto} />
                  <div className="bg-[#f3f4f0] px-3 py-2">
                    <dt className="font-sans text-sm font-bold uppercase tracking-widest text-gray-600">
                      Boletín
                    </dt>
                    <dd className="mt-0.5 text-sm text-[#0d0d0d]">
                      {boletinDeProyecto ? (
                        boletinDeProyecto.url || boletinDeProyecto.filename ? (
                          <a
                            href={boletinDeProyecto.url || boletinDeProyecto.filename}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                          >
                            {formatearFecha(boletinDeProyecto.fecha_publicacion)}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : (
                          <span>{formatearFecha(boletinDeProyecto.fecha_publicacion)}</span>
                        )
                      ) : (
                        <span className="font-bold text-[#ff7e67]">Falta dato</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 lg:pt-0">
                <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Resolutivos para el expediente {proyectoSeleccionado.expediente ?? '—'}
                </h4>
                {resolutivosDeProyecto.length === 0 ? (
                  <p className="bg-white px-4 py-4 text-center font-sans text-sm uppercase tracking-widest text-gray-600">
                    Sin resolutivo emitido para este expediente
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {resolutivosDeProyecto.map((r, i) => {
                      const boletinResolutivo = boletinGlobalPorId.get(r.boletin_id);
                      const boletinResolutivoUrl = boletinResolutivo
                        ? boletinResolutivo.url || boletinResolutivo.filename
                        : null;
                      return (
                        <div key={`${r.no_oficio_resolutivo}-${i}`} className="bg-[#f3f4f0] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-sans text-sm font-bold text-[#0d0d0d]">
                                {r.no_oficio_resolutivo ?? '—'}
                              </p>
                              <p className="mt-0.5 truncate text-sm font-medium text-[#0d0d0d]">
                                {r.nombre_proyecto ?? '—'}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-gray-600">
                                {r.promovente ?? ''}
                              </p>
                            </div>
                            <span className="shrink-0 bg-white px-2 py-1 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d]">
                              {formatearFecha(r.fecha_resolutivo)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            <span className="bg-white px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-gray-700">
                              {r.tipo_estudio ?? '—'}
                            </span>
                            <span className="bg-white px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-gray-700">
                              {r.municipio ?? '—'}
                            </span>
                          </div>
                          {boletinResolutivo ? (
                            <a
                              href={boletinResolutivoUrl ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                            >
                              {boletinResolutivoUrl ? (
                                <>
                                  Boletín {formatearFecha(boletinResolutivo.fecha_publicacion)}
                                  <ExternalLink className="h-3 w-3" aria-hidden />
                                </>
                              ) : (
                                <>Boletín {formatearFecha(boletinResolutivo.fecha_publicacion)}</>
                              )}
                            </a>
                          ) : (
                            <span className="mt-3 inline-flex items-center gap-1 font-sans text-sm font-bold uppercase tracking-wider text-gray-500">
                              Boletín no encontrado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {filteredBoletines.length === 0 ? (
        <div className="bg-white p-12 text-center">
          <p className="font-sans text-sm font-bold uppercase tracking-widest text-[#0d0d0d]">
            Sin resultados con los filtros aplicados
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-4 bg-[#fccb4e] px-5 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67]"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <></>
      )}

      {/* ===== GENERALES ===== */}
      <div className="mb-4 mt-10 flex items-center gap-2 border-t border-[#f3f4f0] pt-8">
        <FolderSearch className="h-5 w-5 text-[#0d0d0d]" aria-hidden />
        <h2 className="font-sans text-2xl font-bold uppercase tracking-tighter text-[#0d0d0d]">
          Generales
        </h2>
        <span className="ml-2 hidden font-sans text-sm uppercase tracking-widest text-gray-500 sm:inline">
          panorama de todo el historial
        </span>
      </div>

      {/* KPIs Generales (filtrables) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Boletines vacíos"
          value={numero.format(vaciosGlobal.length)}
          onClick={() => toggleKpi('vacios')}
          activo={kpiActivo === 'vacios'}
        />
        <KpiCard
          label="Sin coordenadas"
          value={numero.format(proyectosSinCoordsGlobal.length)}
          onClick={() => toggleKpi('coords')}
          activo={kpiActivo === 'coords'}
        />
        <KpiCard
          label="Resolutivos sin ingreso"
          value={numero.format(desbalancesGlobal.resolutivosSinIngreso.length)}
          onClick={() => toggleKpi('resolutivos')}
          activo={kpiActivo === 'resolutivos'}
        />
        <KpiCard
          label="Ingresados sin resol. >120d"
          value={numero.format(ingresadosCriticosGlobal.length)}
          onClick={() => toggleKpi('ingresados')}
          activo={kpiActivo === 'ingresados'}
        />
      </div>

      {/* Listas de Generales */}
      {(kpiActivo === null || kpiActivo === 'vacios') && (
        <div className="mb-6">
          <ChartCard
            title="Boletines vacíos"
            action={
              <span className="bg-white px-2 py-1 font-sans text-sm font-bold text-[#0d0d0d]">
                {numero.format(vaciosGlobal.length)}
              </span>
            }
          >
            {vaciosGlobal.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Sin boletines vacíos en el historial.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {vaciosGlobal.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 bg-[#f3f4f0] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-bold text-[#0d0d0d]">ID {b.id}</p>
                      <p className="text-sm text-gray-600">{formatearFecha(b.fecha_publicacion)}</p>
                    </div>
                    {b.url && (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ver boletín ${b.id}`}
                        className="shrink-0 inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>
      )}

      {(kpiActivo === null || kpiActivo === 'coords') && (
        <div className="mb-6">
          <ChartCard
            title="Proyectos sin coordenadas o mal ingresadas"
            action={
              <span className="bg-[#ff7e67] px-2 py-1 font-sans text-sm font-bold text-white">
                {numero.format(proyectosSinCoordsGlobal.length)}
              </span>
            }
          >
            <div className="max-h-[340px] overflow-auto">
              {proyectosSinCoordsGlobal.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Todos los proyectos tienen coordenadas válidas.
                </p>
              ) : (
                <ul className="divide-y divide-black/10">
                  {proyectosSinCoordsGlobal.map((p) => (
                    <li key={`${p.expediente}-${p.boletin_id}`} className="py-2.5">
                      <button
                        type="button"
                        disabled={!p.expediente}
                        onClick={() => navegarABoletin(p.boletin_id, p.expediente || undefined)}
                        className="block w-full text-left"
                      >
                        <p className="text-sm font-bold text-[#0d0d0d]">
                          {p.expediente || 'Sin expediente'} · {p.nombre_proyecto || '—'}
                        </p>
                        <p className="truncate text-sm text-gray-600">
                          {p.promovente || '—'} · {p.municipio || '—'}
                        </p>
                        <p className="mt-1 font-sans text-sm text-gray-500">
                          Boletín {p.boletin_id} · {formatearFecha(p.fecha_publicacion)}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {(kpiActivo === null || kpiActivo === 'resolutivos') && (
        <div className="mb-6">
          <ChartCard
            title="Resolutivos sin proyecto de ingreso"
            action={
              <span className="bg-[#0a0a0a] px-2 py-1 font-sans text-sm font-bold text-white">
                {numero.format(desbalancesGlobal.resolutivosSinIngreso.length)}
              </span>
            }
          >
            <div className="max-h-[340px] overflow-auto">
              {desbalancesGlobal.resolutivosSinIngreso.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Todos los resolutivos tienen su ingreso registrado.
                </p>
              ) : (
                <ul className="divide-y divide-black/10">
                  {desbalancesGlobal.resolutivosSinIngreso.map((r) => (
                    <li
                      key={`${r.expediente}-${r.fecha_registro}`}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-bold text-[#0d0d0d]">
                          {r.expediente}
                        </p>
                        <p className="truncate text-sm text-[#0d0d0d]">
                          {r.nombre_proyecto || '—'}
                        </p>
                        <p className="truncate text-sm text-gray-600">
                          {r.promovente || '—'} · resolutivo {formatearFecha(r.fecha_registro)}
                        </p>
                      </div>
                      {r.boletin_url ? (
                        <a
                          href={r.boletin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                        >
                          Boletín <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              {desbalancesGlobal.sinExpediente.resolutivos > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  {numero.format(desbalancesGlobal.sinExpediente.resolutivos)} resolutivos sin
                  expediente (no verificables)
                </p>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {(kpiActivo === null || kpiActivo === 'ingresados') && (
        <div className="mb-6">
          <ChartCard
            title={`Ingresados sin resolutivo · más de 120 días`}
            action={
              <span className="bg-[#fccb4e] px-2 py-1 font-sans text-sm font-bold text-[#0d0d0d]">
                {numero.format(ingresadosCriticosGlobal.length)}
              </span>
            }
          >
            <div className="max-h-[340px] overflow-auto">
              {ingresadosCriticosGlobal.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Ningún proyecto sin resolutivo lleva más de 120 días desde su ingreso.
                </p>
              ) : (
                <ul className="divide-y divide-black/10">
                  {ingresadosCriticosGlobal.map(({ item, dias }) => (
                    <li
                      key={`${item.expediente}-${item.fecha_registro}`}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-sans text-sm font-bold text-[#0d0d0d]">
                          {item.expediente}
                        </p>
                        <p className="truncate text-sm text-[#0d0d0d]">
                          {item.nombre_proyecto || '—'}
                        </p>
                        <p className="truncate text-sm text-gray-600">
                          {item.promovente || '—'} · ingreso {formatearFecha(item.fecha_registro)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="bg-[#ff7e67] px-2 py-0.5 font-sans text-sm font-bold uppercase tracking-wider text-white">
                          {dias} días
                        </span>
                        {item.boletin_url ? (
                          <a
                            href={item.boletin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 border border-[#f3f4f0] bg-white px-3 py-2 font-sans text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff7e67] hover:text-[#0d0d0d]"
                          >
                            Boletín <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {desbalancesGlobal.sinExpediente.proyectos > 0 && (
                <p className="mt-3 text-sm text-gray-500">
                  {numero.format(desbalancesGlobal.sinExpediente.proyectos)} proyectos sin
                  expediente (no verificables)
                </p>
              )}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Ranking + completos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Ranking de promoventes">
          <div className="flex flex-col gap-3">
            {topPromoventes.length === 0 && (
              <p className="text-center text-sm text-gray-500">Sin datos</p>
            )}
            {topPromoventes.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setBusquedaNavegacion(p.label);
                }}
                className="group w-full text-left"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    {i === 0 && (
                      <Trophy className="h-3.5 w-3.5 shrink-0 text-[#fccb4e]" aria-hidden />
                    )}
                    <span className="truncate text-gray-700 group-hover:text-[#0d0d0d]">
                      {i + 1}. {p.label}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-[#0d0d0d]">{p.valor}</span>
                </div>
                <div className="h-2 w-full overflow-hidden bg-white">
                  <div
                    className="h-full"
                    style={{
                      width: `${(p.valor / maxPromovente) * 100}%`,
                      backgroundColor: '#fccb4e',
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Proyectos con campos completos">
          <div className="flex h-full flex-col justify-center gap-3">
            <div className="flex items-end justify-between gap-3">
              <span className="text-3xl font-bold tracking-tighter text-[#0d0d0d]">
                {Math.round(pctCompletos * 100)}%
              </span>
              <span className="font-sans text-sm uppercase tracking-widest text-gray-600">
                {numero.format(proyectosGlobal.length - proyectosFaltantesGlobal.length)} de{' '}
                {numero.format(proyectosGlobal.length)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden bg-white">
              <div
                className="h-full"
                style={{
                  width: `${Math.max(2, pctCompletos * 100)}%`,
                  backgroundColor: '#fccb4e',
                }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {numero.format(proyectosFaltantesGlobal.length)} proyectos con campos faltantes
            </p>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
