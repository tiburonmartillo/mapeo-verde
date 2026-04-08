import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { LogoMap } from '../../../components/common/LogoMap';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const HeroSection = () => {
  const navigate = useNavigate();
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);


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
      if (window.innerWidth < 768) {
        const navbarMobile = document.querySelector('[data-navbar-mobile]') as HTMLElement;
        if (navbarMobile) {
          const isHidden = navbarMobile.classList.contains('-translate-y-full');
          if (isHidden) {
            setNavbarHeight(0);
          } else {
            updateNavbarHeight();
          }
        }
      } else {
        updateNavbarHeight();
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const navbarMobile = document.querySelector('[data-navbar-mobile]');
    if (navbarMobile && window.innerWidth < 768) {
      const observer = new MutationObserver(() => {
        const isHidden = navbarMobile.classList.contains('-translate-y-full');
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

  return (
    <header
      className="relative min-h-[min(88vh,920px)] sm:min-h-[85vh] bg-[#f3f4f0] text-black overflow-hidden flex flex-col justify-between pb-8 sm:pb-12 border-b border-black transition-[padding-top] duration-300 ease-in-out"
      style={{ paddingTop: isMobile ? `${navbarHeight + 72}px` : '128px' }}
    >
      {/* Background - Dot Pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        aria-hidden="true"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
              delayChildren: 0.3
            }
          }
        }}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-end"
      >
        <div className="flex-1">
          <div className="mb-8">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <span className="inline-block px-3 py-1 border border-black bg-black text-white text-xs font-mono uppercase tracking-widest mb-4">Plataforma Ciudadana v2.0</span>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 }
              }}
              className="mb-6 w-full"
            >
              <h1 className="sr-only">Mapeo Verde - Plataforma Ciudadana para el Cuidado Ambiental</h1>
              <LogoMap className="w-full max-w-[min(17rem,92vw)] md:max-w-2xl lg:max-w-4xl h-auto" />
            </motion.div>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-lg sm:text-xl md:text-2xl font-serif max-w-2xl leading-relaxed text-gray-800"
            >
              Agenda de actividades, participación ciudadana y áreas verdes: una plataforma para visibilizar, proteger y combatir la desigualdad ambiental con datos abiertos.
            </motion.p>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="flex w-full max-w-2xl flex-col gap-3 md:w-fit md:max-w-none md:flex-row md:flex-nowrap md:items-center md:justify-start md:gap-4 md:self-start"
          >
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#ff7e67", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/agenda')}
              className="inline-flex w-full shrink-0 items-center justify-center px-6 py-3 text-center font-bold uppercase tracking-wider text-sm text-white transition-colors border-2 border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-[#ff7e67] focus:outline-none focus:ring-2 focus:ring-black md:w-auto md:whitespace-nowrap"
              aria-label="Ver la agenda de eventos y actividades"
            >
              Ver agenda
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/manifiesto')}
              className="inline-flex w-full shrink-0 items-center justify-center px-6 py-3 text-center font-bold uppercase tracking-wider text-sm text-black transition-colors border-2 border-black bg-transparent hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black md:w-auto md:whitespace-nowrap"
              aria-label="Leer el manifiesto de Mapeo Verde"
            >
              Leer manifiesto
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 mt-8 md:mt-12"
      >
        <div className="border-t border-black pt-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-end text-xs font-mono uppercase tracking-widest text-gray-500">
          <div>Aguascalientes, MX</div>
          <div className="text-left sm:text-right">Datos Abiertos <br /> Licencia CC-BY-SA 4.0</div>
        </div>
      </motion.div>
    </header>
  );
};

export default HeroSection;
