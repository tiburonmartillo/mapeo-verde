import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowDown, MapPin, TreePine, AlertCircle, Camera, X, Plus, FileText, LayoutGrid, List, Search, Mail, MessageCircle, Eye, ChevronLeft, ChevronRight, Calendar, Download, ExternalLink } from 'lucide-react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { LogoMap } from './components/LogoMap';

export const DataContext = React.createContext({
  greenAreas: [],
  projects: [],
  gazettes: [],
  events: [],
  pastEvents: [],
  refresh: () => {},
  loading: true
});

const TAB_ROUTES = {
  HOME: '/',
  AGENDA: '/agenda',
  GREEN_AREAS: '/areas-verdes',
  NEWSLETTERS: '/boletines',
  GAZETTES: '/gacetas',
  PARTICIPATION: '/participacion'
};

const pathToTab = (pathname) => {
  if (pathname.startsWith('/agenda')) return 'AGENDA';
  if (pathname.startsWith('/areas-verdes')) return 'GREEN_AREAS';
  if (pathname.startsWith('/boletines')) return 'NEWSLETTERS';
  if (pathname.startsWith('/gacetas')) return 'GAZETTES';
  if (pathname.startsWith('/participacion')) return 'PARTICIPATION';
  return 'HOME';
};

const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    greenAreas: [],
    projects: [],
    gazettes: [],
    events: [],
    pastEvents: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const fetchLocalJSON = async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    const [boletinesSource, gacetasSource] = await Promise.all([
      fetchLocalJSON('/data/boletines.json'),
      fetchLocalJSON('/data/gacetas_semarnat_analizadas.json')
    ]);

    const projects = mapBoletinesToProjects(boletinesSource);
    const gazettes = mapGacetasToDataset(gacetasSource);

    setData({
      greenAreas: GREEN_AREAS_DATA,
      projects: projects.length ? projects : GAZETTES_DATA,
      gazettes: gazettes.length ? gazettes : GAZETTES_DATA,
      events: EVENTS_DATA,
      pastEvents: PAST_EVENTS_DATA
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ ...data, refresh: fetchData, loading }}>
      {children}
    </DataContext.Provider>
  );
};

// --- Assets & Data ---
// Placeholder images from Unsplash source or similar for the cards
const MOCK_IMAGES = {
  sanMarcos: "https://images.unsplash.com/photo-1596276122653-651a3898309f?q=80&w=1000&auto=format&fit=crop",
  tresCenturias: "https://images.unsplash.com/photo-1555899434-94d1368b7af6?q=80&w=1000&auto=format&fit=crop",
  rodolfoLanderos: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop",
  lineaVerde: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop"
};

// Mappers to transform external JSON datasets into the UI-friendly shape
const mapBoletinesToProjects = (boletinesSource) => {
  const boletines = boletinesSource?.boletines ?? [];
  return boletines.flatMap((b) =>
    (b.proyectos_ingresados ?? []).map((p) => ({
      id: `${b.id}-${p.numero ?? '0'}`,
      project: p.nombre_proyecto ?? 'Proyecto sin nombre',
      promoter: p.promovente ?? 'Promovente no especificado',
      type: p.tipo_estudio ?? 'Sin tipo',
      date: p.fecha_ingreso ?? b.fecha_publicacion ?? '2025-01-01',
      year: (p.fecha_ingreso ?? b.fecha_publicacion ?? '2025').toString().slice(0, 4),
      status: 'Ingreso',
      lat: p.coordenadas_x ?? 21.8853,
      lng: p.coordenadas_y ?? -102.2916,
      description: p.naturaleza_proyecto ?? '',
      impact: p.giro ?? ''
    }))
  );
};

const mapGacetasToDataset = (gacetasSource) => {
  const analyses = gacetasSource?.analyses ?? [];
  const items = [];
  analyses.forEach((a, idx) => {
    const registros = a.analisis_completo?.registros ?? [];
    registros.forEach((r, ri) => {
      const date = r.fecha_ingreso ?? r.fecha_resolucion ?? a.fecha_publicacion ?? '2025-01-01';
      const year = (r.fecha_ingreso ?? r.fecha_resolucion ?? a.año ?? a.analisis_completo?.gaceta?.anio ?? '2025').toString().slice(0, 4);
      items.push({
        id: r.clave_proyecto ?? r.id ?? `GAC-${idx}-${ri}`,
        project: r.proyecto_nombre ?? 'Proyecto sin nombre',
        promoter: r.promovente ?? 'Promovente no especificado',
        type: r.modalidad ?? 'Sin modalidad',
        date,
        year,
        status: r.estatus ?? 'En trámite',
        lat: r.lat ?? 21.8853,
        lng: r.lng ?? -102.2916,
        description: r.tipo_proyecto ?? '',
        impact: r.seccion_documento ?? (a.secciones?.[0] ?? 'Federal')
      });
    });
  });
  return items;
};


const GAZETTES_DATA = [
  {
    id: "GACETA-05/25",
    project: "Parque Fotovoltaico 'Soles de Aguascalientes II'",
    promoter: "Energía Renovable del Centro S.A. de C.V.",
    type: "MIA Particular",
    date: "2025-02-12",
    year: "2025",
    status: "Ingreso",
    lat: 22.0123,
    lng: -102.1500,
    description: "Instalación de 50,000 paneles solares en predio rústico. Competencia Federal por cambio de uso de suelo en terreno forestal.",
    impact: "Federal"
  },
  {
    id: "GACETA-03/25",
    project: "Modernización Carretera Federal 45 Tramo Norte",
    promoter: "Secretaría de Infraestructura, Comunicaciones y Transportes",
    type: "MIA Regional",
    date: "2025-01-28",
    year: "2025",
    status: "Resolutivo",
    lat: 22.1500,
    lng: -102.2800,
    description: "Ampliación a 4 carriles y rectificación de curvas peligrosas. Afectación a zona federal de cauces.",
    impact: "Infraestructura"
  },
  {
    id: "GACETA-52/24",
    project: "Gasoducto Villa de Reyes - Aguascalientes (Ramal)",
    promoter: "Gasoductos del Bajío",
    type: "MIA Regional",
    date: "2024-12-10",
    year: "2024",
    status: "Aprobado",
    lat: 21.9500,
    lng: -102.1000,
    description: "Construcción de ducto de transporte de gas natural de 24 pulgadas. Cruza 3 municipios del estado.",
    impact: "Energético"
  },
  {
    id: "GACETA-48/24",
    project: "Aprovechamiento Minero 'La Fortuna'",
    promoter: "Minera del Norte",
    type: "Informe Preventivo",
    date: "2024-11-05",
    year: "2024",
    status: "Evaluación",
    lat: 22.2000,
    lng: -102.4000,
    description: "Exploración minera para extracción de agregados pétreos en zona serrana.",
    impact: "Extractivo"
  },
  {
    id: "GACETA-08/25",
    project: "Planta de Tratamiento de Aguas Residuales 'Pabellón'",
    promoter: "Comisión Estatal del Agua",
    type: "Exención",
    date: "2025-02-15",
    year: "2025",
    status: "Publicado",
    lat: 22.1400,
    lng: -102.2700,
    description: "Rehabilitación de planta existente. No requiere nueva MIA al no ampliar capacidad instalada, solo modernización tecnológica.",
    impact: "Hídrico"
  },
   // Datos generados para paginación (Iniciamos en 20 para evitar colisiones con manuales)
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `GACETA-${(20 + i).toString().padStart(2, '0')}/25`,
    project: `Proyecto Federal de Infraestructura ${i + 1}`,
    promoter: `Promovente Federal ${String.fromCharCode(65 + i)}`,
    type: "MIA Particular",
    date: "2025-01-15",
    year: "2025",
    status: "En Trámite",
    lat: 21.9000 + (Math.random() * 0.2 - 0.1),
    lng: -102.3000 + (Math.random() * 0.2 - 0.1),
    description: "Proyecto listado en la Gaceta Ecológica de la SEMARNAT con incidencia en el estado de Aguascalientes.",
    impact: "Federal"
  }))
];

const KPI_DATA = [
  { label: "Boletín Actual", value: "Semanas 01-02", change: "Activo" },
  { label: "Proyectos Ingresados", value: "142", change: "+12 vs mes anterior" },
  { label: "Resolutivos Emitidos", value: "89", change: "65% Aprobados" },
];

const GREEN_AREAS_DATA = [
  {
    id: 1,
    name: "Jardín de San Marcos",
    address: "Jesús F. Contreras, Barrio de San Marcos",
    lat: 21.8798,
    lng: -102.3025,
    tags: ["Jardín Histórico", "Turismo"],
    need: "Mantenimiento de balaustrada",
    image: MOCK_IMAGES.sanMarcos
  },
  {
    id: 2,
    name: "Parque Tres Centurias",
    address: "Av. Alameda 301, Barrio de la Estación",
    lat: 21.8943,
    lng: -102.2832,
    tags: ["Parque Recreativo", "Patrimonio Industrial"],
    need: "Reforestación zona norte",
    image: MOCK_IMAGES.tresCenturias
  },
  {
    id: 3,
    name: "Parque Rodolfo Landeros",
    address: "Blvd. José María Chávez s/n",
    lat: 21.8605,
    lng: -102.2850,
    tags: ["Reserva Ecológica", "Fauna"],
    need: "Sistema de riego eficiente",
    image: MOCK_IMAGES.rodolfoLanderos
  },
  {
    id: 4,
    name: "Línea Verde (Tramo 1)",
    address: "Av. Poliducto, Villas de Nuestra Señora",
    lat: 21.9050,
    lng: -102.2550,
    tags: ["Corredor Biológico", "Deportivo"],
    need: "Seguridad e iluminación",
    image: MOCK_IMAGES.lineaVerde
  }
];

// --- Components ---

