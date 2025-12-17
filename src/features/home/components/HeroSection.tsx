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
      className="relative min-h-[85vh] bg-[#f3f4f0] text-black overflow-hidden flex flex-col justify-between pb-12 border-b border-black transition-[padding-top] duration-300 ease-in-out"
      style={{ paddingTop: isMobile ? `${navbarHeight + 128}px` : '128px' }}
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
        className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 items-end"
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
              <LogoMap className="w-64 h-auto" />
            </motion.div>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-xl md:text-2xl font-serif max-w-lg leading-relaxed text-gray-800"
            >
              Combatimos la desigualdad ambiental con datos abiertos. Una herramienta para visibilizar, proteger y expandir nuestras áreas verdes.
            </motion.p>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
            className="flex flex-wrap gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#ff7e67", color: "#fff" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/manifiesto')}
              className="px-6 py-3 bg-black text-white font-bold uppercase text-sm tracking-wider transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none hover:bg-[#ff7e67] focus:outline-none focus:ring-2 focus:ring-black"
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
        className="w-full max-w-7xl mx-auto px-6 mt-12"
      >
        <div className="border-t border-black pt-4 flex justify-between items-end text-xs font-mono uppercase tracking-widest text-gray-500">
          <div>Aguascalientes, MX</div>
          <div className="text-right">Datos Abiertos <br /> Licencia CC-BY-SA 4.0</div>
        </div>
      </motion.div>
    </header>
  );
};

export default HeroSection;
