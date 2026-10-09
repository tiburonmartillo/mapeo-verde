import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Home, CalendarDays, ArrowUpRight } from 'lucide-react';
import { NavBar, Footer } from '../../../components/layout';
import { LogoMap } from '../../../components/common/LogoMap';
import { TAB_ROUTES } from '../../../constants/routes';
import { useSEO } from '../../../hooks/useSEO';

const quickLinks = [
  { to: '/agenda', label: 'Agenda ambiental' },
  { to: '/boletines', label: 'Boletines de impacto' },
  { to: '/gacetas', label: 'Gacetas SEMARNAT' },
  { to: '/participacion', label: 'Participación ciudadana' },
  { to: '/manifiesto', label: 'Manifiesto' },
];

const NotFoundPage = () => {
  const navigate = useNavigate();

  useSEO({
    title: '404 - Página no encontrada | Mapeo Verde',
    description: 'La página que buscas no existe o fue movida. Vuelve al inicio o explora la agenda, boletines y gacetas ambientales de Mapeo Verde.',
    noindex: true,
  });

  const handleNavigate = (tab: string) => {
    const route = tab === 'MONITOR' ? '/boletines' : TAB_ROUTES[tab as keyof typeof TAB_ROUTES];
    navigate(route ?? '/');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans text-black flex flex-col">
      <NavBar activeTab="" onNavigate={handleNavigate} />

      <main className="relative flex-1 overflow-hidden flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24">
        {/* Background - Dot Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          aria-hidden="true"
        />

        {/* Decorative compass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute -top-10 -right-10 sm:top-16 sm:right-8 text-[#b4ff6f] pointer-events-none"
          aria-hidden="true"
        >
          <Compass className="w-40 h-40 sm:w-64 sm:h-64" strokeWidth={0.75} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-3xl"
        >
          <div className="border-2 border-black bg-[#f3f4f0] shadow-[8px_8px_0_0_#000]">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b-2 border-black px-4 sm:px-6 py-3 bg-black text-white">
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest">Error 404</span>
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-[#b4ff6f]">
                Fuera del mapa
              </span>
            </div>

            <div className="px-5 sm:px-10 py-10 sm:py-14 text-center">
              <LogoMap className="w-28 sm:w-40 h-auto mx-auto mb-6" />

              <h1 className="sr-only">404 - Página no encontrada</h1>
              <div
                className="font-mono font-black leading-none text-[5.5rem] sm:text-[9rem] tracking-tighter"
                aria-hidden="true"
              >
                4<span className="text-[#b4ff6f] [-webkit-text-stroke:2px_#000]">0</span>4
              </div>

              <p className="mt-6 text-2xl sm:text-3xl font-bold">
                La página que buscas se perdió en el mapa
              </p>
              <p className="mt-3 font-serif text-lg text-gray-700 max-w-xl mx-auto">
                Puede que el enlace esté roto o que la hayan movido, pero no te preocupes:
                te ayudamos a volver al camino.
              </p>

              {/* Actions */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-black text-white font-bold uppercase tracking-wider text-sm transition-colors hover:bg-[#b4ff6f] hover:text-black focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <Home className="w-4 h-4" />
                  Volver al inicio
                </Link>
                <Link
                  to="/agenda"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-black bg-transparent text-black font-bold uppercase tracking-wider text-sm transition-colors hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <CalendarDays className="w-4 h-4" />
                  Ver agenda
                </Link>
              </div>

              {/* Quick links */}
              <div className="mt-10 border-t-2 border-black pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-gray-500 mb-4">
                  Quizá buscabas
                </p>
                <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                  {quickLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className="inline-flex items-center gap-1 font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