const NavBar = ({ activeTab, onNavigate }) => {
  const tabs = [
    { id: 'HOME', label: 'INICIO', color: 'bg-[#b4ff6f]', hoverColor: 'hover:bg-[#b4ff6f]' },
    { id: 'AGENDA', label: 'AGENDA', color: 'bg-[#ff7e67]', hoverColor: 'hover:bg-[#ff7e67]' },
    { id: 'GREEN_AREAS', label: 'ÁREAS VERDES', color: 'bg-[#fccb4e]', hoverColor: 'hover:bg-[#fccb4e]' },
    { id: 'NEWSLETTERS', label: 'BOLETINES', color: 'bg-[#ff9d9d]', hoverColor: 'hover:bg-[#ff9d9d]' },
    { id: 'GAZETTES', label: 'GACETAS', color: 'bg-[#9dcdff]', hoverColor: 'hover:bg-[#9dcdff]' },
    { id: 'PARTICIPATION', label: 'PARTICIPACIÓN', color: 'bg-[#d89dff]', hoverColor: 'hover:bg-[#d89dff]' },
  ];

  return (
    <nav className="sticky top-0 z-50 flex w-full border-b border-black bg-white text-xs md:text-sm font-mono tracking-wider uppercase overflow-x-auto scrollbar-hide">
      <div className="flex-shrink-0 w-32 h-16 border-r border-black flex items-center justify-center bg-white cursor-pointer" onClick={() => onNavigate('HOME')}>
        <svg className="w-24 h-auto" viewBox="0 0 835 383" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M443.716 1.29473C428.451 4.34118 413.078 16.024 406.695 29.4286L403.655 35.8116L403.029 32.3989C402.684 30.5217 401.421 23.4169 400.219 16.6102L398.036 4.23425H359.568L359.075 33.9364C358.803 50.2726 358.699 90.4824 358.843 123.29L359.105 182.942H404.48L404.519 142.597C404.557 102.513 404.57 102.275 406.404 105.957C413.345 119.896 427.296 130.823 442.729 134.412C449.045 135.88 462.266 135.916 469.626 134.484C486.059 131.287 500.475 118.339 507.56 100.41C511.967 89.2597 513.374 79.4006 512.739 64.1336C512.12 49.2311 510.034 39.7333 505.258 30.0652C493.927 7.12526 470.165 -3.98335 443.716 1.29473ZM753.659 0.732362C740.044 3.23527 725.217 11.2351 717.576 20.2021C705.367 34.5275 698.643 54.0111 697.116 79.4797C696.167 95.2981 698.648 121.604 702.122 132.587C702.687 134.369 700.706 134.429 640.992 134.429H579.279L578.988 127.746C578.827 124.071 578.84 117.388 579.015 112.895L579.334 104.727H690.727V69.084H579.189V42.352H700.598V2.74915H516.007L516.511 174.527H703.066L703.635 137.894L706.638 144.131C711.215 153.638 719.925 162.357 729.597 167.114C739.608 172.037 749.327 174.083 763.276 174.206C776.938 174.327 783.807 172.93 794.293 167.898C807.961 161.339 820.065 147.692 826.595 131.479C838.097 102.915 837.324 57.8704 824.882 31.7632C817.647 16.5795 805.339 6.73419 787.953 2.22144C780.953 0.404654 760.319 -0.491367 753.659 0.732362ZM0.318073 6.94508C0.0446573 8.17673 -0.0757373 49.2825 0.0496196 98.2911L0.277619 187.398L53.0687 187.925L53.579 77.9204L99.9965 187.398L147.631 187.927L151.022 179.742C152.886 175.24 163.039 150.476 173.583 124.71L192.755 77.863L193.265 187.925L246.056 187.398L246.559 4.70553L173.266 5.22433L148.463 65.3455C134.822 98.4119 123.438 125.474 123.167 125.482C122.895 125.491 111.343 98.4367 97.4943 65.3613L72.3164 5.22433L0.814587 4.70455L0.318073 6.94508ZM292.699 5.7451C286.61 7.27972 278.022 12.1608 271.546 17.7676C263.44 24.7852 252.264 38.9145 252.662 41.6402C252.889 43.1956 254.804 44.4599 260.299 46.6866C268.927 50.1815 275.811 56.1873 276.784 61.0684C277.415 64.2316 279.501 66.0613 280.892 64.6712C281.276 64.2881 281.861 57.6615 282.191 49.9459C282.889 33.6602 284.23 27.596 288.033 23.5119C291.94 19.317 297.659 19.3438 301.206 23.5714C304.377 27.3505 305.515 31.4098 306.887 43.8233C308.807 61.1832 306.48 71.4711 298.946 78.9501C296.144 81.7312 289.218 86.2657 280.748 90.8656C260.772 101.714 255.643 106.921 251.37 120.692C249.112 127.971 248.833 146.174 250.864 153.735C254.171 166.044 260.642 174.811 269.888 179.51C277.617 183.438 289.569 184.204 295.533 181.151C299.186 179.282 306.119 172.597 310.105 167.101C311.338 165.401 312.054 165.031 312.393 165.919C312.663 166.63 314.283 169.047 315.991 171.289C327.212 186.012 351.014 181.187 354.969 163.388C356.039 158.568 355.378 158.203 351.19 161.308C348.432 163.354 348.219 163.371 345.719 161.727C339.879 157.889 339.88 157.905 339.251 97.3011C338.75 49.0786 338.455 41.0838 336.983 35.9166C331.238 15.7359 320.495 5.71739 303.936 5.09661C299.789 4.94117 294.732 5.23225 292.699 5.7451ZM786.434 11.639C788.693 12.8518 790.169 16.8894 792.053 27.0059C794.083 37.8947 795.073 101.064 793.42 114.226C790.567 136.964 782.904 151.916 770.684 158.588C760.937 163.909 748.747 165.773 745.765 162.398C743.467 159.797 741.145 152.024 739.344 140.913C736.886 125.744 736.897 61.9327 739.36 50.7676C742.93 34.573 750.833 22.5516 761.739 16.721C770.357 12.1132 782.617 9.59055 786.434 11.639ZM447.57 41.8471C470.169 48.5786 474.801 78.6134 455.069 90.4755C440.417 99.2832 416.824 96.3932 408.424 84.7618C399.74 72.7374 401.258 56.4655 411.876 47.7569C420.061 41.0432 436.008 38.4036 447.57 41.8471ZM307.978 127.168L308.241 154.065L303.556 157.27C297.125 161.671 291.344 161.851 287.111 157.784C281.772 152.653 279.284 140.622 281 128.24C283.05 113.458 287.486 105.942 300.344 95.4655L307.254 89.8359L307.485 95.0536C307.611 97.9228 307.833 112.375 307.978 127.168Z" fill="#242424"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M516.233 234.766L513.344 230.765C511.48 228.184 508.415 225.76 504.707 223.934C499.548 221.392 497.95 221.103 489.089 221.103C480.253 221.103 478.65 221.392 473.79 223.858C470.804 225.372 467.293 227.976 465.988 229.644C462.257 234.412 459.199 243.134 458.058 252.265C456.783 262.47 456.722 332.054 457.976 345.852C460.269 371.077 468.807 381.375 488.532 382.706C499.577 383.451 503.743 381.996 510.558 375.01L516.233 369.192V381.039L558.184 380.505L558.687 194.866H516.233V234.766ZM682.553 195.476C655.215 198.323 629.661 205.484 612.505 215.107C587.187 229.309 571.011 249.57 566.032 273.315C564.204 282.03 564.199 295.801 566.021 304.452C573.558 340.241 607.234 366.619 659.328 377.539C689.861 383.939 730.682 384.654 764.479 379.382C781.246 376.766 806.284 370.247 813.339 366.66C814.696 365.97 819.283 363.738 823.532 361.699C827.781 359.662 831.461 357.464 831.709 356.814C832.068 355.878 812.014 319.937 810.014 317.93C809.729 317.647 805.809 319.001 801.301 320.942C784.989 327.969 762.115 332.76 736.558 334.502C709.074 336.376 685.098 332.996 669.17 325.002C662.978 321.895 655.276 315.571 653.132 311.833L651.349 308.725H832.846L833.95 304.326C835.49 298.194 835.299 278.858 833.621 270.918C830.612 256.673 824.398 245.044 813.624 233.491C796.343 214.961 770.222 202.661 736.805 197.32C727.342 195.808 691.174 194.578 682.553 195.476ZM0 201.183C0 202.636 5.97568 223.33 33.2758 316.408L52.8078 383L94.0157 382.485L113.942 314.665C136.822 236.795 147.072 201.514 147.072 200.629C147.072 200.289 137.35 199.999 125.465 199.985L103.859 199.958L96.3096 226.867C92.157 241.667 85.5368 265.272 81.5974 279.323L74.4353 304.87L44.779 200.312L22.3895 200.114C4.75765 199.958 0 200.185 0 201.183ZM298.242 200.715C297.475 201.19 297.228 226.732 297.382 289.458L297.599 377.535L341.523 378.067V319.615H356.017C368.668 319.615 371.05 319.877 374.742 321.669C380.454 324.443 384.908 330.831 389.89 343.397C398.154 364.238 405.694 375.159 415.167 380.013C419.204 382.08 422.185 382.487 427.769 382.485C433.536 382.485 437.497 382.178 444.233 378.834C448.274 376.828 453.084 373.626 454.922 371.72L458.263 368.254L450.831 341.438L447.922 343.893C443.823 347.352 439.188 347.495 435.713 344.268C434.586 343.222 430.889 336.167 427.498 328.592C423.704 320.119 420.061 313.508 418.03 311.41L414.728 308L418.502 306.865C423.201 305.453 432.96 298.328 436.39 293.805C444.291 283.386 447.446 272.494 447.409 255.756C447.343 226.587 435.813 208.63 413.011 202.19C407.929 200.754 400.097 200.506 353.241 200.293C323.583 200.158 298.833 200.347 298.242 200.715ZM193.464 202.231C168.115 207.529 153.578 220.25 148.038 241.979C146.248 248.997 146.086 252.992 146.102 289.824C146.121 333.101 146.587 338.306 151.387 348.823C161.211 370.347 180.931 381.412 211.725 382.679C245.133 384.053 268.496 373.059 279.422 350.82C283.725 342.063 286.205 332.05 286.231 323.328L286.248 317.635H245.158L244.034 328.279C243.416 334.133 242.023 341.493 240.936 344.636C235.439 360.538 221.951 369.45 201.361 370.784C193.203 371.313 192.903 371.254 190.503 368.66L188.035 365.992L187.466 302.27L285.754 266.324L286.041 258.938C286.645 243.335 281.094 228.056 271.33 218.453C265.068 212.292 253.449 205.948 243.311 203.154C235.232 200.928 202.592 200.324 193.464 202.231ZM241.316 214.062C244.596 217.352 244.915 220.247 244.586 243.794L244.298 264.503L216.186 275.228C200.726 281.126 187.955 285.953 187.808 285.953C187.662 285.953 187.542 279.328 187.542 271.232C187.542 254.081 189.417 241.52 193.105 233.966C199.746 220.362 214.493 212.004 232.251 211.782C238.068 211.708 239.272 212.011 241.316 214.062ZM394.461 241.275C400.694 244.847 403.215 250.606 403.215 261.273C403.215 268.807 402.92 270.209 400.588 273.742C395.824 280.964 393.726 281.453 365.953 281.821L341.523 282.145V238.229L365.953 238.584C389.489 238.925 390.532 239.023 394.461 241.275ZM717.389 240.996C725.226 242.618 730.43 244.436 732.625 246.316C733.315 246.908 736.001 248.766 738.591 250.444C744.425 254.225 749.668 260.522 751.635 266.115C752.456 268.449 753.128 270.75 753.128 271.227C753.128 271.71 730.221 272.092 701.289 272.092H649.449L650.112 269.369C651.83 262.32 659.915 253.081 667.994 248.935C669.759 248.03 671.202 246.892 671.202 246.405C671.202 245.346 681.577 241.831 688.476 240.554C696.359 239.095 709.157 239.29 717.389 240.996ZM512.744 253.651C514.15 255.061 515.341 257.737 515.719 260.334C516.067 262.717 516.213 283.255 516.045 305.975C515.747 346.352 515.693 347.331 513.677 349.353C508.579 354.464 501.178 350.585 499.952 342.158C499.613 339.834 499.474 319.291 499.642 296.508L499.947 255.084L502.277 253.192C505.484 250.589 509.883 250.781 512.744 253.651Z" fill="#7FB800"/>
        </svg>
      </div>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`
            flex-1 min-w-[100px] px-4 py-3 border-r border-black text-left transition-colors duration-200
            ${activeTab === tab.id ? tab.color : `bg-white ${tab.hoverColor}`}
          `}
        >
          {tab.label}
        </button>
      ))}
      <div className="flex-1 min-w-[100px] border-r border-black bg-white md:hidden"></div>
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] bg-[#f3f4f0] text-black overflow-hidden flex flex-col justify-between pt-32 pb-12 border-b border-black">
      {/* Background - Dot Pattern */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-end">
        <div className="flex-1">
           <div className="mb-8">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
             >
               <span className="inline-block px-3 py-1 border border-black bg-black text-white text-xs font-mono uppercase tracking-widest mb-4">Plataforma Ciudadana v2.0</span>
             </motion.div>
             
             <div className="mb-6 w-[800px]">
               <LogoMap className="w-full h-auto" />
             </div>

             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-xl md:text-2xl font-serif max-w-lg leading-relaxed text-gray-800"
             >
               Combatimos la desigualdad ambiental con datos abiertos. Una herramienta para visibilizar, proteger y expandir el bosque urbano.
             </motion.p>
           </div>

           <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-wrap gap-4"
           >
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#b4ff6f", color: "#000" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-black text-white font-bold uppercase text-sm tracking-wider transition-colors border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              >
                 Explorar Mapa
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "#fff" }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 border border-black text-black font-bold uppercase text-sm tracking-wider transition-colors"
              >
                 Leer Manifiesto
              </motion.button>
           </motion.div>
        </div>
      </div>

      {/* Footer Ticker */}
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         transition={{ delay: 1.2, duration: 1 }}
         className="w-full max-w-7xl mx-auto px-6 mt-12"
      >
         <div className="border-t border-black pt-4 flex justify-between items-end text-xs font-mono uppercase tracking-widest text-gray-500">
            <div>Aguascalientes, MX</div>
            <div className="text-right">Datos Abiertos <br/> Licencia CC-BY-SA 4.0</div>
         </div>
      </motion.div>
    </section>
  );
};

