import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Camera, Search, FileText, ArrowDown } from 'lucide-react';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { getSupabaseClient } from '../../../lib/supabase';

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
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollYRef = useRef(0);
  const [entryType, setEntryType] = useState<'GREEN_AREA' | 'EVENT'>('GREEN_AREA');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    // Área verde
    areaName: '',
    areaAddress: '',
    areaLat: '',
    areaLng: '',
    areaNeed: '',
    // Evento
    eventTitle: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventDescription: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#f3f4f0] text-black flex flex-col">
       <div 
         className="py-24 px-6 border-b border-black relative bg-white"
         style={{ paddingTop: isMobile ? `${navbarHeight + 48}px` : undefined }}
       >
          <div className="absolute top-0 right-0 w-32 h-32 border-l border-b border-black/10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 border-r border-t border-black/10"></div>

          <div className="max-w-4xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-12 border-b border-white/20 pb-8">
                <div className="w-16 h-16 bg-[#d89dff] text-black flex items-center justify-center rounded-full shrink-0 border-2 border-black">
                    <ArrowDown size={32} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tight">Registrar Área Verde o Evento</h2>
                    <p className="font-serif text-gray-700 mt-2 text-lg">
                      Usa este formulario para proponer una nueva área verde al inventario o sugerir un evento para la agenda ambiental.
                    </p>
                </div>
             </div>
             
             <form
               className="space-y-8"
               onSubmit={async (e) => {
                 e.preventDefault();
                 setIsSubmitting(true);
                 setSubmitMessage(null);
                 try {
                   const payload = {
                     tipo: entryType === 'GREEN_AREA' ? 'Área verde' : 'Evento',
                     nombre: formData.name,
                     correo: formData.email,
                     whatsapp: formData.whatsapp || null,
                     ...(entryType === 'GREEN_AREA'
                       ? {
                           areaName: formData.areaName,
                           areaAddress: formData.areaAddress,
                           areaLat: formData.areaLat,
                           areaLng: formData.areaLng,
                           areaNeed: formData.areaNeed,
                         }
                       : {
                           eventTitle: formData.eventTitle,
                           eventDate: formData.eventDate,
                           eventTime: formData.eventTime,
                           eventLocation: formData.eventLocation,
                           eventDescription: formData.eventDescription,
                         }),
                   };

                   const client = getSupabaseClient();
                   if (!client) {
                     throw new Error(
                       'Supabase no está configurado en este entorno (revisa las variables de entorno).',
                     );
                   }

                   const { error } = await client
                     .from('participation_submissions')
                     .insert({
                       type: entryType,
                       name: formData.name,
                       email: formData.email,
                       whatsapp: formData.whatsapp || null,
                       data: payload,
                     });

                   if (error) {
                     throw error;
                   }

                   setSubmitMessage(
                     'Gracias. Hemos registrado tu propuesta en la base de datos y el equipo la revisará pronto.',
                   );
                   setFormData({
                     name: '',
                     email: '',
                     whatsapp: '',
                     areaName: '',
                     areaAddress: '',
                     areaLat: '',
                     areaLng: '',
                     areaNeed: '',
                     eventTitle: '',
                     eventDate: '',
                     eventTime: '',
                     eventLocation: '',
                     eventDescription: '',
                   });
                 } catch (err: any) {
                   setSubmitMessage(
                     'No pudimos guardar en Supabase. Revisa la configuración del backend o vuelve a intentarlo más tarde.',
                   );
                 } finally {
                   setIsSubmitting(false);
                 }
               }}
             >
               {/* Datos de contacto */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                 <div className="space-y-4 group">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-black transition-colors">
                     Nombre Completo
                   </label>
                   <input
                     type="text"
                     className="w-full bg-transparent border-b-2 border-black/20 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                     placeholder="Escribe tu nombre..."
                     value={formData.name}
                     onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                     required
                   />
                 </div>
                 <div className="space-y-4 group">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-black transition-colors">
                     Correo Electrónico
                   </label>
                   <input
                     type="email"
                     className="w-full bg-transparent border-b-2 border-black/20 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                     placeholder="tucorreo@ejemplo.com"
                     value={formData.email}
                     onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                     required
                   />
                 </div>
                 <div className="space-y-4 group">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] group-hover:text-black transition-colors">
                     WhatsApp (opcional)
                   </label>
                   <input
                     type="tel"
                     className="w-full bg-transparent border-b-2 border-black/20 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                     placeholder="+52 ..."
                     value={formData.whatsapp}
                     onChange={(e) =>
                       setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                     }
                   />
                 </div>
               </div>

               {/* Selector de tipo de registro */}
               <div className="space-y-4 pt-8">
                 <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] block">
                   Quiero registrar:
                 </label>
                 <div className="flex flex-wrap gap-4">
                   <button
                     type="button"
                     onClick={() => setEntryType('GREEN_AREA')}
                     className={`px-6 py-3 border-2 border-black font-mono text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                       entryType === 'GREEN_AREA'
                         ? 'bg-[#b4ff6f] text-black'
                         : 'bg-transparent text-black hover:bg-black/5'
                     }`}
                   >
                     Nueva área verde
                   </button>
                   <button
                     type="button"
                     onClick={() => setEntryType('EVENT')}
                     className={`px-6 py-3 border-2 border-black font-mono text-sm uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                       entryType === 'EVENT'
                         ? 'bg-[#ff7e67] text-black'
                         : 'bg-transparent text-black hover:bg-black/5'
                     }`}
                   >
                     Evento para agenda
                   </button>
                 </div>
               </div>

               {/* Campos dinámicos */}
               {entryType === 'GREEN_AREA' ? (
                 <div className="space-y-6 pt-8">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] block">
                     Detalles del área verde
                   </label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                     <div className="space-y-3">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Nombre del lugar
                       </span>
                       <input
                         type="text"
                         className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                         placeholder="Ej. Parque del Barrio, Jardín central..."
                         value={formData.areaName}
                         onChange={(e) =>
                           setFormData((prev) => ({ ...prev, areaName: e.target.value }))
                         }
                         required
                       />
                     </div>
                     <div className="space-y-3">
                       <span className="text-xs font-mono text-gray-600 uppercase">Dirección</span>
                       <input
                         type="text"
                         className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                         placeholder="Calle, colonia, referencias..."
                         value={formData.areaAddress}
                         onChange={(e) =>
                           setFormData((prev) => ({ ...prev, areaAddress: e.target.value }))
                         }
                         required
                       />
                     </div>
                     <div className="space-y-3">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Coordenadas (opcional)
                       </span>
                       <div className="grid grid-cols-2 gap-4">
                         <input
                           type="text"
                           className="w-full bg-transparent border-b-2 border-black/20 py-3 text-lg font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                           placeholder="Latitud"
                           value={formData.areaLat}
                           onChange={(e) =>
                             setFormData((prev) => ({ ...prev, areaLat: e.target.value }))
                           }
                         />
                         <input
                           type="text"
                           className="w-full bg-transparent border-b-2 border-black/20 py-3 text-lg font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                           placeholder="Longitud"
                           value={formData.areaLng}
                           onChange={(e) =>
                             setFormData((prev) => ({ ...prev, areaLng: e.target.value }))
                           }
                         />
                       </div>
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Necesidad / problema principal
                       </span>
                       <textarea
                         className="w-full bg-transparent border-2 border-black/20 p-4 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400 min-h-[120px]"
                         placeholder="Describe brevemente el estado del lugar, riesgos o necesidades (tala, falta de riego, vandalismo, etc.)"
                         value={formData.areaNeed}
                         onChange={(e) =>
                           setFormData((prev) => ({ ...prev, areaNeed: e.target.value }))
                         }
                       />
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-6 pt-8">
                   <label className="font-mono text-xs uppercase tracking-widest text-[#d89dff] block">
                     Detalles del evento
                   </label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                     <div className="space-y-3">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Título del evento
                       </span>
                       <input
                         type="text"
                         className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                         placeholder="Ej. Jornada de reforestación..."
                         value={formData.eventTitle}
                         onChange={(e) =>
                           setFormData((prev) => ({ ...prev, eventTitle: e.target.value }))
                         }
                         required
                       />
                     </div>
                     <div className="space-y-3">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Fecha y hora
                       </span>
                       <div className="grid grid-cols-2 gap-4">
                         <input
                           type="date"
                           className="w-full bg-transparent border-b-2 border-black/20 py-3 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                           value={formData.eventDate}
                           onChange={(e) =>
                             setFormData((prev) => ({ ...prev, eventDate: e.target.value }))
                           }
                           required
                         />
                         <input
                           type="time"
                           className="w-full bg-transparent border-b-2 border-black/20 py-3 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                           value={formData.eventTime}
                           onChange={(e) =>
                             setFormData((prev) => ({ ...prev, eventTime: e.target.value }))
                           }
                           required
                         />
                       </div>
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Lugar / punto de reunión
                       </span>
                       <input
                         type="text"
                         className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                         placeholder="Dirección o referencia del lugar"
                         value={formData.eventLocation}
                         onChange={(e) =>
                           setFormData((prev) => ({ ...prev, eventLocation: e.target.value }))
                         }
                         required
                       />
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Descripción breve
                       </span>
                       <textarea
                         className="w-full bg-transparent border-2 border-black/20 p-4 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400 min-h-[120px]"
                         placeholder="¿Qué se hará? ¿Quién convoca? ¿Hay requisitos para asistir?"
                         value={formData.eventDescription}
                         onChange={(e) =>
                           setFormData((prev) => ({
                             ...prev,
                             eventDescription: e.target.value,
                           }))
                         }
                       />
                     </div>
                   </div>
                 </div>
               )}

               <div className="pt-16 flex flex-col md:flex-row gap-6 items-center">
                 <button
                   type="submit"
                   disabled={isSubmitting}
                   className="w-full md:w-auto px-12 py-5 bg-[#d89dff] text-black text-xl font-bold uppercase tracking-widest hover:bg-[#ff7e67] hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none border-2 border-black disabled:opacity-60 disabled:cursor-not-allowed"
                 >
                   {isSubmitting ? 'Preparando correo...' : 'Enviar propuesta'}
                 </button>
                 <p className="text-xs font-mono text-gray-600 max-w-xs text-center md:text-left">
                   Tu propuesta no se publica automáticamente. El equipo revisará la información y
                   la integrará al inventario o a la agenda.
                 </p>
               </div>

               {submitMessage && (
                 <p className="mt-4 text-xs font-mono text-[#2f855a] max-w-xl">
                   {submitMessage}
                 </p>
               )}
             </form>
          </div>
        </div>
    </div>
  );
};

export default ParticipationPage;
