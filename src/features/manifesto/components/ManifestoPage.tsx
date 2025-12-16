import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const MANIFESTO_SECTIONS = [
  {
    title: '1. El Problema es Real',
    content: [
      'Nuestras ciudades se están calentando. La falta de arbolado y la expansión descontrolada de superficies de concreto generan islas de calor que afectan desproporcionadamente a las zonas marginadas.',
      'Mientras las colonias más privilegiadas disfrutan de parques y áreas verdes, las comunidades vulnerables enfrentan temperaturas extremas, falta de sombra y espacios públicos degradados.',
      'Esta desigualdad ambiental no es casualidad. Es el resultado de décadas de planificación urbana que prioriza el desarrollo inmobiliario sobre el bienestar comunitario.'
    ]
  },
  {
    title: '2. Los Datos son Poder',
    content: [
      'No podemos combatir lo que no podemos medir. Mapeo Verde nace de la convicción de que los datos abiertos y accesibles son la herramienta más poderosa para la justicia ambiental.',
      'Cada árbol mapeado, cada área verde documentada, cada alerta ciudadana registrada se convierte en evidencia irrefutable de la necesidad de acción.',
      'Creemos en la transparencia radical. Todos nuestros datos son públicos, verificables y utilizables bajo licencia CC-BY-SA 4.0.'
    ]
  },
  {
    title: '3. La Inteligencia es Colectiva',
    content: [
      'No somos una empresa. No somos una ONG tradicional. Somos una red descentralizada de ciudadanos que han decidido tomar acción directa.',
      'Cada persona que sale a mapear, cada analista que valida datos, cada investigador que genera reportes, cada vecino que reporta una alerta, es parte de esta inteligencia colectiva.',
      'No esperamos a que otros resuelvan nuestros problemas. Los resolvemos juntos, desde abajo, con nuestras propias manos y herramientas.'
    ]
  },
  {
    title: '4. La Acción es Local',
    content: [
      'Empezamos en Aguascalientes, pero nuestra visión es replicable en cualquier ciudad del mundo. Cada comunidad puede adaptar estas herramientas y metodologías a su contexto específico.',
      'Creemos en el poder de lo local: los vecinos conocen mejor que nadie sus espacios, sus necesidades y sus historias.',
      'El cambio global comienza con acción local. Cada ciudad que se mapea, cada comunidad que se organiza, es un paso hacia un futuro más justo y sostenible.'
    ]
  }
];

const COMMITMENT_POINTS = [
  'Mantener todos los datos abiertos y accesibles, sin restricciones comerciales.',
  'Priorizar la participación ciudadana sobre intereses corporativos o políticos.',
  'Documentar y compartir nuestras metodologías para que otros puedan replicarlas.',
  'Escuchar activamente a las comunidades y adaptar nuestras herramientas a sus necesidades reales.',
  'Mantenernos independientes y no aceptar financiamiento que comprometa nuestros principios.'
];

const ManifestoPage = () => {
  const navigate = useNavigate();
  const sections = useMemo(() => MANIFESTO_SECTIONS, []);
  const [navbarHeight, setNavbarHeight] = useState(64);
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
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col">
      <div 
        className="bg-[#b4ff6f] border-b border-black p-12 md:p-24 text-center relative overflow-hidden transition-[padding-top] duration-300 ease-in-out" 
        style={{ paddingTop: isMobile ? `${navbarHeight + 48}px` : undefined }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block border border-black bg-white px-4 py-1 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-mono text-xs uppercase tracking-widest font-bold">Manifiesto</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
            MANIFIESTO<br/>MAPEO VERDE
          </h1>
          <p className="font-serif text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed text-black/80">
            Nuestros principios, valores y compromisos en la lucha por la justicia ambiental urbana.
          </p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%">
            <pattern id="p-grid-manifiesto" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#p-grid-manifiesto)" />
          </svg>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-12">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`border-2 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
                idx === 4 ? 'bg-[#b4ff6f]' : 'bg-white'
              }`}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 uppercase tracking-tight">
                {section.title}
              </h2>
              <div className="space-y-4 font-serif text-lg leading-relaxed">
                {section.content.map((para, i) => (
                  <p key={i} className={i === section.content.length - 1 ? 'font-bold' : ''}>
                    {para}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="border-2 border-black bg-[#b4ff6f] p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 uppercase tracking-tight">
              5. Nuestro Compromiso
            </h2>
            <div className="space-y-4 font-serif text-lg leading-relaxed">
              <p className="font-bold">Nos comprometemos a:</p>
              <ul className="space-y-3 list-none">
                {COMMITMENT_POINTS.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-2xl">●</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="text-center pt-8"
          >
            <p className="font-serif text-xl mb-6 text-gray-700">
              ¿Compartes estos valores? Únete a la red.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#000", color: "#b4ff6f" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/participacion')}
              className="px-8 py-4 bg-[#b4ff6f] text-black font-bold uppercase text-sm tracking-wider transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              Participar Ahora
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ManifestoPage;