const TextContentSection = () => {
  return (
    <section className="bg-white text-black py-20 px-6 border-b border-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
           <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">El Problema</h3>
           <p className="text-3xl font-bold leading-tight mb-4">
              Nuestras ciudades se están calentando.
           </p>
           <p className="font-serif text-gray-600 leading-relaxed">
              La falta de arbolado y la expansión de superficies de concreto generan islas de calor que afectan desproporcionadamente a las zonas marginadas.
           </p>
        </div>
        
        <div className="md:col-span-4">
           <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">La Solución</h3>
           <p className="text-3xl font-bold leading-tight mb-4">
              Inteligencia Colectiva.
           </p>
           <p className="font-serif text-gray-600 leading-relaxed">
              No podemos esperar a que otros lo resuelvan. Mapeo Verde empodera a los vecinos para censar, vigilar y exigir el mantenimiento de sus espacios vitales.
           </p>
        </div>

        <div className="md:col-span-4 bg-[#f3f4f0] border border-black p-6 flex flex-col justify-center items-center text-center">
           <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mb-4">
              <Eye size={24} />
           </div>
           <p className="font-bold uppercase text-sm mb-2">Transparencia Total</p>
           <p className="text-xs font-mono text-gray-500">
              Cada árbol registrado, cada reporte y cada dato es de acceso público. Sin cajas negras.
           </p>
        </div>
      </div>
    </section>
  );
};

