import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Search, List, LayoutGrid, ChevronLeft, ChevronRight, MapPin, Download, FileText, AlertCircle, Mail, MessageCircle } from 'lucide-react';
import { Map, Marker, Overlay } from 'pigeon-maps';
import { useContext } from 'react';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const KPI_DATA = [
  { label: "PROYECTOS ANALIZADOS", value: "285", change: "+12%" },
  { label: "EXPEDIENTES PÚBLICOS", value: "2,547", change: "+34%" },
  { label: "ALERTAS CIUDADANAS", value: "1,200+", change: "+89%" }
];

const NewslettersPage = () => {
  const { projects: PROJECTS_DATA } = useContext(DataContext);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [navbarHeight, setNavbarHeight] = useState(64);
  
  // Get navbar height on mount, resize, and scroll (for mobile navbar visibility)
  useEffect(() => {
    const updateNavbarHeight = () => {
      setNavbarHeight(getNavbarHeight());
    };
    
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('scroll', updateNavbarHeight, { passive: true });
    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
      window.removeEventListener('scroll', updateNavbarHeight);
    };
  }, []);
  
  const years = useMemo(() => {
    const allYears = PROJECTS_DATA.map(p => p.year).filter(Boolean);
    const unique = Array.from(new Set(allYears));
    return unique.sort((a, b) => Number(b) - Number(a));
  }, [PROJECTS_DATA]);
  const [selectedYear, setSelectedYear] = useState(() => years[0] || 'all');
  const [center, setCenter] = useState([21.8853, -102.2916]);
  const [zoom, setZoom] = useState(12);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
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
  const sortedData = [...filteredBySearch].sort((a: any, b: any) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  // Pagination logic (newest first)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedProject = PROJECTS_DATA.find(p => p.id === selectedProjectId);

  // Handle map selection
  const handleSelectProject = useCallback((id: string | number, lat: number, lng: number) => {
    setSelectedProjectId(id as string);
    setCenter([lat, lng] as [number, number]);
    setZoom(14);
  }, []);

  // Custom tile provider for a cleaner, brutalist look (CartoDB Positron)
  const mapTiler = useCallback((x: number, y: number, z: number, dpr?: number) => {
    return `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png`;
  }, []);

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
      <div 
        className="sticky z-30 shadow-sm p-4 border-b border-black bg-white flex flex-col md:flex-row gap-4 items-center justify-between" 
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
                          <button className="w-full flex items-center justify-center gap-2 bg-[#ff9d9d] hover:bg-[#ff7e67] hover:text-white transition-colors text-black font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none text-lg">
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
    </div>
  );
};

export default NewslettersPage;
