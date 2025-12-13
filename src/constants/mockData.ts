import { MOCK_IMAGES } from '../utils/images';

export const KPI_DATA = [
  { label: "Boletín Actual", value: "Semanas 01-02", change: "Activo" },
  { label: "Proyectos Ingresados", value: "142", change: "+12 vs mes anterior" },
  { label: "Resolutivos Emitidos", value: "89", change: "65% Aprobados" },
];

export const GREEN_AREAS_DATA = [
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

export const GAZETTES_DATA = [
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
  // Datos generados para paginación
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

