import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DataProvider } from './context/DataContext';
import { TAB_ROUTES } from './constants/routes';
import { pathToTab } from './utils/helpers';
import { NavBar, Footer } from './components/layout';
import { useSEO } from './hooks/useSEO';
const HeroSection = React.lazy(() => import('./features/home/components/HeroSection'));
const TextContentSection = React.lazy(() => import('./features/home/components/TextContentSection'));
const StatsSection = React.lazy(() => import('./features/home/components/StatsSection'));
const FeatureList = React.lazy(() => import('./features/home/components/FeatureList'));
const CtaSection = React.lazy(() => import('./features/home/components/CtaSection'));

// Lazy load pages
const EventsPage = React.lazy(() => import('./features/agenda/components/EventsPage'));
const ImpactDetailPage = React.lazy(() => import('./features/agenda/components/ImpactDetailPage'));
const GreenAreasPage = React.lazy(() => import('./features/green-areas/components/GreenAreasPage'));
const GreenAreaDetailPage = React.lazy(() => import('./features/green-areas/components/GreenAreaDetailPage'));
const NewslettersPage = React.lazy(() => import('./features/newsletters/components/NewslettersPage'));
const GazettesPage = React.lazy(() => import('./features/gazettes/components/GazettesPage'));
const ParticipationPage = React.lazy(() => import('./features/participation/components/ParticipationPage'));
const ManifestoPage = React.lazy(() => import('./features/manifesto/components/ManifestoPage'));
const LinktreePage = React.lazy(() => import('./features/linktree/components/LinktreePage'));

import { FeaturePreview } from './features/home/components';

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="w-16 h-16 border-4 border-[#b4ff6f] border-t-black rounded-full shadow-lg"
    />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      className="font-mono text-xs uppercase tracking-widest font-bold"
    >
      Cargando...
    </motion.span>
  </div>
);

const MainApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = pathToTab(location.pathname);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Limpiar parámetro 'date' de la URL si no estás en agenda
  useEffect(() => {
    const isAgendaPage = location.pathname === '/agenda' || location.pathname.startsWith('/agenda/');
    const searchParams = new URLSearchParams(location.search);
    
    if (!isAgendaPage && searchParams.has('date')) {
      searchParams.delete('date');
      const newSearch = searchParams.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '') + location.hash;
      navigate(newPath, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  // SEO dinámico según la ruta
  useSEO();

  // Extract ID from URL if present
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isDetailPage = pathParts.length === 2 && (pathParts[0] === 'areas-verdes' || pathParts[0] === 'agenda');
  const detailId = isDetailPage ? parseInt(pathParts[1], 10) : null;
  const detailType = isDetailPage ? pathParts[0] : null;

  // Debug: Log routing info (can be removed later)
  useEffect(() => {
    if (location.pathname === '/agenda' && location.search) {
      console.log('Agenda route detected with query params:', {
        pathname: location.pathname,
        search: location.search,
        activeTab,
        fullLocation: location
      });
    }
  }, [location.pathname, location.search, activeTab, location]);

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

  const handleNavigate = (tab: string, id?: string | number) => {
    if (id) {
      if (tab === 'GREEN_AREAS') navigate(`/areas-verdes/${id}`);
      else if (tab === 'AGENDA') navigate(`/agenda/${id}`);
      else if (tab === 'NEWSLETTERS') navigate(`/boletines?project=${id}`);
      else if (tab === 'GAZETTES') navigate(`/gacetas?project=${id}`);
    } else {
      const targetRoute = TAB_ROUTES[tab as keyof typeof TAB_ROUTES] || '/';
      // Si navegamos fuera de agenda, limpiar el parámetro date de la URL
      if (tab !== 'AGENDA') {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has('date')) {
          searchParams.delete('date');
          const cleanSearch = searchParams.toString();
          // Navegar sin el parámetro date
          navigate(targetRoute + (cleanSearch ? `?${cleanSearch}` : ''), { replace: true });
          return;
        }
      }
      // Si estamos navegando a agenda, mantener otros parámetros pero no agregar date si no existe
      navigate(targetRoute);
    }
  };

  const renderContent = () => {
    // Detail view overrides
    if (detailType === 'agenda' && detailId) {
      return (
        <Suspense fallback={<PageLoader />}>
          <ImpactDetailPage
            eventId={detailId}
            onBack={() => {
              navigate(TAB_ROUTES.AGENDA);
            }}
          />
        </Suspense>
      );
    }

    if (detailType === 'areas-verdes' && detailId) {
      return (
        <Suspense fallback={<PageLoader />}>
          <GreenAreaDetailPage
            areaId={detailId}
            onBack={() => {
              navigate(TAB_ROUTES.GREEN_AREAS);
            }}
          />
        </Suspense>
      );
    }

    switch (activeTab) {
      case 'HOME':
        return (
          <Suspense fallback={<PageLoader />}>
            <HeroSection />
            <TextContentSection />
            <StatsSection />
            <FeatureList onFeatureEnter={handleFeatureEnter} onFeatureLeave={handleFeatureLeave} />
            <FeaturePreview
              hoveredFeature={hoveredFeature}
              onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
              onMouseLeave={() => { hoverTimeoutRef.current = setTimeout(() => setHoveredFeature(null), 300); }}
              onNavigate={handleNavigate}
            />
            <CtaSection />
          </Suspense>
        );
      case 'GREEN_AREAS':
        return (
          <Suspense fallback={<PageLoader />}>
            <GreenAreasPage onSelectArea={(id) => handleNavigate('GREEN_AREAS', id)} />
          </Suspense>
        );
      case 'NEWSLETTERS':
        return (
          <Suspense fallback={<PageLoader />}>
            <NewslettersPage />
          </Suspense>
        );
      case 'GAZETTES':
        return (
          <Suspense fallback={<PageLoader />}>
            <GazettesPage />
          </Suspense>
        );
      case 'AGENDA':
        return (
          <Suspense fallback={<PageLoader />}>
            <EventsPage onSelectImpact={(id) => handleNavigate('AGENDA', id)} />
          </Suspense>
        );
      case 'PARTICIPATION':
        return (
          <Suspense fallback={<PageLoader />}>
            <ParticipationPage />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <HeroSection />
            <TextContentSection />
            <StatsSection />
            <FeatureList />
            <CtaSection />
          </Suspense>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans selection:bg-[#b4ff6f] selection:text-black" style={{ overflow: 'visible' }}>
      <NavBar activeTab={activeTab} onNavigate={(tab) => handleNavigate(tab)} />
      <main style={{ position: 'relative', zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
      <React.Suspense fallback={<PageLoader />}>
        <ManifestoPage />
      </React.Suspense>
    </div>
  );
};

const LinktreePageWrapper = () => {
  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans">
      <React.Suspense fallback={<PageLoader />}>
        <LinktreePage />
      </React.Suspense>
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
        <Route path="/links" element={<LinktreePageWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataProvider>
  );
}
