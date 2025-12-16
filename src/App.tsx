import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, TreePine, FileText, LayoutGrid } from 'lucide-react';
import { LogoMap } from './components/common';
import { DataContext, DataProvider } from './context/DataContext';
import { TAB_ROUTES } from './constants/routes';
import { pathToTab, getAccentColor } from './utils/helpers';
import { NavBar, Footer } from './components/layout';
import { useSEO } from './hooks/useSEO';
import {
  HeroSection,
  TextContentSection,
  StatsSection,
  FeatureList,
  CtaSection
} from './features/home/components';
import { EventsPage, ImpactDetailPage } from './features/agenda/components';
import { GreenAreasPage, GreenAreaDetailPage } from './features/green-areas/components';
import { NewslettersPage } from './features/newsletters/components';
import { GazettesPage } from './features/gazettes/components';
import { ParticipationPage } from './features/participation/components';
import { ManifestoPage } from './features/manifesto/components';

const MainApp = () => {
  const { greenAreas: GREEN_AREAS_DATA, projects: PROJECTS_DATA, gazettes: GAZETTES_DATA, events: EVENTS_DATA } = React.useContext(DataContext);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = pathToTab(location.pathname);
  const accentColor = getAccentColor(activeTab);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // SEO dinámico según la ruta
  useSEO();

  // Extract ID from URL if present
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isDetailPage = pathParts.length === 2 && (pathParts[0] === 'areas-verdes' || pathParts[0] === 'agenda');
  const detailId = isDetailPage ? parseInt(pathParts[1], 10) : null;
  const detailType = isDetailPage ? pathParts[0] : null;

  const handleFeatureEnter = (feature: string) => {
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
  }, [activeTab, location.pathname]);

  const handleNavigate = (tab: string) => {
    navigate(TAB_ROUTES[tab as keyof typeof TAB_ROUTES] || '/');
  };

  const handleSelectImpact = (id: string | number) => {
     navigate(`/agenda/${id}`);
  };

  const handleSelectGreenArea = (id: string | number) => {
     navigate(`/areas-verdes/${id}`);
  };

  // Override content if a detail view is active (based on URL)
  if (detailType === 'agenda' && detailId) {
     return (
        <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black">
           <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
           <main className="pt-16 md:pt-0">
              <ImpactDetailPage 
                eventId={detailId} 
                onBack={() => {
                  navigate(TAB_ROUTES.AGENDA);
                }} 
              />
           </main>
           <Footer />
        </div>
     );
  }

  if (detailType === 'areas-verdes' && detailId) {
     return (
        <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black">
           <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
           <main className="pt-16 md:pt-0">
              <GreenAreaDetailPage 
                areaId={detailId} 
                onBack={() => {
                  navigate(TAB_ROUTES.GREEN_AREAS);
                }} 
              />
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
                             let data: any[] = [];
                             if (hoveredFeature === 'Áreas Verdes') data = GREEN_AREAS_DATA;
                             else if (hoveredFeature === 'Boletines') data = PROJECTS_DATA;
                             else if (hoveredFeature === 'Gacetas') data = GAZETTES_DATA;
                             else if (hoveredFeature === 'Agenda') data = EVENTS_DATA;
                             
                             // Ordenar por fecha (más recientes primero) y tomar los 4 más recientes
                             const sortedData = [...data].sort((a: any, b: any) => {
                                if (hoveredFeature === 'Áreas Verdes') {
                                   // Para áreas verdes: priorizar las que tienen denuncia (need), luego por ID descendente
                                   if (a.need && !b.need) return -1;
                                   if (!a.need && b.need) return 1;
                                   return (b.id || 0) - (a.id || 0); // IDs más altos primero
                                } else {
                                   // Para otros: ordenar por fecha descendente (más reciente primero)
                                   const dateA = a.date ? new Date(a.date).getTime() : 0;
                                   const dateB = b.date ? new Date(b.date).getTime() : 0;
                                   return dateB - dateA;
                                }
                             });
                             
                             return sortedData.slice(0, 4).map((item, idx) => (
                               <div 
                                 key={item.id || idx} 
                                 onClick={() => {
                                   if (hoveredFeature === 'Áreas Verdes') {
                                       handleSelectGreenArea(item.id);
                                       handleNavigate('GREEN_AREAS');
                                   } else if (hoveredFeature === 'Boletines') {
                                       navigate(`/boletines?project=${item.id}`);
                                   } else if (hoveredFeature === 'Gacetas') {
                                       navigate(`/gacetas?project=${item.id}`);
                                   } else if (hoveredFeature === 'Agenda') {
                                       handleSelectImpact(item.id);
                                   }
                                 }}
                                 className="border-2 border-black bg-white cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group h-full flex flex-col"
                               >
                                  {/* Image or Icon Section */}
                                  <div className="h-48 overflow-hidden border-b-2 border-black relative bg-gray-100 flex items-center justify-center">
                                     {item.image ? (
                                        <img 
                                          src={item.image} 
                                          alt={item.name || item.project || item.title}
                                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                          }}
                                        />
                                     ) : null}
                                     {(!item.image || item.image === '') && (
                                        <div className="p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                           {hoveredFeature === 'Boletines' && <LayoutGrid size={64} strokeWidth={1} />}
                                           {hoveredFeature === 'Gacetas' && <FileText size={64} strokeWidth={1} />}
                                           {!hoveredFeature && <TreePine size={64} strokeWidth={1} />}
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
    <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black" style={{ overflow: 'visible' }}>
      <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
      <main style={{ position: 'relative', zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'relative', zIndex: 0 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

const ManifestoPageWrapper = () => {
  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans">
      <ManifestoPage />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/inicio" element={<MainApp />} />
        <Route path="/agenda" element={<MainApp />} />
        <Route path="/agenda/:id" element={<MainApp />} />
        <Route path="/areas-verdes" element={<MainApp />} />
        <Route path="/areas-verdes/:id" element={<MainApp />} />
        <Route path="/boletines" element={<MainApp />} />
        <Route path="/gacetas" element={<MainApp />} />
        <Route path="/participacion" element={<MainApp />} />
        <Route path="/manifiesto" element={<ManifestoPageWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}