const StatCircle = ({ value, label, description }) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-20">
      {/* Big Circle */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full bg-[#fccb4e] flex items-center justify-center border border-black z-10"
      >
        <span className="text-[80px] md:text-[180px] font-bold tracking-tighter text-black font-sans">
          {value}
        </span>
      </motion.div>

      {/* Floating Note Box Right */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 md:mt-0 md:absolute md:right-10 md:top-20 max-w-xs bg-white border border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20"
      >
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-xl font-bold leading-tight">{label}</h4>
          <div className="w-2 h-2 rounded-full bg-black md:hidden" />
        </div>
        <p className="font-serif text-sm leading-relaxed text-gray-800">
          {description}
        </p>
      </motion.div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        <svg className="w-full h-full">
           <circle cx="50%" cy="50%" r="35%" fill="none" stroke="black" strokeWidth="1" strokeDasharray="4 4" />
           <line x1="0" y1="50%" x2="100%" y2="50%" stroke="black" strokeWidth="1" strokeOpacity="0.1" />
           <line x1="50%" y1="0" x2="50%" y2="100%" stroke="black" strokeWidth="1" strokeOpacity="0.1" />
        </svg>
      </div>
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="bg-[#f3f4f0] text-black py-12 px-6 border-b border-black overflow-hidden">
       <div className="max-w-7xl mx-auto mb-8 border border-black bg-white p-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-mono text-xs uppercase tracking-widest">Impacto: Cobertura Vegetal</p>
       </div>
       
       <div className="scale-75 origin-center -my-10 md:-my-20">
         <StatCircle 
           value="9m²" 
           label="Área verde recomendada por habitante (OMS)."
           description="Nuestras ciudades enfrentan un déficit crítico. El mapeo ciudadano es el primer paso para identificar zonas prioritarias de reforestación y asegurar la equidad en el acceso a espacios verdes."
         />
       </div>

       <div className="mt-12 max-w-7xl mx-auto flex justify-end">
          <div className="max-w-md border border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <div className="font-mono text-xs border-b border-black pb-2 mb-4">REGISTRO ACTUAL</div>
             <p className="font-sans text-lg font-bold">
               +15,000 ÁRBOLES CATALOGADOS Y MONITOREADOS POR VECINOS EN EL ÚLTIMO AÑO.
             </p>
          </div>
       </div>
    </section>
  );
};

const FeatureList = ({ onFeatureEnter, onFeatureLeave }) => {
  const features = [
    { title: "Áreas Verdes", desc: "Inventario colaborativo de flora urbana." },
    { title: "Boletines", desc: "Monitor de proyectos locales y alertas ciudadanas." },
    { title: "Gacetas", desc: "Rastreo de impacto ambiental federal." },
    { title: "Agenda", desc: "Actividades de voluntariado y educación." }
  ];

  return (
    <section className="bg-[#0a0a0a] text-white py-24 px-6 border-b border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border border-white bg-black px-3 py-1 inline-block shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
           <p className="font-mono text-xs uppercase tracking-widest text-white">Herramientas</p>
        </div>
        <h3 className="text-3xl md:text-5xl font-light mb-16">TECNOLOGÍA PARA <br/> <span className="font-bold">EL CUIDADO AMBIENTAL</span></h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-white/20">
          {features.map((f, i) => (
            <div 
              key={i} 
              className="group p-8 border-r border-b border-white/20 hover:bg-white/5 transition-colors cursor-pointer min-h-[250px] flex flex-col justify-between"
              onMouseEnter={() => onFeatureEnter && onFeatureEnter(f.title)}
              onMouseLeave={() => onFeatureLeave && onFeatureLeave()}
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs text-white/50">0{i+1}</span>
                <ArrowRight className="w-5 h-5 text-white/0 group-hover:text-[#b4ff6f] transition-all -translate-x-4 group-hover:translate-x-0" />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">{f.title}</h4>
                <p className="text-sm text-zinc-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CtaSection = () => {
  return (
    <section className="bg-[#b4ff6f] text-black py-32 px-6 border-b border-black text-center">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 inline-block">
          <p className="font-mono text-xs uppercase tracking-widest border border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Capítulo 4</p>
        </div>
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 leading-[0.9]">
          ÚNETE A LA<br/>REVOLUCIÓN
        </h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <button className="px-8 py-5 bg-black text-white text-lg font-bold hover:bg-zinc-800 transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none">
            COMENZAR AHORA
          </button>
          <button className="px-8 py-5 border-2 border-black text-black text-lg font-bold hover:bg-black/5 transition-all">
            LEER DOCUMENTACIÓN
          </button>
        </div>
      </div>
    </section>
  );
};

// --- NEW COMPONENT: NewslettersPage ---

const NewslettersPage = () => {
  const { projects: PROJECTS_DATA } = React.useContext(DataContext);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const years = useMemo(() => {
    const allYears = PROJECTS_DATA.map(p => p.year).filter(Boolean);
    const unique = Array.from(new Set(allYears));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [PROJECTS_DATA]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || 'all');
  const [center, setCenter] = useState([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(12);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter projects logic
  const filteredByYear = selectedYear === 'all'
    ? PROJECTS_DATA
    : PROJECTS_DATA.filter(p => p.year === selectedYear);
  const filteredBySearch = filteredByYear.filter(p => 
    p.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.promoter.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedData = [...filteredBySearch].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination logic (newest first)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedProject = PROJECTS_DATA.find(p => p.id === selectedProjectId);

  // Handle map selection
  const handleSelectProject = (id, lat, lng) => {
    setSelectedProjectId(id);
    setCenter([lat, lng]);
    setZoom(14);
  };

  // Custom tile provider for a cleaner, brutalist look (CartoDB Positron)
  const mapTiler = (x, y, z, dpr) => {
    return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
      
      {/* Introduction Section */}
      <div className="bg-[#ff9d9d] border-b border-black p-8 md:p-12">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-white border border-black rounded-full"></div>
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Monitor Ambiental Local</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] mb-6 tracking-tighter">
            Boletines de Impacto
          </h1>
          <p className="font-serif text-lg text-black max-w-2xl leading-relaxed">
             Vigilancia ciudadana sobre los nuevos proyectos de construcción en Aguascalientes.
             Analizamos las Manifestaciones de Impacto Ambiental (MIA) para detectar riesgos a tiempo.
          </p>
        </div>
      </div>

      {/* Restored KPIs Section - No longer sticky */}
      <div className="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-white">
           {KPI_DATA.map((kpi, i) => (
             <div key={i} className="p-3 md:p-4 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors">
                 <span className="font-mono text-[10px] uppercase text-gray-500 mb-1">{kpi.label}</span>
                 <span className="text-2xl md:text-3xl font-black tracking-tighter">{kpi.value}</span>
                 <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 mt-1 rounded-full">{kpi.change}</span>
             </div>
           ))}
      </div>

      {/* Toolbar - Sticky Top */}
      <div className="sticky top-[110px] md:top-[64px] z-40 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full md:max-w-2xl">
               {/* Year Filter */}
               <div className="relative w-32 shrink-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select 
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9d9d] uppercase bg-white appearance-none cursor-pointer hover:bg-gray-50"
                  >
                     <option value="all">Todos</option>
                     {years.map(y => (
                       <option key={y} value={y}>{y}</option>
                     ))}
                  </select>
               </div>

               {/* Search */}
               <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="BUSCAR PROYECTO..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9d9d] uppercase"
                  />
               </div>
            </div>

            {/* View Toggles */}
            <div className="flex border border-black bg-gray-100 shrink-0">
               <button 
                 onClick={() => setViewMode('table')}
                 className={`p-2 border-r border-black hover:bg-gray-200 ${viewMode === 'table' ? 'bg-[#ff9d9d]' : ''}`}
               >
                 <List size={18} />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 hover:bg-gray-200 ${viewMode === 'grid' ? 'bg-[#ff9d9d]' : ''}`}
               >
                 <LayoutGrid size={18} />
               </button>
            </div>
         </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        
        {/* TOP SECTION: Data Table (100vw) */}
        <div className="w-full border-b border-black bg-[#f3f4f0] p-6">
           <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs md:text-sm">
                    <thead className="bg-black text-white uppercase tracking-wider">
                      <tr>
                        <th className="p-3 border-r border-white/20 w-32">ID</th>
                        <th className="p-3 border-r border-white/20">Proyecto</th>
                        <th className="p-3 border-r border-white/20 hidden md:table-cell">Promovente</th>
                        <th className="p-3 border-r border-white/20 w-32">Estado</th>
                        <th className="p-3 w-24">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {currentData.map((row) => (
                        <tr 
                          key={row.id} 
                          onClick={() => handleSelectProject(row.id, row.lat, row.lng)}
                          className={`cursor-pointer hover:bg-[#ff9d9d]/20 transition-colors ${selectedProjectId === row.id ? 'bg-[#ff9d9d]/50' : ''}`}
                        >
                          <td className="p-3 border-r border-black font-bold whitespace-nowrap">{row.id}</td>
                          <td className="p-3 border-r border-black">
                             <div className="font-bold truncate max-w-[200px] md:max-w-md">{row.project}</div>
                             <div className="text-[10px] text-gray-500 mt-1 uppercase">{row.type}</div>
                          </td>
                          <td className="p-3 border-r border-black hidden md:table-cell truncate max-w-xs">{row.promoter}</td>
                          <td className="p-3 border-r border-black">
                             <span className={`
                               inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold whitespace-nowrap
                               ${row.status.includes('Aprobado') ? 'bg-[#b4ff6f]' : 
                                 row.status.includes('Denegado') ? 'bg-red-400' : 'bg-[#fccb4e]'}
                             `}>
                               {row.status}
                             </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentData.length === 0 && (
                     <div className="p-12 text-center text-gray-500 font-mono">
                        No se encontraron resultados para el año {selectedYear}.
                     </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                   {currentData.map((card) => (
                      <div 
                        key={card.id}
                        onClick={() => handleSelectProject(card.id, card.lat, card.lng)}
                        className={`
                          border-2 border-black bg-white p-4 cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all h-full
                          ${selectedProjectId === card.id ? 'shadow-[4px_4px_0px_0px_#ff9d9d] border-[#ff9d9d]' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                        `}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-[10px] bg-black text-white px-1">{card.id}</span>
                            <span className="text-[10px] font-bold text-gray-500">{card.date}</span>
                         </div>
                         <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{card.project}</h4>
                         <p className="text-xs font-mono text-gray-600 mb-4 line-clamp-1">{card.promoter}</p>
                         <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                            <span className={`text-[10px] font-bold uppercase ${card.status.includes('Aprobado') ? 'text-green-600' : 'text-orange-600'}`}>
                              ● {card.status}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
              
              {/* Pagination */}
              <div className="p-4 border-t border-black bg-white flex justify-between items-center">
                 <div className="text-xs font-mono text-gray-500">
                    Mostrando {currentData.length} de {filteredBySearch.length} resultados
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-sm px-2">
                       {currentPage} / {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 border border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <ChevronRight size={16} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* BOTTOM SECTION: Split View (Map | Details) */}
        <div className="flex flex-col md:flex-row h-[600px] border-b border-black">
           
           {/* LEFT HALF: Map */}
           <div className="w-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-black bg-gray-100">
               <Map 
                 center={center} 
                 zoom={zoom} 
                 provider={mapTiler}
                 onBoundsChanged={({ center, zoom }) => { 
                   setCenter(center); 
                   setZoom(zoom); 
                 }}
                 style={{ filter: 'grayscale(100%) contrast(1.2)' }}
               >
                 {filteredByYear.map(point => (
                   <Overlay key={point.id} anchor={[point.lat, point.lng]} offset={[15, 30]}>
                     <div 
                       onClick={() => handleSelectProject(point.id, point.lat, point.lng)}
                       className={`
                         cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-300 group
                         ${selectedProjectId === point.id ? 'z-50 scale-125' : 'z-10 hover:z-40 hover:scale-110'}
                       `}
                     >
                       <MapPin 
                         fill={selectedProjectId === point.id ? "#ff9d9d" : "#000"} 
                         color="white" 
                         size={40} 
                         strokeWidth={1.5}
                         className="drop-shadow-md"
                       />
                     </div>
                   </Overlay>
                 ))}
               </Map>
               <div className="absolute top-4 right-4 bg-white border border-black p-2 shadow-sm pointer-events-none opacity-90 z-20">
                  <p className="text-[10px] font-mono uppercase font-bold mb-1">Mapa {selectedYear}</p>
               </div>
           </div>
           
           {/* RIGHT HALF: Details */}
           <div className="w-full md:w-1/2 overflow-y-auto bg-white p-8 md:p-12 flex flex-col">
              {selectedProject ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6">
                       <span className="px-3 py-1 bg-black text-white font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#ff9d9d]">
                          {selectedProject.id}
                       </span>
                       <span className="font-mono text-xs text-gray-500 border-b border-gray-300 pb-1">
                          {selectedProject.date}
                       </span>
                    </div>

                    <h3 className="text-3xl font-bold leading-none mb-6 font-sans">
                       {selectedProject.project}
                    </h3>
                    
                    <div className="space-y-8">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Promovente</p>
                          <p className="font-mono text-lg border-l-4 border-[#ff9d9d] pl-4">
                             {selectedProject.promoter}
                          </p>
                       </div>

                       <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Descripción</p>
                          <p className="font-serif text-xl text-gray-800 leading-relaxed font-light">
                             {selectedProject.description}
                          </p>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div>
                             <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Tipo de Trámite</p>
                             <div className="border-2 border-black p-3 text-sm font-bold bg-gray-50 text-center">
                                {selectedProject.type}
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Impacto</p>
                             <div className="border-2 border-black p-3 text-sm font-bold bg-gray-50 text-center">
                                {selectedProject.impact}
                             </div>
                          </div>
                       </div>
                       
                       <div className="pt-8 mt-8 border-t border-dashed border-gray-300">
                          <button className="w-full flex items-center justify-center gap-2 bg-[#ff9d9d] hover:bg-black hover:text-white transition-colors text-black font-bold uppercase py-4 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-lg">
                             <Download size={20} /> Consultar Expediente PDF
                          </button>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center space-y-6">
                    <FileText size={80} strokeWidth={0.5} />
                    <p className="font-mono text-lg max-w-[300px] text-gray-400">
                       Selecciona un proyecto de la lista superior para ver el expediente completo.
                    </p>
                 </div>
              )}
           </div>
        </div>

        {/* CTA Section - Restored Previous Design in Bottom Position */}
        <div className="bg-[#f3f4f0] p-6 md:p-12 border-b border-black">
           <div className="border-2 border-black bg-black text-white p-6 md:p-8 relative z-10 max-w-5xl mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-[#ff9d9d]" />
                ALERTAS CIUDADANAS
             </h3>
             <p className="font-serif text-sm mb-6 max-w-2xl text-gray-300">
                Recibe un resumen semanal de los nuevos proyectos ingresados y resolutivos. Entérate antes de que empiecen a construir.
             </p>
             <div className="flex flex-col md:flex-row gap-4">
                <button className="flex-1 bg-[#ff9d9d] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-white transition-colors border border-transparent hover:border-white">
                   <Mail size={18} /> Suscribir al Boletín
                </button>
                <button className="flex-1 bg-[#25D366] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-white transition-colors border border-transparent hover:border-white">
                   <MessageCircle size={18} /> Grupo de WhatsApp
                </button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// --- NEW COMPONENT: GazettesPage (Duplicate of NewslettersPage logic with Gazettes Data) ---

const GazettesPage = () => {
  const { gazettes: GAZETTES_DATA } = React.useContext(DataContext);
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const years = useMemo(() => {
    const allYears = GAZETTES_DATA.map(p => p.year).filter(Boolean);
    const unique = Array.from(new Set(allYears));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [GAZETTES_DATA]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || 'all');
  const [center, setCenter] = useState([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(9); // More zoomed out for regional/federal view
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter projects logic
  const filteredByYear = selectedYear === 'all'
    ? GAZETTES_DATA
    : GAZETTES_DATA.filter(p => p.year === selectedYear);
  const filteredBySearch = filteredByYear.filter(p => 
    p.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.promoter.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedData = [...filteredBySearch].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Pagination logic (newest first)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedProject = GAZETTES_DATA.find(p => p.id === selectedProjectId);

  const handleSelectProject = (id, lat, lng) => {
    setSelectedProjectId(id);
    setCenter([lat, lng]);
    setZoom(12);
  };

  const mapTiler = (x, y, z, dpr) => {
    return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
  };

  const GAZETTE_KPIS = [
    { label: "Gaceta Actual", value: "DGIRA/05", change: "Publicada" },
    { label: "Proyectos Federales", value: "17", change: "En Ags" },
    { label: "Impacto Regional", value: "5", change: "Alta Importancia" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
      
      {/* Introduction Section */}
      <div className="bg-[#9dcdff] border-b border-black p-8 md:p-12">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-white border border-black rounded-full"></div>
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Monitor Federal (SEMARNAT)</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] mb-6 tracking-tighter">
            Gacetas Ecológicas
          </h1>
          <p className="font-serif text-lg text-black max-w-2xl leading-relaxed">
             Seguimiento semanal de los proyectos federales que afectan nuestro territorio. 
             Infraestructura carretera, energética e industrial bajo la lupa pública.
          </p>
        </div>
      </div>

      {/* Restored KPIs Section - No longer sticky */}
      <div className="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-white">
           {GAZETTE_KPIS.map((kpi, i) => (
             <div key={i} className="p-3 md:p-4 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors">
                 <span className="font-mono text-[10px] uppercase text-gray-500 mb-1">{kpi.label}</span>
                 <span className="text-2xl md:text-3xl font-black tracking-tighter">{kpi.value}</span>
                 <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 mt-1 rounded-full">{kpi.change}</span>
             </div>
           ))}
      </div>

      {/* Toolbar - Sticky Top */}
      <div className="sticky top-[110px] md:top-[64px] z-40 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 w-full md:max-w-2xl">
               <div className="relative w-32 shrink-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select 
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#9dcdff] uppercase bg-white appearance-none cursor-pointer hover:bg-gray-50"
                  >
                     <option value="all">Todos</option>
                     {years.map(y => (
                       <option key={y} value={y}>{y}</option>
                     ))}
                  </select>
               </div>

               <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="BUSCAR PROYECTO FEDERAL..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#9dcdff] uppercase"
                  />
               </div>
            </div>

            <div className="flex border border-black bg-gray-100 shrink-0">
               <button 
                 onClick={() => setViewMode('table')}
                 className={`p-2 border-r border-black hover:bg-gray-200 ${viewMode === 'table' ? 'bg-[#9dcdff]' : ''}`}
               >
                 <List size={18} />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 hover:bg-gray-200 ${viewMode === 'grid' ? 'bg-[#9dcdff]' : ''}`}
               >
                 <LayoutGrid size={18} />
               </button>
            </div>
         </div>

      <div className="flex flex-col flex-1">
        
        {/* TOP SECTION: Data Table */}
        <div className="w-full border-b border-black bg-[#f3f4f0] p-6">
           <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs md:text-sm">
                    <thead className="bg-black text-white uppercase tracking-wider">
                      <tr>
                        <th className="p-3 border-r border-white/20 w-32">Gaceta</th>
                        <th className="p-3 border-r border-white/20">Proyecto Federal</th>
                        <th className="p-3 border-r border-white/20 hidden md:table-cell">Promovente</th>
                        <th className="p-3 border-r border-white/20 w-32">Trámite</th>
                        <th className="p-3 w-24">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {currentData.map((row) => (
                        <tr 
                          key={row.id} 
                          onClick={() => handleSelectProject(row.id, row.lat, row.lng)}
                          className={`cursor-pointer hover:bg-[#9dcdff]/20 transition-colors ${selectedProjectId === row.id ? 'bg-[#9dcdff]/50' : ''}`}
                        >
                          <td className="p-3 border-r border-black font-bold whitespace-nowrap">{row.id}</td>
                          <td className="p-3 border-r border-black">
                             <div className="font-bold truncate max-w-[200px] md:max-w-md">{row.project}</div>
                             <div className="text-[10px] text-gray-500 mt-1 uppercase">{row.impact}</div>
                          </td>
                          <td className="p-3 border-r border-black hidden md:table-cell truncate max-w-xs">{row.promoter}</td>
                          <td className="p-3 border-r border-black">
                             <span className={`
                               inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold whitespace-nowrap bg-white
                             `}>
                               {row.type}
                             </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {currentData.length === 0 && (
                     <div className="p-12 text-center text-gray-500 font-mono">
                        No se encontraron proyectos federales para el año {selectedYear}.
                     </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                   {currentData.map((card) => (
                      <div 
                        key={card.id}
                        onClick={() => handleSelectProject(card.id, card.lat, card.lng)}
                        className={`
                          border-2 border-black bg-white p-4 cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all h-full
                          ${selectedProjectId === card.id ? 'shadow-[4px_4px_0px_0px_#9dcdff] border-[#9dcdff]' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                        `}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-[10px] bg-black text-white px-1">{card.id}</span>
                            <span className="text-[10px] font-bold text-gray-500">{card.date}</span>
                         </div>
                         <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{card.project}</h4>
                         <p className="text-xs font-mono text-gray-600 mb-4 line-clamp-1">{card.promoter}</p>
                         <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase text-blue-600">
                              ● {card.status}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
              )}
              
              {/* Pagination */}
              <div className="p-4 border-t border-black bg-white flex justify-between items-center">
                 <div className="text-xs font-mono text-gray-500">
                    Mostrando {currentData.length} de {filteredBySearch.length} resultados
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-sm px-2">
                       {currentPage} / {totalPages || 1}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 border border-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       <ChevronRight size={16} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* BOTTOM SECTION: Split View (Map | Details) */}
        <div className="flex flex-col md:flex-row h-[600px] border-b border-black">
           
           <div className="w-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-black bg-gray-100">
               <Map 
                 center={center} 
                 zoom={zoom} 
                 provider={mapTiler}
                 onBoundsChanged={({ center, zoom }) => { 
                   setCenter(center); 
                   setZoom(zoom); 
                 }}
                 style={{ filter: 'grayscale(100%) contrast(1.2)' }}
               >
                 {filteredByYear.map(point => (
                   <Overlay key={point.id} anchor={[point.lat, point.lng]} offset={[15, 30]}>
                     <div 
                       onClick={() => handleSelectProject(point.id, point.lat, point.lng)}
                       className={`
                         cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-300 group
                         ${selectedProjectId === point.id ? 'z-50 scale-125' : 'z-10 hover:z-40 hover:scale-110'}
                       `}
                     >
                       <MapPin 
                         fill={selectedProjectId === point.id ? "#9dcdff" : "#000"} 
                         color="white" 
                         size={40} 
                         strokeWidth={1.5}
                         className="drop-shadow-md"
                       />
                     </div>
                   </Overlay>
                 ))}
               </Map>
               <div className="absolute top-4 right-4 bg-white border border-black p-2 shadow-sm pointer-events-none opacity-90 z-20">
                  <p className="text-[10px] font-mono uppercase font-bold mb-1">Mapa Federal {selectedYear}</p>
               </div>
           </div>
           
           <div className="w-full md:w-1/2 overflow-y-auto bg-white p-8 md:p-12 flex flex-col">
              {selectedProject ? (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6">
                       <span className="px-3 py-1 bg-black text-white font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#9dcdff]">
                          {selectedProject.id}
                       </span>
                       <span className="font-mono text-xs text-gray-500 border-b border-gray-300 pb-1">
                          {selectedProject.date}
                       </span>
                    </div>

                    <h3 className="text-3xl font-bold leading-none mb-6 font-sans">
                       {selectedProject.project}
                    </h3>
                    
                    <div className="space-y-8">
                       <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Promovente</p>
                          <p className="font-mono text-lg border-l-4 border-[#9dcdff] pl-4">
                             {selectedProject.promoter}
                          </p>
                       </div>

                       <div>
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Descripción</p>
                          <p className="font-serif text-xl text-gray-800 leading-relaxed font-light">
                             {selectedProject.description}
                          </p>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div>
                             <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Trámite</p>
                             <div className="border-2 border-black p-3 text-sm font-bold bg-gray-50 text-center">
                                {selectedProject.type}
                             </div>
                          </div>
                          <div>
                             <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Jurisdicción</p>
                             <div className="border-2 border-black p-3 text-sm font-bold bg-gray-50 text-center">
                                {selectedProject.impact}
                             </div>
                          </div>
                       </div>
                       
                       <div className="pt-8 mt-8 border-t border-dashed border-gray-300">
                          <button className="w-full flex items-center justify-center gap-2 bg-[#9dcdff] hover:bg-black hover:text-white transition-colors text-black font-bold uppercase py-4 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-lg">
                             <Download size={20} /> Gaceta PDF Oficial
                          </button>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center space-y-6">
                    <FileText size={80} strokeWidth={0.5} />
                    <p className="font-mono text-lg max-w-[300px] text-gray-400">
                       Selecciona un proyecto federal para ver los detalles de la gaceta.
                    </p>
                 </div>
              )}
           </div>
        </div>

        {/* CTA Section - BLUE VARIANT */}
        <div className="bg-[#f3f4f0] p-6 md:p-12 border-b border-black">
           <div className="border-2 border-black bg-black text-white p-6 md:p-8 relative z-10 max-w-5xl mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="text-[#9dcdff]" />
                MONITOREO FEDERAL
             </h3>
             <p className="font-serif text-sm mb-6 max-w-2xl text-gray-300">
                Las gacetas de SEMARNAT se publican los jueves. Suscríbete para recibir únicamente los proyectos que afectan a Aguascalientes.
             </p>
             <div className="flex flex-col md:flex-row gap-4">
                <button className="flex-1 bg-[#9dcdff] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-white transition-colors border border-transparent hover:border-white">
                   <Mail size={18} /> Suscribir a Gacetas
                </button>
                <button className="flex-1 bg-white text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors border border-transparent">
                   <ExternalLink size={18} /> Ver Sitio SEMARNAT
                </button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

// --- NEW COMPONENT: GreenAreasPage ---

const GreenAreasPage = ({ onSelectArea }) => {
  const { greenAreas: GREEN_AREAS_DATA } = React.useContext(DataContext);
  const [center, setCenter] = useState([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(12);
  const [hoveredId, setHoveredId] = useState(null);
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const filteredData = GREEN_AREAS_DATA.filter(item => {
     if (categoryFilter !== 'TODOS' && !item.tags.some(t => t.toUpperCase().includes(categoryFilter))) return false;
     return true;
  });

  const mapTiler = (x, y, z, dpr) => {
    return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}${dpr >= 2 ? '@2x' : ''}.png`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
       {/* Introduction Section */}
       <div className="bg-[#fccb4e] border-b border-black p-8 md:p-12 shrink-0">
          <div className="max-w-4xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-white border border-black rounded-full"></div>
                <span className="font-mono text-xs uppercase tracking-widest font-bold">Patrimonio Natural</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] mb-6 tracking-tighter">
                Inventario Verde
             </h1>
             <p className="font-serif text-lg text-black max-w-2xl leading-relaxed">
                Explora el catálogo vivo de nuestros parques y jardines.
                Conoce su estado de salud, necesidades de mantenimiento y valor ambiental.
             </p>
          </div>
       </div>

       {/* Split View Content */}
       <div className="flex-1 flex flex-col lg:flex-row min-h-[600px] border-b border-black">
          {/* LEFT: Map Section (60%) */}
          <div className="w-full lg:w-3/5 relative border-b lg:border-b-0 lg:border-r border-black min-h-[400px]">
             <Map 
                center={center} 
                zoom={zoom} 
                provider={mapTiler}
                onBoundsChanged={({ center, zoom }) => { 
                  setCenter(center); 
                  setZoom(zoom); 
                }}
                style={{ filter: 'grayscale(100%) contrast(1.2)' }}
             >
                {filteredData.map(point => (
                  <Overlay key={point.id} anchor={[point.lat, point.lng]} offset={[15, 30]}>
                    <div 
                      className={`
                        cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-300
                        ${hoveredId === point.id ? 'z-50 scale-125' : 'z-10 hover:z-40 hover:scale-110'}
                      `}
                      onClick={() => onSelectArea(point.id)}
                      onMouseEnter={() => setHoveredId(point.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <TreePine 
                        fill={hoveredId === point.id ? "#b4ff6f" : "#000"} 
                        color="white" 
                        size={32} 
                        strokeWidth={1.5}
                        className="drop-shadow-sm"
                      />
                    </div>
                  </Overlay>
                ))}
             </Map>
             
             <div className="absolute top-4 left-4 bg-white border border-black p-2 shadow-sm">
                <h2 className="font-bold uppercase text-xs flex items-center gap-2">
                   <MapPin size={14}/> Mapa en vivo
                </h2>
             </div>
          </div>

          {/* RIGHT: List Section (40%) */}
          <div className="w-full lg:w-2/5 overflow-y-auto bg-white flex flex-col">
             {/* Header & Filters */}
             <div className="p-6 border-b border-black sticky top-0 bg-white z-20">
                <div className="mb-4">
                   <h2 className="font-black text-xl uppercase tracking-tighter">Filtros</h2>
                   <p className="font-mono text-xs text-gray-500 mt-1">
                      {GREEN_AREAS_DATA.length} espacios registrados.
                   </p>
                </div>

                <div className="flex flex-col gap-3">
                   <div className="flex gap-2">
                      <select 
                         className="flex-1 border border-black p-2 text-xs font-mono uppercase bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                         value={categoryFilter}
                         onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                         <option value="TODOS">Todas las Categorías</option>
                         <option value="PARQUE">Parques</option>
                         <option value="JARDÍN">Jardines</option>
                         <option value="CORREDOR">Corredores</option>
                      </select>
                      <select 
                         className="flex-1 border border-black p-2 text-xs font-mono uppercase bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black"
                         value={statusFilter}
                         onChange={(e) => setStatusFilter(e.target.value)}
                      >
                         <option value="TODOS">Cualquier Estado</option>
                         <option value="OPTIMO">Óptimo</option>
                         <option value="RIESGO">En Riesgo</option>
                      </select>
                   </div>
                   
                   <button className="w-full py-3 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-[#b4ff6f] hover:text-black transition-colors border border-black flex items-center justify-center gap-2">
                      <Plus size={14} /> Registrar Nuevo Punto
                   </button>
                </div>
             </div>

             {/* List */}
             <div className="p-4 grid grid-cols-1 gap-2">
                {filteredData.map((item) => (
                   <div 
                     key={item.id}
                     // Interaction Update: Removed setCenter from hover
                     onMouseEnter={() => setHoveredId(item.id)}
                     onMouseLeave={() => setHoveredId(null)}
                     onClick={() => onSelectArea(item.id)}
                     className={`
                       flex border border-black bg-white cursor-pointer transition-all duration-200 h-20 group
                       ${hoveredId === item.id ? 'bg-gray-50 border-l-4 border-l-[#b4ff6f]' : 'hover:border-gray-400'}
                     `}
                   >
                      {/* Compact Image */}
                      <div className="w-20 shrink-0 border-r border-black overflow-hidden relative grayscale group-hover:grayscale-0 transition-all">
                         <img src={item.image} className="w-full h-full object-cover" />
                      </div>

                      {/* Compact Content */}
                      <div className="flex-1 p-2 pl-3 flex flex-col justify-center">
                         <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm leading-tight truncate pr-2">{item.name}</h3>
                            <span className="text-[9px] font-mono text-gray-400">#{item.id}</span>
                         </div>
                         
                         <p className="text-[10px] font-mono text-gray-500 truncate mt-0.5">{item.address}</p>
                         
                         <div className="flex items-center gap-2 mt-2">
                            <span className={`w-2 h-2 rounded-full ${item.need ? 'bg-red-400' : 'bg-green-400'}`}></span>
                            <span className="text-[9px] font-bold uppercase text-gray-400 group-hover:text-black">
                               {item.need ? 'Requiere Atención' : 'Estable'}
                            </span>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

// --- NEW COMPONENT: EventsPage ---

const EVENTS_DATA = [
  {
    id: 1,
    title: "Reforestación Urbana: Corredor Oriente",
    date: "2025-02-14", // Viernes
    time: "08:00 AM - 12:00 PM",
    isoStart: "20250214T080000",
    isoEnd: "20250214T120000",
    location: "Av. Tecnológico esq. Poliducto",
    category: "Voluntariado",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?q=80&w=1000&auto=format&fit=crop",
    description: "Únete a la brigada para plantar 50 mezquites nativos. Trae ropa cómoda, gorra y tu botella de agua. Nosotros ponemos la herramienta."
  },
  {
    id: 2,
    title: "Taller: Huertos en Espacios Pequeños",
    date: "2025-02-15", // Sábado
    time: "10:00 AM - 02:00 PM",
    isoStart: "20250215T100000",
    isoEnd: "20250215T140000",
    location: "Casa de la Cultura (Centro)",
    category: "Educación",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop",
    description: "Aprende a cultivar tus propios alimentos en macetas y balcones. Incluye kit de semillas de temporada."
  },
  {
    id: 3,
    title: "Avistamiento de Aves: Bosque de los Cobos",
    date: "2025-02-16", // Domingo
    time: "07:00 AM - 11:00 AM",
    isoStart: "20250216T070000",
    isoEnd: "20250216T110000",
    location: "Entrada Principal Bosque de los Cobos",
    category: "Recorrido",
    image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?q=80&w=1000&auto=format&fit=crop",
    description: "Caminata guiada por ornitólogos locales. Identificaremos especies migratorias que visitan nuestra ciudad en invierno."
  },
  {
    id: 4,
    title: "Mercado de Trueque y Reciclaje",
    date: "2025-02-16", // Domingo
    time: "11:00 AM - 04:00 PM",
    isoStart: "20250216T110000",
    isoEnd: "20250216T160000",
    location: "Parque Rodolfo Landeros",
    category: "Comunidad",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop",
    description: "Trae tus residuos separados (vidrio, cartón, electrónicos) y cámbialos por productos locales o plantas."
  }
];

const PAST_EVENTS_DATA = [
  {
    id: 1,
    title: "Limpieza Masiva: Río San Pedro",
    date: "2025-02-08",
    category: "Resultados",
    stats: "350kg Recolectados",
    summary: "Gracias a los 45 voluntarios que asistieron, logramos retirar más de media tonelada de residuos sólidos del cauce del río."
  },
  {
    id: 2,
    title: "Reforestación: Parque México",
    date: "2025-02-02",
    category: "Misión Cumplida",
    stats: "120 Árboles Plantados",
    summary: "Se plantaron especies nativas (Mezquite y Huizache) con una tasa de supervivencia esperada del 90% gracias al sistema de riego instalado."
  },
  {
    id: 3,
    title: "Censo Ciudadano: Centro Histórico",
    date: "2025-01-25",
    category: "Data",
    stats: "450 Árboles Catalogados",
    summary: "La brigada de datos completó el mapeo de 12 manzanas, identificando 3 árboles patrimoniales en riesgo que ya fueron reportados."
  }
];

// Helper to generate Google Calendar Link
const getGoogleCalendarUrl = (event: any) => {
  const details = encodeURIComponent(`${event.description}\n\nOrganizado por Mapeo Verde`);
  const location = encodeURIComponent(event.location);
  const title = encodeURIComponent(event.title);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${event.isoStart}/${event.isoEnd}&details=${details}&location=${location}`;
};

// Helper to generate .ics file content (basic)
const downloadICS = (event: any) => {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mapeo Verde//Events//EN
BEGIN:VEVENT
UID:${event.id}@mapeoverde.org
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${event.isoStart}
DTEND:${event.isoEnd}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const EventsPage = ({ onSelectImpact }) => {
  const { events: EVENTS_DATA, pastEvents: PAST_EVENTS_DATA } = React.useContext(DataContext);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState("2025-02-14"); // Default to a date with events
  
  // Helper to get days of current week (Mocking a specific week for demo)
  const weekDays = [
    { label: "LUN", date: "2025-02-10", num: "10" },
    { label: "MAR", date: "2025-02-11", num: "11" },
    { label: "MIE", date: "2025-02-12", num: "12" },
    { label: "JUE", date: "2025-02-13", num: "13" },
    { label: "VIE", date: "2025-02-14", num: "14" },
    { label: "SAB", date: "2025-02-15", num: "15" },
    { label: "DOM", date: "2025-02-16", num: "16" },
  ];

  // Helper for Month View (February 2025)
  // Feb 1st 2025 is Saturday
  const monthDays = Array.from({ length: 28 }, (_, i) => {
     const dayNum = i + 1;
     const dateStr = `2025-02-${dayNum.toString().padStart(2, '0')}`;
     return { num: dayNum, date: dateStr };
  });
  const monthOffset = 5; // Empty slots for Mon-Fri before Feb 1st

  const filteredEvents = EVENTS_DATA.filter(e => e.date === selectedDate);

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col">
       
       {/* Header Section */}
       <div className="bg-[#ff7e67] border-b border-black p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div>
                <div className="inline-flex items-center gap-2 border border-black bg-white px-3 py-1 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <Calendar size={14} />
                   <span className="font-mono text-xs uppercase tracking-widest font-bold">Febrero 2025</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tighter text-black">
                   AGENDA<br/>AMBIENTAL
                </h1>
             </div>
             
             <div className="flex flex-col items-end gap-4">
                <div className="flex bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <button 
                     onClick={() => setViewMode('week')}
                     className={`px-4 py-2 font-mono text-sm uppercase font-bold border-r border-black hover:bg-gray-100 ${viewMode === 'week' ? 'bg-black text-white hover:bg-black' : ''}`}
                   >
                      Semanal
                   </button>
                   <button 
                     onClick={() => setViewMode('month')}
                     className={`px-4 py-2 font-mono text-sm uppercase font-bold hover:bg-gray-100 ${viewMode === 'month' ? 'bg-black text-white hover:bg-black' : ''}`}
                   >
                      Mensual
                   </button>
                </div>
                <p className="font-serif text-lg max-w-md text-right font-medium hidden md:block">
                   Encuentra actividades, talleres y voluntariados cerca de ti.
                </p>
             </div>
          </div>
       </div>

       {/* VIEW MODE: WEEKLY STRIP */}
       {viewMode === 'week' && (
           <div className="bg-black text-white border-b border-black sticky top-0 z-30 overflow-x-auto scrollbar-hide">
              <div className="flex min-w-full">
                 {weekDays.map((day) => (
                    <button 
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`
                        flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center border-r border-white/20 transition-colors relative
                        ${selectedDate === day.date ? 'bg-white text-black' : 'hover:bg-zinc-800'}
                      `}
                    >
                       <span className="text-[10px] font-mono tracking-widest mb-1 opacity-60">{day.label}</span>
                       <span className="text-2xl font-bold">{day.num}</span>
                       {EVENTS_DATA.some(e => e.date === day.date) && (
                          <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${selectedDate === day.date ? 'bg-[#ff7e67]' : 'bg-[#ff7e67]'}`} />
                       )}
                    </button>
                 ))}
              </div>
           </div>
       )}

       {/* VIEW MODE: MONTHLY GRID */}
       {viewMode === 'month' && (
          <div className="bg-[#f3f4f0] p-6 border-b border-black">
             <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-7 gap-px bg-black border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                   {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                      <div key={d} className="bg-black text-white text-center py-2 font-mono text-xs font-bold uppercase">{d}</div>
                   ))}
                   
                   {/* Empty slots */}
                   {Array.from({ length: monthOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-white h-24 md:h-32 opacity-50 relative">
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                      </div>
                   ))}

                   {/* Days */}
                   {monthDays.map((day) => {
                      const dayEvents = EVENTS_DATA.filter(e => e.date === day.date);
                      const isSelected = selectedDate === day.date;
                      
                      return (
                         <button 
                           key={day.date}
                           onClick={() => { setSelectedDate(day.date); setViewMode('week'); }}
                           className={`bg-white h-24 md:h-32 p-2 flex flex-col items-start hover:bg-[#ff7e67]/20 transition-colors relative text-left group
                              ${isSelected ? 'ring-inset ring-4 ring-[#ff7e67]' : ''}
                           `}
                         >
                            <span className={`font-mono font-bold text-sm ${isSelected ? 'text-[#ff7e67]' : 'text-gray-400 group-hover:text-black'}`}>{day.num}</span>
                            
                            <div className="mt-auto w-full space-y-1">
                               {dayEvents.map(ev => (
                                  <div key={ev.id} className="w-full truncate text-[9px] md:text-[10px] bg-black text-white px-1 py-0.5 rounded-none font-medium">
                                     {ev.title}
                                  </div>
                               ))}
                            </div>
                         </button>
                      );
                   })}
                </div>
             </div>
          </div>
       )}

       {/* Events List (Shown in both views, driven by selectedDate) */}
       <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
          {filteredEvents.length > 0 ? (
             <div className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                   <h2 className="text-2xl font-bold uppercase tracking-tight">
                      {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                   </h2>
                </div>

                {filteredEvents.map((event) => (
                   <motion.div 
                     key={event.id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="group border-2 border-black bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_#ff7e67] transition-all flex flex-col md:flex-row overflow-hidden"
                   >
                      {/* Date Box (Left) */}
                      <div className="bg-[#ff7e67] text-black w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-4 border-b-2 md:border-b-0 md:border-r-2 border-black shrink-0 gap-2 md:gap-0">
                         <span className="font-mono text-xs uppercase tracking-widest text-black/60">FEB</span>
                         <span className="text-4xl font-bold">{event.date.split('-')[2]}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                         <div>
                            <div className="flex justify-between items-start mb-2">
                               <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                                  {event.category}
                               </span>
                               <span className="font-mono text-xs flex items-center gap-1">
                                  {event.time}
                               </span>
                            </div>
                            <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-[#ff7e67] transition-colors">
                               {event.title}
                            </h3>
                            <p className="font-serif text-gray-600 mb-6 text-sm leading-relaxed">
                               {event.description}
                            </p>
                         </div>
                         
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-dashed border-gray-300 pt-4">
                            <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                               <MapPin size={14} className="text-[#ff7e67]" />
                               {event.location}
                            </div>

                            {/* Add to Calendar Actions */}
                            <div className="flex gap-2 w-full md:w-auto">
                               <a 
                                 href={getGoogleCalendarUrl(event)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] hover:text-black transition-colors"
                               >
                                  <ExternalLink size={12} />
                                  Google
                               </a>
                               <button 
                                 onClick={() => downloadICS(event)}
                                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-black text-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors"
                               >
                                  <Download size={12} />
                                  .ICS
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* Image (Right Desktop / Bottom Mobile) */}
                      <div className="w-full md:w-64 h-48 md:h-auto border-t-2 md:border-t-0 md:border-l-2 border-black relative overflow-hidden hidden md:block">
                         <img 
                           src={event.image} 
                           alt={event.title} 
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                         />
                         <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                      </div>
                   </motion.div>
                ))}
             </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center py-24 text-gray-400 opacity-50">
                <Calendar size={64} strokeWidth={1} className="mb-4" />
                <p className="font-mono text-lg uppercase">No hay eventos programados</p>
                <p className="font-serif">Selecciona otro día en el calendario.</p>
             </div>
          )}
       </div>

       {/* PAST EVENTS / RESULTS SECTION */}
       <div className="border-t-4 border-black bg-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="flex items-end justify-between mb-12 gap-4 border-b border-black pb-4">
                  <div>
                     <span className="font-mono text-xs font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Archivo de Misiones</span>
                     <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mt-2">Bitácora<br/>de Impacto</h2>
                  </div>
                  <button className="hidden md:block px-6 py-2 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Ver Historial Completo
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {PAST_EVENTS_DATA.map(event => (
                      <div key={event.id} className="flex flex-col border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-zinc-50 h-full relative overflow-hidden group">
                          {/* Stamp effect */}
                          <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                             <div className="border-4 border-black rounded-full p-4 w-32 h-32 flex items-center justify-center">
                                <span className="font-black text-xs uppercase text-center rotate-[-12deg]">Misión<br/>Completada</span>
                             </div>
                          </div>

                          <div className="flex justify-between items-center mb-4 relative z-10">
                              <span className="bg-[#b4ff6f] border border-black text-black text-[10px] font-mono px-2 py-1 uppercase font-bold">{event.category}</span>
                              <span className="font-mono text-xs text-gray-500 line-through decoration-black">{event.date}</span>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-2 leading-tight flex-grow">{event.title}</h3>
                          
                          <div className="font-mono text-2xl font-black text-[#ff7e67] mb-4">
                             {event.stats}
                          </div>

                          <p className="font-serif text-sm text-gray-600 mb-6 line-clamp-3">
                              {event.summary}
                          </p>
                          
                          <div className="mt-auto pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
                             <span className="text-xs font-mono uppercase text-gray-400">Estado: Finalizado</span>
                             <button 
                                onClick={() => onSelectImpact(event.id)}
                                className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
                             >
                                <ArrowRight size={14} />
                             </button>
                          </div>
                      </div>
                  ))}
              </div>
               <div className="mt-8 md:hidden">
                  <button className="w-full px-6 py-4 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Ver Historial
                  </button>
              </div>
          </div>
       </div>

       {/* SUBSCRIPTION CTA */}
       <div className="bg-[#ff7e67] border-t-4 border-black py-20 px-6 relative overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-block bg-black text-white px-4 py-1 font-mono text-xs uppercase tracking-widest mb-6 rotate-[-2deg]">
                  Boletín Semanal
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[0.9] tracking-tighter text-black">
                  NO TE PIERDAS<br/>LA ACCIÓN
              </h2>
              <p className="font-serif text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                  Recibe cada lunes en tu correo la agenda curada de eventos, convocatorias de voluntariado y las noticias ambientales más relevantes.
              </p>

              <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                  <input 
                      type="email" 
                      placeholder="tu@correo.com" 
                      className="flex-1 border-2 border-black p-4 text-lg placeholder:text-black/40 focus:outline-none focus:bg-white bg-white/50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <button className="bg-black text-white px-8 py-4 text-lg font-bold uppercase tracking-widest hover:bg-white hover:text-black border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none">
                      Suscribirme
                  </button>
              </form>
              <p className="mt-4 text-xs font-mono opacity-60">Sin spam. Solo contenido verde de calidad.</p>
          </div>
       </div>

    </div>
  );
};

// --- NEW COMPONENT: ImpactDetailPage ---

const ImpactDetailPage = ({ eventId, onBack }) => {
  const event = PAST_EVENTS_DATA.find(e => e.id === eventId);
  
  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center pb-20">
      {/* Header Image */}
      <div className="w-full h-[40vh] bg-black relative overflow-hidden border-b-4 border-black">
        <div className="absolute inset-0 opacity-60">
           <img src="https://images.unsplash.com/photo-1596276122653-651a3898309f?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-t from-black to-transparent">
           <button onClick={onBack} className="mb-6 flex items-center gap-2 text-white font-mono uppercase text-xs hover:underline">
              <ChevronLeft size={16}/> Volver a la Bitácora
           </button>
           <span className="bg-[#b4ff6f] text-black px-3 py-1 font-mono text-xs font-bold uppercase border border-black shadow-[4px_4px_0px_0px_white]">
              {event.category}
           </span>
           <h1 className="text-4xl md:text-6xl font-black text-white mt-4 leading-none tracking-tighter">
              {event.title}
           </h1>
        </div>
      </div>

      <div className="max-w-3xl w-full px-6 -mt-10 relative z-10">
         <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-6 mb-6">
               <div>
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Fecha de Ejecución</p>
                  <p className="font-bold text-xl">{event.date}</p>
               </div>
               <div className="text-right">
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Impacto Directo</p>
                  <p className="font-black text-2xl text-[#ff7e67]">{event.stats}</p>
               </div>
            </div>
            
            <div className="prose prose-lg font-serif">
               <p className="text-xl leading-relaxed text-gray-800">
                  {event.summary}
               </p>
               <p>
                  La jornada comenzó a las 8:00 AM con la participación de vecinos, estudiantes y organizaciones locales. Se realizó primero una capacitación breve sobre el manejo de residuos y seguridad.
               </p>
               <p>
                  Además de la recolección, se clasificaron los materiales para asegurar su reciclaje efectivo. Este esfuerzo conjunto no solo mejora la estética del lugar, sino que previene la contaminación del agua y reduce riesgos de inundaciones.
               </p>
            </div>

            <div className="mt-12 bg-gray-100 p-6 border border-black">
               <h3 className="font-bold uppercase text-sm mb-4">Galería de Evidencia</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gray-300 border border-black relative">
                     <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">FOTO 1</div>
                  </div>
                  <div className="aspect-square bg-gray-300 border border-black relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">FOTO 2</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="fixed bottom-6 left-0 w-full px-6 z-50 flex justify-center pointer-events-none">
         <button className="pointer-events-auto w-[90vw] max-w-md bg-black text-white font-bold uppercase tracking-widest py-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-white">
            Participar en la Siguiente Misión <ArrowRight size={20}/>
         </button>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: GreenAreaDetailPage ---

const GreenAreaDetailPage = ({ areaId, onBack }) => {
  const area = GREEN_AREAS_DATA.find(a => a.id === areaId);
  
  if (!area) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center pb-24">
      {/* Header Image */}
      <div className="w-full h-[45vh] relative border-b-4 border-black">
        <img src={area.image} className="w-full h-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <div className="absolute top-6 left-6">
           <button onClick={onBack} className="bg-white border border-black px-4 py-2 font-mono text-xs uppercase font-bold shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2">
              <ChevronLeft size={14}/> Regresar al Mapa
           </button>
        </div>

        <div className="absolute bottom-8 left-6 right-6 text-white">
           <div className="flex gap-2 mb-4">
              {area.tags.map(tag => (
                 <span key={tag} className="bg-[#b4ff6f] text-black px-2 py-1 font-mono text-[10px] uppercase font-bold border border-black">
                    {tag}
                 </span>
              ))}
           </div>
           <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-2">{area.name}</h1>
           <p className="font-mono text-sm opacity-80 flex items-center gap-2">
              <MapPin size={16} /> {area.address}
           </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 w-full max-w-4xl mx-auto -mt-6 relative z-10 px-4 gap-2 md:gap-4">
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Árboles</p>
            <p className="text-2xl font-black">1,240</p>
         </div>
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Superficie</p>
            <p className="text-2xl font-black">4.5 Ha</p>
         </div>
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Salud</p>
            <p className="text-2xl font-black text-green-600">85%</p>
         </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-6 mt-12 space-y-8">
         {/* Main Need */}
         <div className="bg-[#fff0f0] border-l-8 border-red-500 p-6">
            <h3 className="font-bold uppercase text-red-600 flex items-center gap-2 mb-2">
               <AlertCircle size={20}/> Necesidad Prioritaria
            </h3>
            <p className="text-xl font-medium">{area.need}</p>
            <p className="text-sm text-gray-600 mt-2">
               Este espacio requiere intervención urgente. Se han reportado múltiples incidentes en el último mes.
            </p>
         </div>

         {/* Description */}
         <div>
            <h3 className="font-bold text-2xl mb-4 border-b border-black pb-2">Acerca del Lugar</h3>
            <p className="font-serif text-lg leading-relaxed text-gray-700">
               Este espacio verde es fundamental para la regulación térmica de la zona. Cuenta con especies nativas de más de 50 años. Es un punto de encuentro vital para los vecinos de la colonia y sirve como corredor para aves migratorias.
            </p>
         </div>

         {/* Mini Map Preview */}
         <div className="bg-gray-200 h-48 w-full border-2 border-black relative">
            <div className="absolute inset-0 flex items-center justify-center">
               <p className="font-mono text-xs uppercase font-bold text-gray-500">[ VISTA DE MAPA SATELITAL ]</p>
            </div>
         </div>
      </div>

      {/* Floating CTAs */}
      <div className="fixed bottom-6 left-0 w-full px-4 z-50 flex flex-col items-center gap-3 pointer-events-none">
         <button className="pointer-events-auto w-[90vw] max-w-md bg-white text-black font-bold uppercase tracking-widest py-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-black">
            <AlertCircle size={20} className="text-red-500"/> Reportar Incidente
         </button>
         <button className="pointer-events-auto w-[90vw] max-w-md bg-[#b4ff6f] text-black font-bold uppercase tracking-widest py-4 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 border-2 border-black">
            <TreePine size={20}/> Voluntariado Aquí
         </button>
      </div>
    </div>
  );
};



const ParticipationPage = () => {
  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col">
       {/* Header */}
       <div className="bg-[#d89dff] border-b border-black p-12 md:p-24 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto">
             <div className="inline-block border border-black bg-white px-4 py-1 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">Únete a la Brigada</span>
             </div>
             <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
                TU CIUDAD<br/>TE NECESITA
             </h1>
             <p className="font-serif text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed text-black/80">
                No somos una empresa. Somos una red descentralizada de ciudadanos construyendo la base de datos ambiental más grande de la región.
             </p>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <svg width="100%" height="100%">
                <pattern id="p-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                   <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#p-grid)" />
             </svg>
          </div>
       </div>

       {/* Roles Grid */}
       <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-4 border-black pb-4 gap-4">
             <h2 className="text-4xl font-bold tracking-tight">¿CÓMO PUEDES AYUDAR?</h2>
             <p className="font-mono text-sm max-w-md text-right md:text-left">
                Existen múltiples formas de colaborar, desde salir a la calle hasta analizar datos desde tu casa.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* Role 1 */}
             <div className="flex flex-col border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full mb-6 border-2 border-[#d89dff]">
                   <Camera size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Explorador Urbano</h3>
                <p className="font-serif text-gray-600 mb-6 flex-grow">
                   Sal a las calles de tu colonia. Tu misión es fotografiar, medir y georreferenciar árboles y áreas verdes usando nuestra app web.
                </p>
                <div className="border-t border-dashed border-gray-300 pt-4 mb-8">
                    <ul className="text-xs font-mono space-y-2 text-gray-500 uppercase">
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#d89dff]"/> Smartphone con GPS</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#d89dff]"/> Caminatas al aire libre</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#d89dff]"/> Sin experiencia previa</li>
                    </ul>
                </div>
                <button className="w-full py-4 border-2 border-black bg-[#d89dff] font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
                   Quiero Mapear
                </button>
             </div>

             {/* Role 2 */}
             <div className="flex flex-col border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full mb-6 border-2 border-[#b4ff6f]">
                   <Search size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Analista de Datos</h3>
                <p className="font-serif text-gray-600 mb-6 flex-grow">
                   Verifica la calidad de la información desde casa. Ayuda a identificar especies en las fotos y valida reportes de alertas ciudadanas.
                </p>
                <div className="border-t border-dashed border-gray-300 pt-4 mb-8">
                    <ul className="text-xs font-mono space-y-2 text-gray-500 uppercase">
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#b4ff6f]"/> Computadora / Tablet</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#b4ff6f]"/> Curiosidad botánica</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#b4ff6f]"/> Atención al detalle</li>
                    </ul>
                </div>
                <button className="w-full py-4 border-2 border-black bg-[#b4ff6f] font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
                   Quiero Validar
                </button>
             </div>

             {/* Role 3 */}
             <div className="flex flex-col border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300">
                <div className="bg-black text-white w-16 h-16 flex items-center justify-center rounded-full mb-6 border-2 border-[#fccb4e]">
                   <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Investigador</h3>
                <p className="font-serif text-gray-600 mb-6 flex-grow">
                   Usa nuestros datos abiertos para generar reportes, tesis académicas o artículos periodísticos sobre el estado ambiental de la ciudad.
                </p>
                <div className="border-t border-dashed border-gray-300 pt-4 mb-8">
                    <ul className="text-xs font-mono space-y-2 text-gray-500 uppercase">
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#fccb4e]"/> Análisis de datos</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#fccb4e]"/> Generación de impacto</li>
                       <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#fccb4e]"/> Publicación libre</li>
                    </ul>
                </div>
                <button className="w-full py-4 border-2 border-black bg-[#fccb4e] font-bold uppercase hover:bg-black hover:text-white transition-colors tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1">
                   Descargar Datos
                </button>
             </div>
          </div>
       </div>

       {/* Registration Form */}
       <div className="bg-black text-white py-24 px-6 border-t border-black relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-white/20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 border-r border-t border-white/20"></div>

          <div className="max-w-4xl mx-auto relative z-10">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-white/20 pb-8">
                <div className="w-16 h-16 bg-[#d89dff] text-black flex items-center justify-center rounded-full shrink-0">
                    <ArrowDown size={32} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">Registro de Voluntarios</h2>
                    <p className="font-serif text-gray-400 mt-2 text-lg">Únete a nuestra comunidad en WhatsApp y recibe tu kit de bienvenida digital.</p>
                </div>
             </div>
             
             <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                   <div className="space-y-4 group">
                      <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-white transition-colors">Nombre Completo</label>
                      <input type="text" className="w-full bg-transparent border-b-2 border-white/30 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-white/20" placeholder="Escribe tu nombre..." />
                   </div>
                   <div className="space-y-4 group">
                      <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-white transition-colors">Correo Electrónico</label>
                      <input type="email" className="w-full bg-transparent border-b-2 border-white/30 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-white/20" placeholder="tucorreo@ejemplo.com" />
                   </div>
                </div>
                
                <div className="space-y-6 pt-8">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] block">Me interesa participar como (Selecciona varios):</label>
                   <div className="flex flex-wrap gap-4">
                      {['Explorador', 'Analista', 'Investigador', 'Desarrollador', 'Difusión'].map(role => (
                         <label key={role} className="flex items-center gap-3 cursor-pointer group select-none">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="w-8 h-8 border-2 border-white peer-checked:bg-[#d89dff] peer-checked:border-[#d89dff] flex items-center justify-center transition-all">
                               <div className="w-4 h-4 bg-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-bold text-xl text-white peer-checked:text-[#d89dff] transition-colors">{role}</span>
                         </label>
                      ))}
                   </div>
                </div>

                <div className="pt-16 flex flex-col md:flex-row gap-6 items-center">
                   <button className="w-full md:w-auto px-12 py-5 bg-[#d89dff] text-black text-xl font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-1 active:shadow-none">
                      Enviar Registro
                   </button>
                   <p className="text-xs font-mono text-gray-500 max-w-xs text-center md:text-left">
                      Al registrarte aceptas nuestra política de datos abiertos y privacidad. No compartimos tus datos.
                   </p>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
};

// Placeholder component for new pages
const PlaceholderPage = ({ title }) => {
  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 bg-[#f3f4f0]">
      <div className="max-w-2xl p-12 border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl md:text-5xl font-sans font-bold mb-6">{title}</h2>
        <p className="text-xl text-gray-600 font-serif">
          Esta sección está en construcción. Próximamente encontrará información detallada sobre {title.toLowerCase()}.
        </p>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#f3f4f0] text-black pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-black pb-16 mb-8">
        <div className="col-span-1 md:col-span-2">
           <h4 className="text-2xl font-bold mb-6">OpenSci Platform</h4>
           <p className="max-w-sm font-serif text-lg">
             Una iniciativa global para democratizar el acceso a la información científica y empoderar a las comunidades locales.
           </p>
        </div>
        
        <div>
          <h5 className="font-mono text-xs uppercase mb-6 tracking-widest">Explorar</h5>
          <ul className="space-y-3 font-medium">
            <li><a href="#" className="hover:underline">Datasets</a></li>
            <li><a href="#" className="hover:underline">Proyectos</a></li>
            <li><a href="#" className="hover:underline">Comunidad</a></li>
            <li><a href="#" className="hover:underline">Blog</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-mono text-xs uppercase mb-6 tracking-widest">Legal</h5>
          <ul className="space-y-3 font-medium">
            <li><a href="#" className="hover:underline">Privacidad</a></li>
            <li><a href="#" className="hover:underline">Términos</a></li>
            <li><a href="#" className="hover:underline">Cookies</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-mono uppercase text-gray-500">
        <p>© 2025 OPENSCI PLATFORM. TODOS LOS DERECHOS RESERVADOS.</p>
        <p className="mt-2 md:mt-0">DISEÑADO CON ♥ POR ORÉGANO STUDIO</p>
      </div>
    </footer>
  );
};

const MainApp = () => {
  const { greenAreas: GREEN_AREAS_DATA, projects: PROJECTS_DATA, gazettes: GAZETTES_DATA, events: EVENTS_DATA } = React.useContext(DataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = pathToTab(location.pathname);
  const [selectedImpactId, setSelectedImpactId] = useState(null);
  const [selectedGreenAreaId, setSelectedGreenAreaId] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const hoverTimeoutRef = React.useRef(null);

  const handleFeatureEnter = (feature) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredFeature(feature);
  };

  const handleFeatureLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredFeature(null);
    }, 300);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, selectedImpactId, selectedGreenAreaId]);

  const handleNavigate = (tab) => {
    navigate(TAB_ROUTES[tab] || '/');
    setSelectedImpactId(null);
    setSelectedGreenAreaId(null);
  };

  const handleSelectImpact = (id) => {
     setSelectedImpactId(id);
  };

  const handleSelectGreenArea = (id) => {
     setSelectedGreenAreaId(id);
  };

  // Override content if a detail view is active
  if (selectedImpactId) {
     return (
        <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black flex flex-col">
           <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
           <main className="flex-grow">
              <ImpactDetailPage eventId={selectedImpactId} onBack={() => setSelectedImpactId(null)} />
           </main>
           <Footer />
        </div>
     );
  }

  if (selectedGreenAreaId) {
     return (
        <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black flex flex-col">
           <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
           <main className="flex-grow">
              <GreenAreaDetailPage areaId={selectedGreenAreaId} onBack={() => setSelectedGreenAreaId(null)} />
           </main>
           <Footer />
        </div>
     );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'HOME':
        return (
          <>
            <HeroSection />
            <TextContentSection />
            <StatsSection />
            <FeatureList onFeatureEnter={handleFeatureEnter} onFeatureLeave={handleFeatureLeave} />
            <AnimatePresence>
            {hoveredFeature && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="w-full bg-[#f3f4f0] border-b border-black overflow-hidden"
                onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
                onMouseLeave={() => { hoverTimeoutRef.current = setTimeout(() => setHoveredFeature(null), 300); }}
              >
                  <div className="py-12 px-6">
                    <div className="max-w-7xl mx-auto">
                       <h2 className="text-3xl font-bold mb-8 text-center uppercase">
                         {hoveredFeature === 'Áreas Verdes' && "Explora nuestras áreas verdes"}
                         {hoveredFeature === 'Boletines' && "Boletines Recientes"}
                         {hoveredFeature === 'Gacetas' && "Gacetas Ambientales"}
                         {hoveredFeature === 'Agenda' && "Próximos Eventos"}
                       </h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {(() => {
                             let data = [];
                             if (hoveredFeature === 'Áreas Verdes') data = GREEN_AREAS_DATA;
                             else if (hoveredFeature === 'Boletines') data = PROJECTS_DATA;
                             else if (hoveredFeature === 'Gacetas') data = GAZETTES_DATA;
                             else if (hoveredFeature === 'Agenda') data = EVENTS_DATA;
                             
                             return data.slice(0, 4).map((item, idx) => (
                               <div 
                                 key={item.id || idx} 
                                 onClick={() => {
                                   if (hoveredFeature === 'Áreas Verdes') {
                                       handleSelectGreenArea(item.id);
                                       handleNavigate('GREEN_AREAS');
                                   } else if (hoveredFeature === 'Boletines') {
                                       handleNavigate('NEWSLETTERS');
                                   } else if (hoveredFeature === 'Gacetas') {
                                       handleNavigate('GAZETTES');
                                   } else if (hoveredFeature === 'Agenda') {
                                       handleNavigate('AGENDA');
                                   }
                                 }}
                                 className="border-2 border-black bg-white cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group h-full flex flex-col"
                               >
                                  {/* Image or Icon Section */}
                                  <div className="h-48 overflow-hidden border-b-2 border-black relative bg-gray-100 flex items-center justify-center">
                                     {item.image ? (
                                        <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                     ) : (
                                        <div className="p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                           {hoveredFeature === 'Boletines' && <LayoutGrid size={64} strokeWidth={1} />}
                                           {hoveredFeature === 'Gacetas' && <FileText size={64} strokeWidth={1} />}
                                        </div>
                                     )}
                                     
                                     <div className="absolute top-2 right-2 bg-white border border-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight size={16} />
                                     </div>
                                  </div>
                                  
                                  {/* Content Section */}
                                  <div className="p-4 flex-grow">
                                     <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2">
                                       {item.name || item.project || item.title}
                                     </h3>
                                     <p className="text-xs font-mono text-gray-500 truncate">
                                       {item.address || item.status || item.date}
                                     </p>
                                  </div>
                               </div>
                             ));
                          })()}
                       </div>
                    </div>
                  </div>
              </motion.div>
            )}
            </AnimatePresence>
            <CtaSection />
          </>
        );
      case 'GREEN_AREAS':
        return <GreenAreasPage onSelectArea={handleSelectGreenArea} />;
      case 'NEWSLETTERS':
        return <NewslettersPage />;
      case 'GAZETTES':
        return <GazettesPage />;
      case 'AGENDA':
        return <EventsPage onSelectImpact={handleSelectImpact} />;
      case 'PARTICIPATION':
        return <ParticipationPage />;
      default:
        return (
          <>
            <HeroSection />
            <TextContentSection />
            <StatsSection />
            <FeatureList />
            <CtaSection />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black flex flex-col">
      <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/agenda" element={<MainApp />} />
        <Route path="/areas-verdes" element={<MainApp />} />
        <Route path="/boletines" element={<MainApp />} />
        <Route path="/gacetas" element={<MainApp />} />
        <Route path="/participacion" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}
