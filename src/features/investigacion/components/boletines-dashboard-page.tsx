import { useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
} from 'recharts';
import {
  FileText,
  Building2,
  CheckCircle2,
  Timer,
  BarChart3,
  Search,
  FilterX,
  Download,
  ExternalLink,
  Loader2,
  Clock,
  Trophy,
  FolderSearch,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import {
  getStats,
  getAllProyectos,
  getAllResolutivos,
  filterBoletinesV2,
  getBoletinesFueraDeTiempo,
  getProyectosConCamposFaltantes,
  getResolutivosPorExpediente,
  getDistributionByMunicipio,
  getDistributionByGiro,
  getDistributionByTipoEstudio,
  getDistributionByEstado,
  diasEntreFechas,
} from '../lib/data-utils';
import {
  obtenerAutoridad,
  obtenerTextoEstado,
  calcularEstadoCumplimiento,
} from '../lib/boletines-v2-utils';
import { getCalendarParts, formatFechaHoraLarga, formatFechaLarga } from '../lib/date-utils';
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

function descendente(
  datos: { label: string; valor: number }[],
): { label: string; valor: number }[] {
  return [...datos].sort((a, b) => b.valor - a.valor);
}

function descargarCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\uFEFF' + [headers, ...rows].map((r) => r.map(esc).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-4 border border-black bg-white p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-black bg-[#fccb4e]">
        <Icon className="h-5 w-5 text-black" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate font-mono text-[11px] font-bold uppercase tracking-widest text-black">
          {label}
        </p>
        <p className="mt-0.5 text-3xl font-bold tracking-tighter text-black">{value}</p>
        <p className="truncate font-mono text-[11px] text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  action,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col border border-black bg-white ${className}`}>
      <div className="flex items-start justify-between gap-2 border-b border-black bg-[#f3f4f0] px-5 py-4">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-black">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 font-serif text-xs text-gray-600">{subtitle}</p>}
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
      <label className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-black">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-none border border-black bg-white px-3 py-2 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
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
    <div className="border border-black bg-[#f3f4f0] px-3 py-2">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-sm ${!texto ? 'font-bold text-[#ff7e67]' : mono ? 'font-mono text-xs text-gray-800' : 'text-black'}`}
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

  const boletinesPorDia = useMemo(() => {
    const map = new Map<string, Boletin[]>();
    filteredBoletines.forEach((b) => {
      const k = getCalendarParts(b.fecha_publicacion);
      if (!k) return;
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(b.fecha_publicacion));
      if (!match) return;
      const key = `${k.year}-${k.month}-${String(parseInt(match[3], 10))}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [filteredBoletines]);

  const boletinesCreadosPorDia = useMemo(() => {
    const map = new Map<string, Boletin[]>();
    filteredBoletines.forEach((b) => {
      const fecha = b.pdf_creation_date || b.created_at;
      const k = getCalendarParts(fecha);
      if (!k) return;
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(fecha));
      if (!match) return;
      const key = `${k.year}-${k.month}-${String(parseInt(match[3], 10))}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [filteredBoletines]);

  const boletinesDiaCombinados = useMemo(() => {
    const map = new Map<string, (Boletin & { marcadoCreado: boolean })[]>();
    boletinesPorDia.forEach((publicados, key) => {
      const creados = boletinesCreadosPorDia.get(key) ?? [];
      const vistos = new Set<string>();
      const combinados = publicados.map((b) => ({ ...b, marcadoCreado: false }));
      publicados.forEach((b) => vistos.add(String(b.id)));
      creados.forEach((b) => {
        if (!vistos.has(String(b.id))) {
          vistos.add(String(b.id));
          combinados.push({ ...b, marcadoCreado: true });
        }
      });
      map.set(key, combinados);
    });
    return map;
  }, [boletinesPorDia, boletinesCreadosPorDia]);

  const boletinesDiaElegidos = calDiaSel ? (boletinesDiaCombinados.get(calDiaSel) ?? null) : null;

  const boletinesEnAlcance = useMemo(
    () => boletinesDiaElegidos ?? filteredBoletines,
    [boletinesDiaElegidos, filteredBoletines],
  );

  const filteredData = useMemo(() => ({ boletines: boletinesEnAlcance }), [boletinesEnAlcance]);

  const stats = useMemo(() => getStats(filteredData), [filteredData]);
  const proyectos = useMemo(() => getAllProyectos(filteredData), [filteredData]);
  const resolutivos = useMemo(() => getAllResolutivos(filteredData), [filteredData]);

  const boletinesFueraDeTiempo = useMemo(
    () => getBoletinesFueraDeTiempo(filteredData),
    [filteredData],
  );
  const boletinesFueraDeTiempoBase = useMemo(
    () => getBoletinesFueraDeTiempo({ boletines: filteredBoletines }),
    [filteredBoletines],
  );
  const tiempoPromedioResolucion = useMemo(() => {
    const dias: number[] = [];
    resolutivos.forEach((r) => {
      const d = diasEntreFechas(r.fecha_ingreso, r.fecha_resolutivo);
      if (d != null && d >= 0) dias.push(d);
    });
    if (dias.length === 0) return 0;
    return dias.reduce((s, d) => s + d, 0) / dias.length;
  }, [resolutivos]);
  const tiempoResolucionPorAño = useMemo(() => {
    const map = new Map<string, number[]>();
    resolutivos.forEach((r) => {
      const año = getCalendarParts(r.fecha_resolutivo)?.year;
      const d = diasEntreFechas(r.fecha_ingreso, r.fecha_resolutivo);
      if (!año || d == null || d < 0) return;
      if (!map.has(año)) map.set(año, []);
      map.get(año)!.push(d);
    });
    return [...map.entries()]
      .map(([año, lista]) => ({
        año,
        promedio: lista.reduce((s, d) => s + d, 0) / lista.length,
        resoluciones: lista.length,
      }))
      .sort((a, b) => Number(a.año) - Number(b.año));
  }, [resolutivos]);
  const fueraDeTiempoPorAño = useMemo(() => {
    const map = new Map<string, number>();
    boletinesFueraDeTiempo.forEach((b) => {
      const año = getCalendarParts(b.fecha_publicacion)?.year;
      if (año) map.set(año, (map.get(año) || 0) + 1);
    });
    return [...map.entries()]
      .map(([año, count]) => ({ año, count }))
      .sort((a, b) => Number(a.año) - Number(b.año));
  }, [boletinesFueraDeTiempo]);
  const proyectosFaltantes = useMemo(
    () => getProyectosConCamposFaltantes(filteredData),
    [filteredData],
  );
  const serieMensual = useMemo(() => {
    const map = new Map<string, { label: string; proyectos: number; resolutivos: number }>();
    boletinesEnAlcance.forEach((b) => {
      const k = getCalendarParts(b.fecha_publicacion);
      if (!k) return;
      const key = `${k.year}-${k.month}`;
      const cur = map.get(key) ?? {
        label: `${MESES[Number(k.month) - 1].slice(0, 3)} ${k.year}`,
        proyectos: 0,
        resolutivos: 0,
      };
      cur.proyectos += b.cantidad_ingresados ?? 0;
      cur.resolutivos += b.cantidad_resolutivos ?? 0;
      map.set(key, cur);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v);
  }, [boletinesEnAlcance]);
  const distMunicipio = useMemo(
    () =>
      getDistributionByMunicipio(filteredData)
        .slice(0, 8)
        .map((d) => ({ label: d.municipio, valor: d.count })),
    [filteredData],
  );
  const distGiro = useMemo(
    () =>
      getDistributionByGiro(filteredData)
        .slice(0, 8)
        .map((d) => ({ label: d.giro, valor: d.count })),
    [filteredData],
  );
  const distTipo = useMemo(
    () =>
      getDistributionByTipoEstudio(filteredData)
        .slice(0, 8)
        .map((d) => ({ label: d.tipo, valor: d.count })),
    [filteredData],
  );
  const distEstado = useMemo(() => getDistributionByEstado(filteredData), [filteredData]);
  const pctATiempo =
    stats.totalBoletines > 0
      ? (stats.totalBoletines - boletinesFueraDeTiempo.length) / stats.totalBoletines
      : 0;
  const pctCompletos = proyectos.length > 0 ? 1 - proyectosFaltantes.length / proyectos.length : 0;
  const conResolutivo = distEstado.find((e) => e.estado === 'con_resolutivo')?.count ?? 0;
  const pctResueltos = stats.totalBoletines > 0 ? conResolutivo / stats.totalBoletines : 0;
  const proyectoSeleccionado = useMemo(
    () => proyectos.find((p) => (p.expediente ?? '') === selectedExpediente),
    [proyectos, selectedExpediente],
  );
  const resolutivosDeProyecto = useMemo(
    () => (selectedExpediente ? getResolutivosPorExpediente(filteredData, selectedExpediente) : []),
    [filteredData, selectedExpediente],
  );

  const boletinPorId = useMemo(
    () => new Map(boletinesEnAlcance.map((b) => [b.id, b])),
    [boletinesEnAlcance],
  );
  const boletinDeProyecto = useMemo(
    () => (proyectoSeleccionado ? boletinPorId.get(proyectoSeleccionado.boletin_id) : undefined),
    [proyectoSeleccionado, boletinPorId],
  );

  const fueraDeTiempoIds = useMemo(
    () => new Set(boletinesFueraDeTiempoBase.map((b) => b.id)),
    [boletinesFueraDeTiempoBase],
  );

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
    boletinesEnAlcance.forEach((b) => {
      (b.proyectos_ingresados || []).forEach((p) => {
        const key = p.promovente?.trim();
        if (key) map.set(key, (map.get(key) || 0) + 1);
      });
    });
    return descendente([...map.entries()].map(([label, valor]) => ({ label, valor }))).slice(0, 8);
  }, [boletinesEnAlcance]);

  const maxPromovente = useMemo(
    () => Math.max(1, ...topPromoventes.map((p) => p.valor)),
    [topPromoventes],
  );

  const rangoFechas = useMemo(() => {
    if (allBoletines.length === 0) return '—';
    const fechas = allBoletines
      .map((b) => b.fecha_publicacion)
      .filter(Boolean)
      .sort();
    if (fechas.length === 0) return '—';
    return `${formatearFecha(fechas[0])} – ${formatearFecha(fechas[fechas.length - 1])}`;
  }, [allBoletines]);

  const limpiarFiltros = () => {
    setFilters(DEFAULT_FILTERS);
    setCalDiaSel(null);
  };

  const filtrosActivos = () => {
    const count = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length;
    return count + (filters.search ? 1 : 0) + (calDiaSel ? 1 : 0);
  };

  const exportarProyectos = () => {
    descargarCsv(
      `boletines_proyectos_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Expediente',
        'Proyecto',
        'Promovente',
        'Tipo de estudio',
        'Giro',
        'Municipio',
        'Fecha de ingreso',
        'Fecha de boletín',
        'URL',
      ],
      proyectos.map((p) => [
        p.expediente ?? '',
        p.nombre_proyecto ?? '',
        p.promovente ?? '',
        p.tipo_estudio ?? '',
        p.giro ?? '',
        p.municipio ?? '',
        p.fecha_ingreso ?? '',
        p.fecha_publicacion ?? '',
        p.boletin_url ?? '',
      ]),
    );
  };

  const exportarResolutivos = () => {
    descargarCsv(
      `boletines_resolutivos_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'No. Oficio',
        'Expediente',
        'Proyecto',
        'Promovente',
        'Tipo de estudio',
        'Municipio',
        'Fecha de ingreso',
        'Fecha de resolutivo',
        'URL',
      ],
      resolutivos.map((r) => [
        r.no_oficio_resolutivo ?? '',
        r.expediente ?? '',
        r.nombre_proyecto ?? '',
        r.promovente ?? '',
        r.tipo_estudio ?? '',
        r.municipio ?? '',
        r.fecha_ingreso ?? '',
        r.fecha_resolutivo ?? '',
        r.boletin_url ?? '',
      ]),
    );
  };

  const exportarBoletines = () => {
    descargarCsv(
      `boletines_lista_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Fecha', 'Autoridad', 'Ingresados', 'Resolutivos', 'Estado', 'URL'],
      boletinesEnAlcance.map((b) => [
        b.id,
        b.fecha_publicacion ?? '',
        obtenerAutoridad(b),
        b.cantidad_ingresados ?? 0,
        b.cantidad_resolutivos ?? 0,
        obtenerTextoEstado(calcularEstadoCumplimiento(b)),
        b.url ?? b.filename ?? '',
      ]),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-black" aria-hidden />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-600">Cargando datos…</p>
      </div>
    );
  }

  if (error || !data || !processedData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold tracking-tighter text-black">
          No se pudieron cargar los datos
        </h2>
        <p className="mt-2 text-sm text-gray-600">{error ?? 'No hay datos disponibles.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 border-2 border-black bg-[#fccb4e] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7e67]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const filterOptions = [
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
  ];

  const setFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const toggleAño = (año: string | number) => {
    const v = String(año);
    setFilter('año', filters.año === v ? 'all' : v);
  };

  const añoActivo = (año: string | number) => filters.año === String(año);

  const toggleBusqueda = (valor: string) => {
    const v = (valor ?? '').trim();
    if (!v) return;
    setFilter('search', filters.search.trim().toLowerCase() === v.toLowerCase() ? '' : v);
  };

  const busquedaActiva = (valor: string) => {
    const v = (valor ?? '').trim().toLowerCase();
    return v !== '' && filters.search.trim().toLowerCase() === v;
  };

  const toggleMunicipio = (v: string) =>
    setFilter('municipio', filters.municipio === v ? 'all' : v);
  const municipioActivo = (v: string) => filters.municipio === v;
  const toggleGiro = (v: string) => setFilter('giro', filters.giro === v ? 'all' : v);
  const giroActivo = (v: string) => filters.giro === v;
  const toggleTipo = (v: string) => setFilter('tipo', filters.tipo === v ? 'all' : v);
  const tipoActivo = (v: string) => filters.tipo === v;

  const calMostrado = (() => {
    if (calNavegado) return calFecha;
    const k = allBoletines[0] ? getCalendarParts(allBoletines[0].fecha_publicacion) : null;
    return k ? { year: Number(k.year), month: Number(k.month) } : calFecha;
  })();
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
      return {
        dia,
        key,
        boletines: boletinesPorDia.get(key) ?? [],
        creados: boletinesCreadosPorDia.get(key) ?? [],
      };
    });
  })();
  const boletinesDiaSelCombinados = calDiaSel ? (boletinesDiaCombinados.get(calDiaSel) ?? []) : [];
  const totalMes = celdasCalendario.reduce((s, c) => s + (c ? c.boletines.length : 0), 0);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-10">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-black bg-black px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            SSMAA · Monitor Ambiental
          </div>
          <h1 className="text-3xl font-bold uppercase tracking-tighter text-black sm:text-4xl">
            Panel de análisis · Boletines Ambientales
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-gray-600">
            {rangoFechas}
            {processedData.metadata.lastSync
              ? ` · Última sincronización: ${formatFechaHoraLarga(processedData.metadata.lastSync)}`
              : ''}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 border border-black bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="xl:col-span-2">
              <label className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-widest text-black">
                Búsqueda
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                  aria-hidden
                />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  placeholder="Proyecto, expediente, municipio…"
                  className="w-full rounded-none border border-black bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
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
          <div className="flex items-end justify-end border-t border-black pt-4 lg:w-56 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-3">
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              disabled={filtrosActivos() === 0}
              className="inline-flex w-full items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7e67] disabled:opacity-40 lg:w-auto"
            >
              <FilterX className="h-4 w-4" aria-hidden />
              Limpiar filtros {filtrosActivos() > 0 ? `(${filtrosActivos()})` : ''}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          icon={FileText}
          label="Boletines"
          value={numero.format(stats.totalBoletines)}
          sub="publicados en el periodo"
        />
        <KpiCard
          icon={Building2}
          label="Proyectos"
          value={numero.format(stats.totalProyectos)}
          sub="de impacto ingresados"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Resolutivos"
          value={numero.format(stats.totalResolutivos)}
          sub="emitidos por la autoridad"
        />
        <KpiCard
          icon={Clock}
          label="Fuera de tiempo"
          value={numero.format(boletinesFueraDeTiempo.length)}
          sub="publicados con retraso"
        />
        <KpiCard
          icon={Timer}
          label="Tiempo promedio"
          value={`${tiempoPromedioResolucion.toFixed(1)} d`}
          sub="entre ingreso y resolución"
        />
      </div>

      {/* Calendario de boletines */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Calendario de boletines"
          subtitle="Amarillo: publicados · Rojo: creados, en la selección actual"
          action={
            <span className="border border-black bg-[#fccb4e] px-2 py-1 font-mono text-[11px] font-bold text-black">
              {numero.format(totalMes)} este mes
            </span>
          }
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moverMes(-1)}
              className="inline-flex h-8 w-8 items-center justify-center border border-black bg-white text-black transition-colors hover:bg-[#fccb4e]"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="text-center">
              <p className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                {MESES[calFecha.month - 1]} {calFecha.year}
              </p>
              <button
                type="button"
                onClick={irAlMesActual}
                className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-black underline decoration-2 underline-offset-2 decoration-[#ff7e67] hover:text-[#ff7e67]"
              >
                Mes actual
              </button>
            </div>
            <button
              type="button"
              onClick={() => moverMes(1)}
              className="inline-flex h-8 w-8 items-center justify-center border border-black bg-white text-black transition-colors hover:bg-[#fccb4e]"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="pb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-black"
              >
                {d}
              </div>
            ))}
            {celdasCalendario.map((celda, i) =>
              celda === null ? (
                <div
                  key={`blank-${i}`}
                  className="min-h-[42px] border border-black bg-[#e8e9e2]/60"
                />
              ) : celda.boletines.length === 0 && celda.creados.length === 0 ? (
                <div
                  key={celda.key}
                  className="flex min-h-[42px] items-center justify-center border border-black bg-white text-sm text-gray-400"
                >
                  {celda.dia}
                </div>
              ) : (
                <button
                  key={celda.key}
                  type="button"
                  onClick={() => {
                    setCalDiaSel(calDiaSel === celda.key ? null : celda.key);
                  }}
                  aria-label={`Día ${celda.dia}: ${celda.boletines.length} publicados, ${celda.creados.length} creados`}
                  className={`flex min-h-[42px] flex-col items-center justify-center gap-0.5 border text-sm font-bold transition-colors ${
                    calDiaSel === celda.key
                      ? 'border-black bg-black text-[#fccb4e]'
                      : celda.boletines.length === 0
                        ? 'border-black bg-[#ff7e67] text-white hover:bg-[#ff7e67]/80'
                        : 'border-black bg-[#fccb4e] text-black hover:bg-[#fccb4e]/80'
                  }`}
                >
                  {celda.dia}
                  <span className="flex items-center gap-1">
                    {celda.boletines.length > 0 && (
                      <span
                        className={`border px-1 text-[9px] font-bold leading-3 ${calDiaSel === celda.key ? 'border-white bg-[#fccb4e] text-black' : 'border-black bg-black text-[#fccb4e]'}`}
                      >
                        {celda.boletines.length}
                      </span>
                    )}
                    {celda.creados.length > 0 && (
                      <span
                        className={`border px-1 text-[9px] font-bold leading-3 ${calDiaSel === celda.key ? 'border-[#ff7e67] bg-white text-black' : 'border-black bg-[#ff7e67] text-white'}`}
                      >
                        {celda.creados.length}
                      </span>
                    )}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-widest text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-black bg-[#fccb4e]" />
              Publicados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 border border-black bg-[#ff7e67]" />
              Creados
            </span>
          </div>
        </ChartCard>

        <ChartCard
          title={
            calDiaSel ? `Boletines del ${calDiaSel.split('-').join('/')}` : 'Boletines del día'
          }
          subtitle="Selecciona un día marcado en el calendario"
          action={
            calDiaSel && (
              <span
                className={`border border-black px-2 py-1 font-mono text-[11px] font-bold ${boletinesDiaSelCombinados.length > 0 ? 'bg-[#fccb4e] text-black' : 'bg-white text-gray-500'}`}
              >
                {boletinesDiaSelCombinados.length > 0
                  ? numero.format(boletinesDiaSelCombinados.length)
                  : '0'}
              </span>
            )
          }
        >
          <div className="max-h-[300px] overflow-auto">
            {!calDiaSel ? (
              <p className="flex h-[260px] flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                <CalendarDays className="h-6 w-6 text-gray-400" aria-hidden />
                Elige un día con boletines para ver el detalle.
              </p>
            ) : boletinesDiaSelCombinados.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                Sin boletines este día en la selección actual.
              </p>
            ) : (
              <ul className="divide-y divide-black/10">
                {boletinesDiaSelCombinados.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-1 px-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-black">
                        Boletín ID {b.id} · {b.año} · {b.mes}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">{obtenerAutoridad(b)}</p>
                      {b.pdf_creation_date && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          Creado el {formatFechaLarga(b.pdf_creation_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {b.marcadoCreado && (
                        <span className="border border-black bg-[#ff7e67] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                          Creado
                        </span>
                      )}
                      {fueraDeTiempoIds.has(b.id) && (
                        <span className="border border-black bg-[#fccb4e] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
                          Fuera de tiempo
                        </span>
                      )}
                      {b.url && (
                        <a
                          href={b.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-black underline decoration-2 underline-offset-2 decoration-[#ff7e67] hover:text-[#ff7e67]"
                        >
                          Ver <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ChartCard>
      </div>

      {filteredBoletines.length === 0 ? (
        <div className="border border-dashed border-black bg-white p-12 text-center">
          <p className="font-mono text-sm font-bold uppercase tracking-widest text-black">
            Sin resultados con los filtros aplicados
          </p>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="mt-4 border-2 border-black bg-[#fccb4e] px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#ff7e67]"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          {/* Evolución + cumplimiento */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title="Evolución de proyectos y resolutivos"
              subtitle="Ingresados y emitidos por mes de publicación"
              className="lg:col-span-2"
            >
              <div className="flex h-[300px] w-full flex-col">
                <div className="mb-2 flex items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-widest text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 border border-black bg-[#fccb4e]" />
                    Proyectos
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 border border-black bg-[#ff7e67]" />
                    Resolutivos
                  </span>
                </div>
                <div className="relative h-[250px] w-full">
                  {serieMensual.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-gray-500">
                      Sin datos en la selección
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={serieMensual}
                        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#000" strokeOpacity={0.12} vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 11, fill: '#000' }}
                          tickLine={false}
                          axisLine={{ stroke: '#000', strokeWidth: 2 }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#000' }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                          contentStyle={{ borderRadius: 0, border: '1px solid #000' }}
                        />
                        <Bar
                          dataKey="proyectos"
                          name="Proyectos"
                          fill="#fccb4e"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={18}
                        />
                        <Bar
                          dataKey="resolutivos"
                          name="Resolutivos"
                          fill="#ff7e67"
                          radius={[0, 0, 0, 0]}
                          maxBarSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Cumplimiento" subtitle="Boletines por estado de resolución">
              <div className="flex h-[300px] w-full flex-col items-center justify-center gap-4">
                {distEstado.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin datos</p>
                ) : (
                  <>
                    <div className="relative h-[170px] w-[170px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distEstado}
                            dataKey="count"
                            nameKey="nombre"
                            innerRadius={54}
                            outerRadius={80}
                            stroke="#000"
                            strokeWidth={2}
                            paddingAngle={2}
                          >
                            {distEstado.map((e) => (
                              <Cell key={e.estado} fill={e.color} cursor="pointer" />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(v, name) => [String(v), name as string]}
                            contentStyle={{ borderRadius: 0, border: '1px solid #000' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold tracking-tighter text-black">
                          {numero.format(stats.totalBoletines)}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
                          boletines
                        </span>
                      </div>
                    </div>
                    <ul className="w-full space-y-1.5">
                      {distEstado.map((e) => (
                        <li
                          key={e.estado}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 border border-black"
                              style={{ backgroundColor: e.color }}
                            />
                            <span className="truncate text-gray-700">{e.nombre}</span>
                          </span>
                          <span className="shrink-0 font-bold text-black">
                            {numero.format(e.count)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Gráficas 2 */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title="Tiempo promedio de resolución"
              subtitle="Clic en una barra para filtrar por año"
            >
              <div className="h-[280px] w-full">
                {tiempoResolucionPorAño.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">
                    Sin resolutivos en la selección
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tiempoResolucionPorAño}
                      margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#000" strokeOpacity={0.12} vertical={false} />
                      <XAxis
                        dataKey="año"
                        tick={{ fontSize: 12, fill: '#000' }}
                        tickLine={false}
                        axisLine={{ stroke: '#000', strokeWidth: 2 }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#000' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                        formatter={(v, name) =>
                          name === 'Días promedio'
                            ? [`${Number(v).toFixed(1)} días`, 'Tiempo promedio']
                            : [String(v), name as string]
                        }
                      />
                      <Bar
                        dataKey="promedio"
                        name="Días promedio"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={36}
                        onClick={(data) => toggleAño(data?.payload?.año ?? '')}
                      >
                        {tiempoResolucionPorAño.map((d) => (
                          <Cell
                            key={d.año}
                            fill={añoActivo(d.año) ? '#0a0a0a' : '#fccb4e'}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard
              title="Proyectos por municipio"
              subtitle="Clic en una barra para filtrar por municipio"
            >
              <div className="h-[280px] w-full">
                {distMunicipio.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">
                    Sin datos
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={distMunicipio}
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#000" strokeOpacity={0.12} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#000' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={96}
                        tick={{ fontSize: 10, fill: '#000' }}
                        tickLine={false}
                        axisLine={{ stroke: '#000', strokeWidth: 2 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                        formatter={(v, name) => [`${v} proyectos`, name as string]}
                      />
                      <Bar
                        dataKey="valor"
                        name="Proyectos"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={14}
                        onClick={(data) => toggleMunicipio(data?.payload?.label ?? '')}
                      >
                        {distMunicipio.map((d) => (
                          <Cell
                            key={d.label}
                            fill={municipioActivo(d.label) ? '#0a0a0a' : '#fccb4e'}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard
              title="Proyectos por giro"
              subtitle="Clic en una barra para filtrar por giro"
            >
              <div className="h-[280px] w-full">
                {distGiro.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">
                    Sin datos
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={distGiro}
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#000" strokeOpacity={0.12} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#000' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={96}
                        tick={{ fontSize: 10, fill: '#000' }}
                        tickLine={false}
                        axisLine={{ stroke: '#000', strokeWidth: 2 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                        formatter={(v, name) => [`${v} proyectos`, name as string]}
                      />
                      <Bar
                        dataKey="valor"
                        name="Proyectos"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={14}
                        onClick={(data) => toggleGiro(data?.payload?.label ?? '')}
                      >
                        {distGiro.map((d) => (
                          <Cell
                            key={d.label}
                            fill={giroActivo(d.label) ? '#0a0a0a' : '#fccb4e'}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Gráficas 3 */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard
              title="Boletines fuera de tiempo"
              subtitle="Clic en una barra para filtrar por año"
            >
              <div className="h-[280px] w-full">
                {fueraDeTiempoPorAño.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">
                    Sin retrasos en la selección
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fueraDeTiempoPorAño}
                      margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#000" strokeOpacity={0.12} vertical={false} />
                      <XAxis
                        dataKey="año"
                        tick={{ fontSize: 12, fill: '#000' }}
                        tickLine={false}
                        axisLine={{ stroke: '#000', strokeWidth: 2 }}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#000' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                        formatter={(v, name) =>
                          name === 'Fuera de tiempo'
                            ? [`${v} boletines`, 'Fuera de tiempo']
                            : [String(v), name as string]
                        }
                      />
                      <Bar
                        dataKey="count"
                        name="Fuera de tiempo"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={36}
                        onClick={(data) => toggleAño(data?.payload?.año ?? '')}
                      >
                        {fueraDeTiempoPorAño.map((d) => (
                          <Cell
                            key={d.año}
                            fill={añoActivo(d.año) ? '#0a0a0a' : '#ff7e67'}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard
              title="Top promoventes"
              subtitle="Clic en un promovente para filtrar sus proyectos"
            >
              <div className="flex h-[280px] w-full flex-col justify-center gap-3">
                {topPromoventes.length === 0 && (
                  <p className="text-center text-sm text-gray-500">Sin datos</p>
                )}
                {topPromoventes.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => toggleBusqueda(p.label)}
                    className="group w-full text-left"
                    aria-pressed={busquedaActiva(p.label)}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`flex min-w-0 items-center gap-1.5 ${busquedaActiva(p.label) ? 'font-bold text-black' : ''}`}
                      >
                        {i === 0 && (
                          <Trophy className="h-3.5 w-3.5 shrink-0 text-[#fccb4e]" aria-hidden />
                        )}
                        <span
                          className={`truncate ${busquedaActiva(p.label) ? '' : 'text-gray-700 group-hover:text-black'}`}
                        >
                          {i + 1}. {p.label}
                        </span>
                      </span>
                      <span className="shrink-0 font-bold text-black">{p.valor}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden border border-black bg-white">
                      <div
                        className="h-full"
                        style={{
                          width: `${(p.valor / maxPromovente) * 100}%`,
                          backgroundColor: busquedaActiva(p.label) ? '#0a0a0a' : '#fccb4e',
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Proyectos por tipo de estudio"
              subtitle="Clic en una barra para filtrar por tipo"
            >
              <div className="h-[280px] w-full">
                {distTipo.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-gray-500">
                    Sin datos
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={distTipo}
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid stroke="#000" strokeOpacity={0.12} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: '#000' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={96}
                        tick={{ fontSize: 10, fill: '#000' }}
                        tickLine={false}
                        axisLine={{ stroke: '#000', strokeWidth: 2 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.08)' }}
                        formatter={(v, name) => [`${v} proyectos`, name as string]}
                      />
                      <Bar
                        dataKey="valor"
                        name="Proyectos"
                        radius={[0, 0, 0, 0]}
                        maxBarSize={14}
                        onClick={(data) => toggleTipo(data?.payload?.label ?? '')}
                      >
                        {distTipo.map((d) => (
                          <Cell
                            key={d.label}
                            fill={tipoActivo(d.label) ? '#0a0a0a' : '#ff7e67'}
                            cursor="pointer"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Calidad de los datos */}
          <div className="mb-6 border-t border-black pt-6">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#fccb4e]" aria-hidden />
              <h2 className="text-xl font-bold uppercase tracking-tighter text-black">
                Calidad de los boletines
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ChartCard
                title="Publicados a tiempo"
                subtitle="Registrados dentro de la fecha oficial"
              >
                <div className="flex h-full flex-col justify-center gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-3xl font-bold tracking-tighter text-black">
                      {Math.round(pctATiempo * 100)}%
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-gray-600">
                      {numero.format(stats.totalBoletines - boletinesFueraDeTiempo.length)} de{' '}
                      {numero.format(stats.totalBoletines)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden border border-black bg-white">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(2, pctATiempo * 100)}%`,
                        backgroundColor: '#fccb4e',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {numero.format(boletinesFueraDeTiempo.length)} boletines fuera de tiempo
                  </p>
                </div>
              </ChartCard>

              <ChartCard
                title="Proyectos con campos completos"
                subtitle="Sin campos obligatorios faltantes"
              >
                <div className="flex h-full flex-col justify-center gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-3xl font-bold tracking-tighter text-black">
                      {Math.round(pctCompletos * 100)}%
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-gray-600">
                      {numero.format(proyectos.length - proyectosFaltantes.length)} de{' '}
                      {numero.format(proyectos.length)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden border border-black bg-white">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(2, pctCompletos * 100)}%`,
                        backgroundColor: '#fccb4e',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {numero.format(proyectosFaltantes.length)} proyectos con campos faltantes
                  </p>
                </div>
              </ChartCard>

              <ChartCard
                title="Expedientes con resolutivo"
                subtitle="Del total de proyectos ingresados"
              >
                <div className="flex h-full flex-col justify-center gap-3">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-3xl font-bold tracking-tighter text-black">
                      {Math.round(pctResueltos * 100)}%
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-gray-600">
                      {numero.format(conResolutivo)} de {numero.format(stats.totalBoletines)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden border border-black bg-white">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.max(2, pctResueltos * 100)}%`,
                        backgroundColor: '#fccb4e',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {numero.format(resolutivos.length)} resolutivos emitidos
                  </p>
                </div>
              </ChartCard>
            </div>
          </div>

          {/* Detalle de proyecto y su resolutivo */}
          <div ref={detalleRef} className="mb-6 scroll-mt-24">
            <ChartCard
              title="Detalle de proyecto y su resolutivo"
              subtitle="Selecciona un proyecto para revisar sus datos y la resolución emitida"
              action={
                <span className="border border-black bg-[#f3f4f0] px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-gray-700">
                  {selectedExpediente
                    ? proyectoSeleccionado
                      ? '1 seleccionado'
                      : 'sin match'
                    : 'elegir uno'}
                </span>
              }
            >
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <FolderSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    aria-hidden
                  />
                  <select
                    value={selectedExpediente}
                    onChange={(e) => setSelectedExpediente(e.target.value)}
                    className="w-full rounded-none border border-black bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Selecciona un proyecto del periodo filtrado…</option>
                    {proyectos.map((p) => (
                      <option key={`${p.expediente}-${p.nombre_proyecto}`} value={p.expediente}>
                        {p.expediente ?? 'Sin expediente'} · {p.promovente ?? '—'} ·{' '}
                        {p.nombre_proyecto ?? '—'}
                      </option>
                    ))}
                  </select>
                </div>

                {!proyectoSeleccionado ? (
                  <p className="py-6 text-center font-mono text-xs uppercase tracking-widest text-gray-600">
                    Selecciona un proyecto para ver sus datos completos y el resolutivo asociado.
                  </p>
                ) : (
                  <>
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Dato label="Expediente" valor={proyectoSeleccionado.expediente} mono />
                      <Dato label="Proyecto" valor={proyectoSeleccionado.nombre_proyecto} />
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
                      <div className="border border-black bg-[#f3f4f0] px-3 py-2">
                        <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          Boletín
                        </dt>
                        <dd className="mt-0.5 text-sm text-black">
                          {boletinDeProyecto ? (
                            boletinDeProyecto.url || boletinDeProyecto.filename ? (
                              <a
                                href={boletinDeProyecto.url || boletinDeProyecto.filename}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-black underline decoration-2 underline-offset-2 decoration-[#ff7e67] hover:text-[#ff7e67]"
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

                    <div className="border-t border-black pt-4">
                      <h4 className="mb-2 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest text-black">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        Resolutivos para el expediente {proyectoSeleccionado.expediente ?? '—'}
                      </h4>
                      {resolutivosDeProyecto.length === 0 ? (
                        <p className="border border-dashed border-black bg-white px-4 py-4 text-center font-mono text-xs uppercase tracking-widest text-gray-600">
                          Sin resolutivo emitido para este expediente
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          {resolutivosDeProyecto.map((r, i) => {
                            const boletinResolutivo = boletinPorId.get(r.boletin_id);
                            const boletinResolutivoUrl = boletinResolutivo
                              ? boletinResolutivo.url || boletinResolutivo.filename
                              : null;
                            return (
                              <div
                                key={`${r.no_oficio_resolutivo}-${i}`}
                                className="border border-black bg-[#f3f4f0] p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="font-mono text-sm font-bold text-black">
                                      {r.no_oficio_resolutivo ?? '—'}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm font-medium text-black">
                                      {r.nombre_proyecto ?? '—'}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-gray-600">
                                      {r.promovente ?? ''}
                                    </p>
                                  </div>
                                  <span className="shrink-0 border border-black bg-white px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-black">
                                    {formatearFecha(r.fecha_resolutivo)}
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1">
                                  <span className="border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                    {r.tipo_estudio ?? '—'}
                                  </span>
                                  <span className="border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                    {r.municipio ?? '—'}
                                  </span>
                                </div>
                                {boletinResolutivoUrl ? (
                                  <a
                                    href={boletinResolutivoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-black underline decoration-2 underline-offset-2 decoration-[#ff7e67] hover:text-[#ff7e67]"
                                  >
                                    Ver boletín original{' '}
                                    <ExternalLink className="h-3 w-3" aria-hidden />
                                  </a>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Exportar datos */}
          <div className="mb-6 border-t border-black pt-6">
            <div className="mb-3 flex items-center gap-2">
              <Download className="h-4 w-4 text-[#fccb4e]" aria-hidden />
              <h2 className="text-xl font-bold uppercase tracking-tighter text-black">
                Exportar datos
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={exportarProyectos}
                className="group border border-black bg-white p-4 text-left transition-colors hover:bg-[#fccb4e]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    CSV
                  </span>
                  <Download
                    className="h-4 w-4 text-black transition-transform group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-lg font-bold tracking-tight text-black">Proyectos</p>
                <p className="text-xs text-gray-600">{numero.format(proyectos.length)} registros</p>
              </button>

              <button
                type="button"
                onClick={exportarResolutivos}
                className="group border border-black bg-white p-4 text-left transition-colors hover:bg-[#fccb4e]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    CSV
                  </span>
                  <Download
                    className="h-4 w-4 text-black transition-transform group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-lg font-bold tracking-tight text-black">Resolutivos</p>
                <p className="text-xs text-gray-600">
                  {numero.format(resolutivos.length)} registros
                </p>
              </button>

              <button
                type="button"
                onClick={exportarBoletines}
                className="group border border-black bg-white p-4 text-left transition-colors hover:bg-[#fccb4e]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-600">
                    CSV
                  </span>
                  <Download
                    className="h-4 w-4 text-black transition-transform group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-lg font-bold tracking-tight text-black">Boletines</p>
                <p className="text-xs text-gray-600">
                  {numero.format(boletinesEnAlcance.length)} registros
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
