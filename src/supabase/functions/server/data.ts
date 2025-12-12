export const PROJECTS_DATA = [
  {
    id: "MIA-2025-001",
    project: "Plaza Comercial 'Los Encinos'",
    promoter: "Desarrollos Inmobiliarios del Centro S.A.",
    type: "Ingreso de Proyecto",
    date: "2025-01-10",
    year: "2025",
    status: "En Evaluación",
    lat: 21.9123,
    lng: -102.2916,
    description: "Construcción de plaza comercial de 2 niveles con estacionamiento subterráneo. Incluye la remoción de capa vegetal en 2000m2.",
    impact: "Alto Impacto"
  },
  {
    id: "RES-2024-089",
    project: "Gasolinera Servicio Norte",
    promoter: "Energéticos de Aguascalientes",
    type: "Resolutivo Emitido",
    date: "2024-12-15",
    year: "2024",
    status: "Aprobado Condicionado",
    lat: 21.9300,
    lng: -102.2800,
    description: "Estación de servicio urbano con 4 dispensarios. Se condiciona a la instalación de sistemas de recuperación de vapores de última generación.",
    impact: "Riesgo Ambiental"
  },
  {
    id: "MIA-2025-002",
    project: "Fraccionamiento Residencial 'Vista Verde'",
    promoter: "Grupo Constructor Alfa",
    type: "Ingreso de Proyecto",
    date: "2025-01-12",
    year: "2025",
    status: "En Evaluación",
    lat: 21.8500,
    lng: -102.3200,
    description: "Desarrollo habitacional de 500 viviendas unifamiliares. Requiere cambio de uso de suelo de agrícola a habitacional densidad media.",
    impact: "Cambio de Uso de Suelo"
  },
  {
    id: "RES-2024-085",
    project: "Ampliación Nave Industrial Nissan",
    promoter: "Nissan Mexicana S.A. de C.V.",
    type: "Resolutivo Emitido",
    date: "2024-12-01",
    year: "2024",
    status: "Aprobado",
    lat: 21.8200,
    lng: -102.2950,
    description: "Ampliación de línea de producción A2. No requiere desmonte de vegetación nativa. Cumple con normatividad de emisiones.",
    impact: "Industrial"
  },
  {
    id: "MIA-2025-003",
    project: "Tala de Arbolado Urbano Av. Universidad",
    promoter: "Municipio de Aguascalientes",
    type: "Ingreso de Proyecto",
    date: "2025-01-14",
    year: "2025",
    status: "Consulta Pública",
    lat: 21.9000,
    lng: -102.3100,
    description: "Solicitud de derribo de 15 especímenes (Ficus benjamina) por conflicto con infraestructura vial y riesgo de caída.",
    impact: "Pérdida de Cubierta Vegetal"
  },
  {
    id: "RES-2024-070",
    project: "Relleno Sanitario 'San Nicolás' Etapa IV",
    promoter: "Proactiva Medio Ambiente",
    type: "Resolutivo Emitido",
    date: "2024-11-20",
    year: "2024",
    status: "Denegado",
    lat: 21.8000,
    lng: -102.2500,
    description: "Expansión de celdas de confinamiento. Denegado por proximidad a mantos acuíferos superficiales.",
    impact: "Alto Riesgo"
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
    description: "Exploración minera para extracción de agregados pétreos en zona serrana."
  }
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
    image: "https://images.unsplash.com/photo-1596276122653-651a3898309f?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Parque Tres Centurias",
    address: "Av. Alameda 301, Barrio de la Estación",
    lat: 21.8943,
    lng: -102.2832,
    tags: ["Parque Recreativo", "Patrimonio Industrial"],
    need: "Reforestación zona norte",
    image: "https://images.unsplash.com/photo-1555899434-94d1368b7af6?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Parque Rodolfo Landeros",
    address: "Blvd. José María Chávez s/n",
    lat: 21.8605,
    lng: -102.2850,
    tags: ["Reserva Ecológica", "Fauna"],
    need: "Sistema de riego eficiente",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Línea Verde (Tramo 1)",
    address: "Av. Poliducto, Villas de Nuestra Señora",
    lat: 21.9050,
    lng: -102.2550,
    tags: ["Corredor Biológico", "Deportivo"],
    need: "Seguridad e iluminación",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop"
  }
];

export const EVENTS_DATA = [
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

export const PAST_EVENTS_DATA = [
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