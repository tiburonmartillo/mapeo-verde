import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TreePine, Search, List, LayoutGrid, ChevronLeft, ChevronRight, Eye, AlertCircle, FileWarning } from 'lucide-react';
import { Map, Overlay } from 'pigeon-maps';
import { useContext } from 'react';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { getAccentColor, useAccentColor } from '../../../utils/helpers';

interface GreenAreasPageProps {
  onSelectArea?: (areaId: string | number) => void;
}

const GreenAreasPage = ({ onSelectArea }: GreenAreasPageProps) => {
  const { greenAreas: GREEN_AREAS_DATA } = useContext(DataContext) as any;
  const accentColor = useAccentColor();
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [_isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
  
  const [center, setCenter] = useState<[number, number]>([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(12);
  const [selectedAreaId, setSelectedAreaId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const mapDetailSectionRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const filteredBySearch = useMemo(() => {
    const tags = (item: any) => Array.isArray(item.tags) ? item.tags : [];
    const filtered = GREEN_AREAS_DATA.filter((item: any) => {
       if (categoryFilter !== 'TODOS' && !tags(item).some((t: any) => String(t).toUpperCase().includes(categoryFilter))) return false;
       if (statusFilter !== 'TODOS') {
         const hasNeed = !!item.need;
         if (statusFilter === 'RIESGO' && !hasNeed) return false;
         if (statusFilter === 'OPTIMO' && hasNeed) return false;
       }
       return true;
    });

    return filtered.filter((item: any) =>
      String(item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags(item).some((tag: any) => String(tag).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [GREEN_AREAS_DATA, categoryFilter, statusFilter, searchQuery]);

  const totalPages = useMemo(() => Math.ceil(filteredBySearch.length / itemsPerPage), [filteredBySearch.length]);
  
  const currentData = useMemo(() => 
    filteredBySearch.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredBySearch, currentPage]
  );

  const selectedArea = useMemo(() => 
    GREEN_AREAS_DATA.find((a: any) => a.id === selectedAreaId),
    [GREEN_AREAS_DATA, selectedAreaId]
  );

  const GREEN_AREAS_KPIS = useMemo(() => [
    { label: "Espacios Registrados", value: String(GREEN_AREAS_DATA.length), change: "Activos" },
    { label: "Requieren Atención", value: String(GREEN_AREAS_DATA.filter((a: any) => a.need).length), change: "Urgente" },
    { label: "Estado Óptimo", value: String(GREEN_AREAS_DATA.filter((a: any) => !a.need).length), change: "Estable" },
  ], [GREEN_AREAS_DATA]);

  const handleSelectArea = useCallback((id: string | number, lat: number, lng: number, scrollToMap = false) => {
    setSelectedAreaId(id);
    if (lat && lng) {
      setCenter([lat, lng] as [number, number]);
      setZoom(16);
    }
    if (scrollToMap && mapDetailSectionRef.current) {
      setTimeout(() => {
        const toolbarHeight = toolbarRef.current?.offsetHeight || 0;
        const totalStickyHeight = navbarHeight + toolbarHeight;
        const element = mapDetailSectionRef.current;
        const elementPosition = element!.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - totalStickyHeight - 16;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 100);
    }
  }, [navbarHeight]);

  const mapTiler = useCallback((x: number, y: number, z: number) => {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
      <div 
        className="bg-[#fccb4e] border-b border-black p-8 md:p-12 transition-[padding-top] duration-300 ease-in-out" 
        style={{ paddingTop: isMobile ? `${navbarHeight + 32}px` : undefined }}
      >
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

      <div className="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-white">
        {GREEN_AREAS_KPIS.map((kpi, i) => (
          <div key={i} className="p-3 md:p-4 flex flex-col justify-center items-center text-center hover:bg-gray-50 transition-colors">
            <span className="font-mono text-[10px] uppercase text-gray-500 mb-1">{kpi.label}</span>
            <span className="text-2xl md:text-3xl font-black tracking-tighter">{kpi.value}</span>
            <span className="text-[9px] font-bold bg-black text-white px-2 py-0.5 mt-1 rounded-full">{kpi.change}</span>
          </div>
        ))}
      </div>

      {/* CTA Denuncia */}
      <div className="bg-[#f3f4f0] border-b border-black p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border-2 border-black p-6 md:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#fccb4e] border-2 border-black">
                    <FileWarning size={24} className="text-black" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                    ¿Viste un Problema?
                  </h2>
                </div>
                <p className="font-serif text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  Si detectas daños, falta de mantenimiento, tala ilegal o cualquier situación que afecte nuestras áreas verdes, repórtalo aquí.
                </p>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  Tu reporte ayuda a proteger nuestro patrimonio natural
                </p>
              </div>
              <button
                onClick={() => {
                  // Aquí puedes agregar la lógica para abrir un formulario o navegar a una página de denuncia
                  window.open('mailto:denuncias@mapeoverde.org?subject=Denuncia Área Verde', '_blank');
                }}
                className="w-full md:w-auto px-8 py-4 bg-black text-white font-bold uppercase text-sm md:text-base tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                style={{ '--accent-color': accentColor } as React.CSSProperties & { '--accent-color': string }}
                onMouseEnter={(e) => {
                  const element = e.currentTarget as HTMLElement;
                  element.style.backgroundColor = accentColor;
                  element.style.color = 'black';
                }}
                onMouseLeave={(e) => {
                  const element = e.currentTarget as HTMLElement;
                  element.style.backgroundColor = 'black';
                  element.style.color = 'white';
                }}
              >
                <FileWarning size={20} />
                Hacer Denuncia
              </button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={toolbarRef}
        className="sticky z-30 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between transition-[top] duration-300 ease-in-out" 
        style={{ 
          top: `${navbarHeight}px`,
          zIndex: 30,
          position: 'sticky'
        }}
      >
        <div className="flex gap-4 w-full md:max-w-2xl">
          <div className="relative w-40 shrink-0">
            <TreePine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fccb4e] uppercase bg-white appearance-none cursor-pointer hover:bg-gray-50"
            >
              <option value="TODOS">Todas</option>
              <option value="PARQUE">Parques</option>
              <option value="JARDÍN">Jardines</option>
              <option value="CORREDOR">Corredores</option>
            </select>
          </div>

          <div className="relative w-32 shrink-0">
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fccb4e] uppercase bg-white appearance-none cursor-pointer hover:bg-gray-50"
            >
              <option value="TODOS">Estado</option>
              <option value="OPTIMO">Óptimo</option>
              <option value="RIESGO">En Riesgo</option>
            </select>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="BUSCAR ÁREA VERDE..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#fccb4e] uppercase"
            />
          </div>
        </div>

        <div className="flex border border-black bg-gray-100 shrink-0">
          <button 
            onClick={() => setViewMode('table')}
            className={`p-2 border-r border-black hover:bg-gray-200 ${viewMode === 'table' ? 'bg-[#fccb4e]' : ''}`}
          >
            <List size={18} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 hover:bg-gray-200 ${viewMode === 'grid' ? 'bg-[#fccb4e]' : ''}`}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="w-full border-b border-black bg-[#f3f4f0] p-6">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs md:text-sm">
                  <thead className="bg-black text-white uppercase tracking-wider">
                    <tr>
                      <th className="p-3 border-r border-white/20 w-20">ID</th>
                      <th className="p-3 border-r border-white/20">Área Verde</th>
                      <th className="p-3 border-r border-white/20 hidden md:table-cell">Dirección</th>
                      <th className="p-3 border-r border-white/20 w-32">Categoría</th>
                      <th className="p-3 w-32">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {currentData.map((row: any) => (
                      <tr 
                        key={row.id} 
                        onClick={() => handleSelectArea(row.id, row.lat, row.lng, true)}
                        className={`cursor-pointer hover:bg-[#fccb4e]/20 transition-colors ${selectedAreaId === row.id ? 'bg-[#fccb4e]/50' : ''}`}
                      >
                        <td className="p-3 border-r border-black font-bold whitespace-nowrap">#{row.id}</td>
                        <td className="p-3 border-r border-black">
                          <div className="font-bold truncate max-w-[200px] md:max-w-md">{row.name}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{row.tags.join(', ')}</div>
                        </td>
                        <td className="p-3 border-r border-black hidden md:table-cell truncate max-w-xs">{row.address}</td>
                        <td className="p-3 border-r border-black">
                          <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold whitespace-nowrap bg-gray-50">
                            {row.tags[0] || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`
                            inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold whitespace-nowrap
                            ${row.need ? 'bg-red-400' : 'bg-[#b4ff6f]'}
                          `}>
                            {row.need ? 'En Riesgo' : 'Óptimo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {currentData.length === 0 && (
                  <div className="p-12 text-center text-gray-500 font-mono">
                    Cargando información de áreas verdes...
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {currentData.map((card: any) => (
                  <div 
                    key={card.id}
                    onClick={() => handleSelectArea(card.id, card.lat, card.lng, true)}
                    className={`
                      border-2 border-black bg-white p-4 cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all h-full
                      ${selectedAreaId === card.id ? 'shadow-[4px_4px_0px_0px_#fccb4e] border-[#fccb4e]' : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    <div className="w-full h-32 mb-3 border border-black overflow-hidden bg-gray-100 relative">
                      {card.image ? (
                        <img 
                          src={card.image} 
                          alt={card.name}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      {(!card.image || card.image === '') && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <TreePine size={32} className="opacity-30" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] bg-black text-white px-1">#{card.id}</span>
                      <span className={`text-[10px] font-bold uppercase ${card.need ? 'text-red-600' : 'text-green-600'}`}>
                        ● {card.need ? 'Riesgo' : 'Óptimo'}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{card.name}</h4>
                    <p className="text-xs font-mono text-gray-600 mb-3 line-clamp-1">{card.address}</p>
                    <div className="pt-2 border-t border-dashed border-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="text-[9px] font-bold uppercase text-gray-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
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

        <div ref={mapDetailSectionRef} className="flex flex-col md:flex-row min-h-[800px] border-b border-black">
          <div className="w-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-black bg-gray-100 min-h-[800px]">
            <Map 
              center={center} 
              zoom={zoom} 
              provider={mapTiler}
              onBoundsChanged={({ center, zoom }: any) => { 
                setCenter(center); 
                setZoom(zoom); 
              }}
            >
              {filteredBySearch.map((point: any) => (
                <Overlay key={point.id} anchor={[point.lat, point.lng]} offset={[15, 30]}>
                  <div 
                    onClick={() => handleSelectArea(point.id, point.lat, point.lng)}
                    className={`
                      cursor-pointer transform -translate-x-1/2 -translate-y-full transition-all duration-300 group
                      ${selectedAreaId === point.id ? 'z-50 scale-125' : 'z-10 hover:z-40 hover:scale-110'}
                    `}
                  >
                    <TreePine 
                      fill={selectedAreaId === point.id ? getAccentColor('AGENDA') : "#3CB371"} 
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
              <p className="text-[10px] font-mono uppercase font-bold mb-1">Mapa de Áreas Verdes</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col min-h-[800px] overflow-y-auto">
            {selectedArea ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-3 py-1 bg-black text-white font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_#fccb4e]">
                    #{selectedArea.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 border border-black ${selectedArea.need ? 'bg-red-400' : 'bg-[#b4ff6f]'}`}>
                    {selectedArea.need ? 'En Riesgo' : 'Óptimo'}
                  </span>
                </div>

                <h3 className="text-3xl font-bold leading-none mb-6 font-sans">
                  {selectedArea.name}
                </h3>
                
                {selectedArea.image && (
                  <div className="w-full h-48 mb-6 border-2 border-black overflow-hidden bg-gray-100">
                    <img 
                      src={selectedArea.image} 
                      alt={selectedArea.name}
                      className="w-full h-full object-cover grayscale"
                    />
                  </div>
                )}
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Dirección</p>
                    <p className="font-mono text-lg border-l-4 border-[#fccb4e] pl-4">
                      {selectedArea.address}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedArea.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 border-2 border-black text-sm font-bold bg-gray-50">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedArea.need && (
                    <div className="bg-[#fff0f0] border-l-8 border-red-500 p-4">
                      <p className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-2 mb-2">
                        <AlertCircle size={16}/> Necesidad Prioritaria
                      </p>
                      <p className="text-lg font-medium">{selectedArea.need}</p>
                    </div>
                  )}
                  
                  <div className="pt-8 mt-8 border-t border-dashed border-gray-300">
                    <button 
                      onClick={() => onSelectArea && onSelectArea(selectedArea.id)}
                      className="w-full flex items-center justify-center gap-2 bg-[#fccb4e] hover:bg-black hover:text-white transition-colors text-black font-bold uppercase py-4 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-lg"
                    >
                      <Eye size={20} /> Ver Detalles Completos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 text-center space-y-6">
                <TreePine size={80} strokeWidth={0.5} />
                <p className="font-mono text-lg max-w-[300px] text-gray-400">
                  Selecciona un área verde de la lista superior para ver los detalles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GreenAreasPage;
