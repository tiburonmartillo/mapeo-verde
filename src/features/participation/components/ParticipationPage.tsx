import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Camera, Search, FileText, ArrowDown } from 'lucide-react';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const PARTICIPATION_ROLES = [
  {
    icon: Camera,
    color: '#d89dff',
    title: 'Explorador Urbano',
    description: 'Sal a las calles de tu colonia. Tu misión es fotografiar, medir y georreferenciar árboles y áreas verdes usando nuestra app web.',
    requirements: [
      'Smartphone con GPS',
      'Caminatas al aire libre',
      'Sin experiencia previa'
    ],
    buttonText: 'Quiero Mapear',
    buttonColor: '#d89dff'
  },
  {
    icon: Search,
    color: '#b4ff6f',
    title: 'Analista de Datos',
    description: 'Verifica la calidad de la información desde casa. Ayuda a identificar especies en las fotos y valida reportes de alertas ciudadanas.',
    requirements: [
      'Computadora / Tablet',
      'Curiosidad botánica',
      'Atención al detalle'
    ],
    buttonText: 'Quiero Validar',
    buttonColor: '#b4ff6f'
  },
  {
    icon: FileText,
    color: '#fccb4e',
    title: 'Investigador',
    description: 'Usa nuestros datos abiertos para generar reportes, tesis académicas o artículos periodísticos sobre el estado ambiental de la ciudad.',
    requirements: [
      'Análisis de datos',
      'Generación de impacto',
      'Publicación libre'
    ],
    buttonText: 'Descargar Datos',
    buttonColor: '#fccb4e'
  }
];

const FORM_ROLES = ['Explorador', 'Analista', 'Investigador', 'Desarrollador', 'Difusión'];

const ParticipationPage = () => {
  const roles = useMemo(() => PARTICIPATION_ROLES, []);
  const formRoles = useMemo(() => FORM_ROLES, []);
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
         className="bg-[#d89dff] border-b border-black p-12 md:p-24 text-center relative overflow-hidden transition-[padding-top] duration-300 ease-in-out" 
         style={{ paddingTop: isMobile ? `${navbarHeight + 48}px` : undefined }}
       >
          <div className="relative z-10 max-w-4xl mx-auto">
             <div className="inline-block border border-black bg-white px-4 py-1 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-mono text-xs uppercase tracking-widest font-bold">Únete a la Brigada</span>
             </div>
             <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
                TU CIUDAD<br/>TE NECESITA
             </h1>
             <p className="font-serif text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed text-black/80">
                No somos una empresa. Somos una red descentralizada de ciudadanos construyendo la base de datos ambiental más grande de la región.
             </p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <svg width="100%" height="100%">
                <pattern id="p-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                   <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="1"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#p-grid)" />
             </svg>
          </div>
       </div>

       <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-4 border-black pb-4 gap-4">
             <h2 className="text-4xl font-bold tracking-tight">¿CÓMO PUEDES AYUDAR?</h2>
             <p className="font-mono text-sm max-w-md text-right md:text-left">
                Existen múltiples formas de colaborar, desde salir a la calle hasta analizar datos desde tu casa.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {roles.map((role, idx) => {
               const IconComponent = role.icon;
               return (
                 <div key={idx} className="flex flex-col border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform duration-300">
                    <div className={`bg-black text-white w-16 h-16 flex items-center justify-center rounded-full mb-6 border-2`} style={{ borderColor: role.color }}>
                       <IconComponent size={32} />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{role.title}</h3>
                    <p className="font-serif text-gray-600 mb-6 flex-grow">
                       {role.description}
                    </p>
                    <div className="border-t border-dashed border-gray-300 pt-4 mb-8">
                        <ul className="text-xs font-mono space-y-2 text-gray-500 uppercase">
                           {role.requirements.map((req, i) => (
                             <li key={i} className="flex items-center gap-2">
                               <div className="w-2 h-2" style={{ backgroundColor: role.color }} />
                               {req}
                             </li>
                           ))}
                        </ul>
                    </div>
                    <button className="w-full py-4 border-2 border-black text-black font-bold uppercase hover:bg-[#ff7e67] hover:text-white transition-colors tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1" style={{ backgroundColor: role.buttonColor }}>
                       {role.buttonText}
                    </button>
                 </div>
               );
             })}
          </div>
       </div>

       <div className="bg-black text-white py-24 px-6 border-t border-black relative">
          <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-white/20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 border-r border-t border-white/20"></div>

          <div className="max-w-4xl mx-auto relative z-10">
             <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-white/20 pb-8">
                <div className="w-16 h-16 bg-[#d89dff] text-black flex items-center justify-center rounded-full shrink-0">
                    <ArrowDown size={32} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">Registro de Voluntarios</h2>
                    <p className="font-serif text-gray-400 mt-2 text-lg">Únete a nuestra comunidad en WhatsApp y recibe tu kit de bienvenida digital.</p>
                </div>
             </div>
             
             <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                   <div className="space-y-4 group">
                      <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-white transition-colors">Nombre Completo</label>
                      <input type="text" className="w-full bg-transparent border-b-2 border-white/30 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-white/20" placeholder="Escribe tu nombre..." />
                   </div>
                   <div className="space-y-4 group">
                      <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-white transition-colors">Correo Electrónico</label>
                      <input type="email" className="w-full bg-transparent border-b-2 border-white/30 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-white/20" placeholder="tucorreo@ejemplo.com" />
                   </div>
                </div>
                
                <div className="space-y-6 pt-8">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] block">Me interesa participar como (Selecciona varios):</label>
                   <div className="flex flex-wrap gap-4">
                      {formRoles.map(role => (
                         <label key={role} className="flex items-center gap-3 cursor-pointer group select-none">
                            <input type="checkbox" className="peer sr-only" />
                            <div className="w-8 h-8 border-2 border-white peer-checked:bg-[#d89dff] peer-checked:border-[#d89dff] flex items-center justify-center transition-all">
                               <div className="w-4 h-4 bg-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-bold text-xl text-white peer-checked:text-[#d89dff] transition-colors">{role}</span>
                         </label>
                      ))}
                   </div>
                </div>

                <div className="pt-16 flex flex-col md:flex-row gap-6 items-center">
                   <button className="w-full md:w-auto px-12 py-5 bg-[#d89dff] text-black text-xl font-bold uppercase tracking-widest hover:bg-[#ff7e67] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none border-2 border-black">
                      Enviar Registro
                   </button>
                   <p className="text-xs font-mono text-gray-500 max-w-xs text-center md:text-left">
                      Al registrarte aceptas nuestra política de datos abiertos y privacidad. No compartimos tus datos.
                   </p>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
};

export default ParticipationPage;
