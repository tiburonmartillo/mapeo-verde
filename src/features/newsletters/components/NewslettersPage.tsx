import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Search, List, LayoutGrid, ChevronLeft, ChevronRight, MapPin, Download, FileText, AlertCircle, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { useContext } from 'react';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { convertToLatLong } from '../../../utils/helpers/coordinateConverter';

const KPI_DATA = [
  { label: "PROYECTOS ANALIZADOS", value: "285", change: "+12%" },
  { label: "EXPEDIENTES PÚBLICOS", value: "2,547", change: "+34%" },
  { label: "ALERTAS CIUDADANAS", value: "1,200+", change: "+89%" }
];

const NewslettersPage = () => {
  const { projects: PROJECTS_DATA } = useContext(DataContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Default to grid on mobile, table on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'table';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Switch to grid on mobile, table on desktop
      if (mobile && viewMode === 'table') {
        setViewMode('grid');
      } else if (!mobile && viewMode === 'grid') {
        setViewMode('table');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [viewMode]);

  // Get navbar height on mount, resize, and scroll (for mobile navbar visibility)
  useEffect(() => {
    const updateNavbarHeight = () => {
      setNavbarHeight(getNavbarHeight());
    };

    const handleScroll = () => {
      // Solo en móvil: detectar si el navbar está oculto
      if (window.innerWidth < 768) {
        const currentScrollY = window.scrollY;
        const navbarMobile = document.querySelector('[data-navbar-mobile]') as HTMLElement;

        if (navbarMobile) {
          // Verificar si el navbar tiene la clase translate-y-full (oculto)
          const isHidden = navbarMobile.classList.contains('-translate-y-full');
          setIsNavbarVisible(!isHidden);

          // Si el navbar está oculto, el sticky debe estar en top: 0
          if (isHidden) {
            setNavbarHeight(0);
          } else {
            updateNavbarHeight();
          }
        }
        lastScrollYRef.current = currentScrollY;
      } else {
        // En desktop, siempre usar la altura del navbar
        updateNavbarHeight();
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Observar cambios en el navbar móvil usando MutationObserver
    const navbarMobile = document.querySelector('[data-navbar-mobile]');
    if (navbarMobile && window.innerWidth < 768) {
      const observer = new MutationObserver(() => {
        const isHidden = navbarMobile.classList.contains('-translate-y-full');
        setIsNavbarVisible(!isHidden);
        if (isHidden) {
          setNavbarHeight(0);
        } else {
          updateNavbarHeight();
        }
      });

      observer.observe(navbarMobile, {
        attributes: true,
        attributeFilter: ['class']
      });

      return () => {
        window.removeEventListener('resize', updateNavbarHeight);
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }

    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const years = useMemo(() => {
    const allYears = PROJECTS_DATA.map(p => p.year).filter(Boolean);
    const unique = Array.from(new Set(allYears));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [PROJECTS_DATA]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || 'all');
  const [center, setCenter] = useState<[number, number]>([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(12);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isProgrammaticChange = useRef(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(400);

  // Filtros avanzados


  // Filter projects logic
  const filteredByYear = useMemo(() => {
    let filtered = PROJECTS_DATA;

    // Filtro por año
    const yearFilter = selectedYear === 'all' ? undefined : selectedYear;
    if (yearFilter) {
      filtered = filtered.filter(p => p.year === yearFilter);
    }

    return filtered;
  }, [PROJECTS_DATA, selectedYear]);

  const filteredBySearch = filteredByYear.filter(p =>
    p.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.promoter.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedData = [...filteredBySearch].sort((a: any, b: any) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  // Pagination logic (newest first)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedProject = PROJECTS_DATA.find(p => p.id === selectedProjectId);

  // Read project ID from URL parameter and select it automatically
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && PROJECTS_DATA.length > 0) {
      const project = PROJECTS_DATA.find(p => String(p.id) === projectId);
      if (project && project.lat && project.lng) {
        isProgrammaticChange.current = true;
        // eslint-disable-next-line
        setSelectedProjectId(projectId);
        setCenter([project.lat, project.lng] as [number, number]);
        setZoom(14);
        // Remove the parameter from URL after selection
        setSearchParams({}, { replace: true });
        // Reset flag after a short delay to allow map to update
        setTimeout(() => {
          isProgrammaticChange.current = false;
        }, 300);
      }
    }
  }, [searchParams, PROJECTS_DATA, setSearchParams]);

  // Handle map selection
  const handleSelectProject = useCallback((id: string | number, lat: number, lng: number) => {
    // Validate coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.warn('Invalid coordinates for project:', id, lat, lng);
      return;
    }

    isProgrammaticChange.current = true;
    setSelectedProjectId(id as string);
    setCenter([lat, lng] as [number, number]);
    setZoom(14);
    // Reset flag after a short delay to allow map to update
    setTimeout(() => {
      isProgrammaticChange.current = false;
    }, 500);
  }, []);

  // OpenStreetMap tile provider
  const mapTiler = useCallback((x: number, y: number, z: number) => {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }, []);

  // Update map height based on container height (75% of available height)
  useEffect(() => {
    const updateMapHeight = () => {
      if (mapContainerRef.current) {
        if (window.innerWidth >= 768) {
          // Desktop: use 75% of container height (25% reduction)
          const height = mapContainerRef.current.offsetHeight;
          if (height > 0) {
            setMapHeight(Math.floor(height * 0.75));
          }
        } else {
          // Mobile: use fixed height (75% of 400px = 300px)
          setMapHeight(300);
        }
      }
    };

    updateMapHeight();
    window.addEventListener('resize', updateMapHeight);

    // Use ResizeObserver for more accurate height tracking
    if (mapContainerRef.current) {
      const resizeObserver = new ResizeObserver(updateMapHeight);
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateMapHeight);
      };
    }

    return () => {
      window.removeEventListener('resize', updateMapHeight);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">

      {/* Introduction Section */}
      <div
        className="bg-[#ff9d9d] border-b border-black p-8 md:p-12 transition-[padding-top] duration-300 ease-in-out"
        style={{ paddingTop: isMobile ? `${navbarHeight + 32}px` : undefined }}
      >
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
      <div
        className="sticky z-30 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between transition-[top] duration-300 ease-in-out"
        style={{
          top: `${navbarHeight}px`,
          zIndex: 30,
          position: 'sticky'
        }}
      >
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
      <div className="flex flex-col flex-1 overflow-visible">

        {/* TOP SECTION: Data Table (100vw) */}
        <div className="w-full border-b border-black bg-[#f3f4f0] p-6">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs md:text-sm">
                  <thead className="bg-black text-white uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-r border-white/20 w-32">Expediente</th>
                      <th className="p-3 border-r border-white/20">Proyecto</th>
                      <th className="p-3 border-r border-white/20 hidden md:table-cell">Promovente</th>
                      <th className="p-3 border-r border-white/20 w-32">Estado</th>
                      <th className="p-3 border-r border-white/20 w-24">Fecha</th>
                      <th className="p-3 w-24">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {currentData.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => {
                          handleSelectProject(row.id, row.lat, row.lng);
                        }}
                        className={`cursor-pointer hover:bg-[#ff9d9d]/20 transition-colors ${selectedProjectId === row.id ? 'bg-[#ff9d9d]/50' : ''}`}
                      >
                        <td className="p-3 border-r border-black font-bold whitespace-nowrap">{row.expediente || row.id}</td>
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
                        <td className="p-3 whitespace-nowrap">
                          {(row.filename || row.url) && (
                            <a
                              href={row.filename || row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="inline-block px-3 py-1 border-2 border-black bg-[#fccb4e] hover:bg-[#ff9d9d] hover:text-white transition-colors font-mono text-xs uppercase font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
                            >
                              VER PDF
                            </a>
                          )}
                        </td>
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
                      <span className="font-mono text-[10px] bg-black text-white px-1">{card.expediente || card.id}</span>
                      <span className="text-[10px] font-bold text-gray-500">{card.date}</span>
                    </div>
                    <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{card.project}</h4>
                    <p className="text-xs font-mono text-gray-600 mb-4 line-clamp-1">{card.promoter}</p>
                    <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-bold uppercase ${card.status.includes('Aprobado') ? 'text-green-600' : 'text-orange-600'}`}>
                        ● {card.status}
                      </span>
                    </div>
                    {(card.filename || card.url) && (
                      <div className="pt-2 border-t border-dashed border-gray-300" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={card.filename || card.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="block w-full px-2 py-1.5 border-2 border-black bg-[#fccb4e] hover:bg-[#ff9d9d] hover:text-white transition-colors font-mono text-xs uppercase font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] text-center cursor-pointer"
                        >
                          VER PDF
                        </a>
                      </div>
                    )}
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
                  className="p-2 border-2 border-black bg-white hover:bg-[#ff7e67] hover:text-white disabled:hover:bg-white disabled:hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-mono text-sm px-2">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 border-2 border-black bg-white hover:bg-[#ff7e67] hover:text-white disabled:hover:bg-white disabled:hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAP AND DETAILS SECTION */}
        <div className="flex flex-col md:flex-row border-b border-black relative" style={{ minHeight: '400px' }}>
          {/* MAP - First in mobile, left side in desktop */}
          <div className="w-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-black bg-gray-100 z-10 order-2 md:order-1 h-[400px] md:h-full" ref={mapContainerRef}>
            <Map
              key={`map-${selectedProjectId || 'default'}-${center[0]}-${center[1]}-${zoom}-${mapHeight}`}
              defaultCenter={center}
              defaultZoom={zoom}
              center={center}
              zoom={zoom}
              provider={mapTiler}
              onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
                // Solo actualizar si el cambio viene del usuario (no programático)
                if (!isProgrammaticChange.current) {
                  setCenter(newCenter as [number, number]);
                  setZoom(newZoom);
                }
              }}
              height={mapHeight}
              defaultWidth={typeof window !== 'undefined' ? window.innerWidth : 400}
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

          {/* DETAILS - Second in mobile, right side in desktop */}
          <div className="w-full md:w-1/2 md:overflow-y-auto bg-white p-6 md:p-8 lg:p-12 flex flex-col order-1 md:order-2">
            {selectedProject ? (() => {
              // Convertir coordenadas si están disponibles
              const coords = selectedProject.coordenadas_x && selectedProject.coordenadas_y
                ? convertToLatLong(selectedProject.coordenadas_x, selectedProject.coordenadas_y)
                : null;
              const lat = coords?.lat || selectedProject.lat || 21.8853;
              const lng = coords?.lng || selectedProject.lng || -102.2916;

              // Formatear fecha
              const fechaFormateada = selectedProject.date
                ? new Date(selectedProject.date).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
                : 'No disponible';

              return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header */}
                  <div className="mb-6 pb-4 border-b-4 border-black">
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-2">
                      {selectedProject.project}
                    </h2>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="inline-block px-3 py-1 bg-black text-white text-xs md:text-sm font-mono uppercase font-bold">
                        {selectedProject.expediente || selectedProject.id}
                      </span>
                      {selectedProject.municipio && (
                        <span className="inline-block px-3 py-1 bg-black text-white text-xs md:text-sm font-mono uppercase font-bold">
                          {selectedProject.municipio}
                        </span>
                      )}
                      <span className="inline-block px-3 py-1 bg-black text-white text-xs md:text-sm font-mono uppercase font-bold">
                        {fechaFormateada}
                      </span>
                    </div>
                  </div>

                  {/* Información del Proyecto */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Promovente</p>
                      <p className="font-mono text-lg border-l-4 border-[#ff9d9d] pl-4">
                        {selectedProject.promoter || 'No disponible'}
                      </p>
                    </div>

                    {/* Tipo de estudio y Giro */}
                    {(selectedProject.type || selectedProject.impact) && (
                      <div className="flex flex-wrap gap-4 items-start">
                        {selectedProject.type && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo de estudio</p>
                            <span className="inline-block px-3 py-1 border-2 border-black bg-gray-50 text-xs font-mono font-bold uppercase">
                              {selectedProject.type}
                            </span>
                          </div>
                        )}
                        {selectedProject.impact && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Giro</p>
                            <span className="inline-block px-3 py-1 border-2 border-black bg-gray-50 text-xs font-mono font-bold uppercase">
                              {selectedProject.impact}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {(selectedProject.naturaleza_proyecto || selectedProject.description) && (
                      <div className="border-2 border-black p-4 md:p-6 bg-white">
                        <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-3">
                          NATURALEZA DEL PROYECTO
                        </span>
                        <p className="font-serif text-lg text-gray-800 leading-relaxed">
                          {selectedProject.naturaleza_proyecto || selectedProject.description}
                        </p>
                      </div>
                    )}

                    {selectedProject.coordenadas_x && selectedProject.coordenadas_y && (
                      <div className="flex flex-wrap gap-4 items-center">
                        <div>
                          <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">COORDENADAS UTM: </span>
                          <span className="font-mono text-sm font-bold">
                            {selectedProject.coordenadas_x.toFixed(2)}, {selectedProject.coordenadas_y.toFixed(2)}
                          </span>
                        </div>
                        {coords && (
                          <div>
                            <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">COORDENADAS LAT/LNG: </span>
                            <span className="font-mono text-sm font-bold">
                              {lat.toFixed(6)}, {lng.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="pt-4 border-t-2 border-dashed border-gray-300 space-y-3">
                    {(selectedProject.filename || selectedProject.url) && (
                      <a
                        href={selectedProject.filename || selectedProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#fccb4e] hover:bg-[#ff9d9d] hover:text-white transition-colors font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none text-lg"
                      >
                        <FileText size={20} />
                        CONSULTAR BOLETÍN
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-black bg-white hover:bg-gray-100 transition-colors font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <ExternalLink size={16} />
                        Google Maps
                      </a>
                      <a
                        href={(() => {
                          const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                          const proyecto = selectedProject.project || 'Proyecto';
                          const promovente = selectedProject.promoter || 'No disponible';
                          const tipoEstudio = selectedProject.type || 'No disponible';
                          const giro = selectedProject.impact || 'No disponible';
                          const naturaleza = selectedProject.naturaleza_proyecto || selectedProject.description || 'No disponible';
                          const estado = selectedProject.status || '';

                          // Determinar si es ingresado o resolutivo
                          const esResolutivo = estado.includes('Aprobado') || estado.includes('Denegado') || estado.includes('Resolutivo');
                          const tipoProyecto = esResolutivo ? 'resolutivo emitido' : 'proyecto ingresado';

                          const mensaje = `📋 Nuevo ${tipoProyecto} del Boletín Ambiental de la SSMAA

Este proyecto fue publicado en el boletín oficial de la Secretaría de Sustentabilidad, Medio Ambiente y Agua de Aguascalientes. ${esResolutivo ? 'Ya cuenta con una resolución emitida por las autoridades.' : 'Está en proceso de evaluación ambiental.'}

*${proyecto}*

*Promovente:* ${promovente}
*Tipo de estudio:* ${tipoEstudio}
*Giro:* ${giro}

*Naturaleza del proyecto:*
${naturaleza}

*Ubicacion:*
${googleMapsUrl}

━━━━━━━━━━━━━━━━━━━━
Compartido desde mapeoverde.org

Mantente informado sobre los proyectos de construccion en tu ciudad y participa en la vigilancia ciudadana.`;

                          return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-black bg-[#25D366] hover:bg-[#20ba5a] text-white transition-colors font-bold uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <MessageCircle size={16} />
                        Compartir WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })() : (
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
          <div className="border-2 border-black bg-black text-white p-6 md:p-8 relative z-10 max-w-5xl mx-auto shadow-[8px_8px_0px_0px_#d4d4d8]" style={{ boxShadow: '8px 8px 0px 0px #d4d4d8' }}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="text-[#ff9d9d]" />
              ALERTAS CIUDADANAS
            </h3>
            <p className="font-serif text-sm mb-6 max-w-2xl text-gray-300">
              Recibe un resumen semanal de los nuevos proyectos ingresados y resolutivos. Entérate antes de que empiecen a construir.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
              <button className="flex-1 bg-[#ff9d9d] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#ff7e67] hover:text-white transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Mail size={18} /> Suscribir al Boletín
              </button>
              <button className="flex-1 bg-[#25D366] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#ff7e67] hover:text-white transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <MessageCircle size={18} /> Grupo de WhatsApp
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Boletin */}
    </div>
  );
};

export default NewslettersPage;
