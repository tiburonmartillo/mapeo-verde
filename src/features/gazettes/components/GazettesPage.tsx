import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Search, List, LayoutGrid, ChevronLeft, ChevronRight, Download, FileText, AlertCircle, Mail, ExternalLink } from 'lucide-react';
import { useContext } from 'react';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const GazettesPage = () => {
  const { gazettes: GAZETTES_DATA } = useContext(DataContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
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
    const allYears = GAZETTES_DATA.map(p => p.year).filter(Boolean);
    const unique = Array.from(new Set(allYears));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [GAZETTES_DATA]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || 'all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
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
  const sortedData = [...filteredBySearch].sort((a: any, b: any) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  // Pagination logic (newest first)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedProject = GAZETTES_DATA.find(p => p.id === selectedProjectId);

  // Read project ID from URL parameter and select it automatically
  useEffect(() => {
    const projectId = searchParams.get('project');
    if (projectId && GAZETTES_DATA.length > 0) {
      const project = GAZETTES_DATA.find(p => String(p.id) === projectId);
      if (project) {
        setSelectedProjectId(projectId);
        // Remove the parameter from URL after selection
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, GAZETTES_DATA, setSearchParams]);

  const handleSelectProject = useCallback((id: string | number) => {
    setSelectedProjectId(id as string);
  }, []);

  const GAZETTE_KPIS = [
    { label: "Gaceta Actual", value: "DGIRA/05", change: "Publicada" },
    { label: "Proyectos Federales", value: "17", change: "En Ags" },
    { label: "Impacto Regional", value: "5", change: "Alta Importancia" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
      
      {/* Introduction Section */}
      <div 
        className="bg-[#9dcdff] border-b border-black p-8 md:p-12 transition-[padding-top] duration-300 ease-in-out" 
        style={{ paddingTop: isMobile ? `${navbarHeight + 32}px` : undefined }}
      >
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
      <div 
        className="sticky z-30 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between transition-[top] duration-300 ease-in-out" 
        style={{ 
          top: `${navbarHeight}px`,
          zIndex: 30,
          position: 'sticky'
        }}
      >
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

      <div className="flex flex-col flex-1 overflow-visible">
        
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
                      {currentData.map((row: any) => (
                        <tr 
                          key={row.id} 
                          onClick={() => handleSelectProject(row.id)}
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
                   {currentData.map((card: any) => (
                      <div 
                        key={card.id}
                        onClick={() => handleSelectProject(card.id)}
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

        {/* BOTTOM SECTION: Details Only (No Map - No coordinates in data) */}
        <div className="border-b border-black">
           
           <div className="w-full overflow-y-auto bg-white p-6 md:p-8 lg:p-12 flex flex-col">
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
                          <button className="w-full flex items-center justify-center gap-2 bg-[#9dcdff] hover:bg-[#ff7e67] hover:text-white transition-colors text-black font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-lg">
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
                <button className="flex-1 bg-[#9dcdff] text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#ff7e67] hover:text-white transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <Mail size={18} /> Suscribir a Gacetas
                </button>
                <button className="flex-1 bg-white text-black font-bold uppercase py-3 px-4 flex items-center justify-center gap-2 hover:bg-[#ff7e67] hover:text-white transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <ExternalLink size={18} /> Ver Sitio SEMARNAT
                </button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default GazettesPage;
