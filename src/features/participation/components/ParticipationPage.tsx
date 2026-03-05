import { useState, useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { getSupabaseClient } from '../../../lib/supabase';
import { Map, Marker } from 'pigeon-maps';

const HALF_HOUR_TIME_OPTIONS = Array.from({ length: 24 * 2 }, (_, index) => {
  const hours = Math.floor(index / 2)
    .toString()
    .padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

const timeToMinutes = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const [h, m] = value.split(':').map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const ParticipationPage = () => {
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);
  const [entryType, setEntryType] = useState<'GREEN_AREA' | 'EVENT'>('EVENT');
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
    eventStartTime: '',
    eventEndTime: '',
    eventLocation: '',
    eventDescription: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.8853, -102.2916]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [eventMarker, setEventMarker] = useState<[number, number] | null>(null);
  const [eventLocationSuggestions, setEventLocationSuggestions] = useState<
    { label: string; lat: number; lng: number }[]
  >([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const eventLocationAbortRef = useRef<AbortController | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImageName, setEventImageName] = useState<string | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

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
    if (submitMessage) {
      setSnackbarOpen(true);
      const timeout = setTimeout(() => {
        setSnackbarOpen(false);
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [submitMessage]);

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
                 setSubmitStatus(null);
                 try {
                   if (entryType === 'EVENT') {
                     const start = formData.eventStartTime;
                     const end = formData.eventEndTime;
                     const toMinutes = (value: string) => {
                       const [h, m] = value.split(':').map((v) => parseInt(v, 10));
                       if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
                       return h * 60 + m;
                     };
                     const startMinutes = toMinutes(start);
                     const endMinutes = toMinutes(end);
                     if (
                       !start ||
                       !end ||
                       Number.isNaN(startMinutes) ||
                       Number.isNaN(endMinutes) ||
                       endMinutes <= startMinutes
                     ) {
                       setSubmitMessage(
                         'Revisa el horario: la hora de fin debe ser mayor que la hora de inicio.',
                       );
                       setSubmitStatus('error');
                       setIsSubmitting(false);
                       return;
                     }
                   }

                   const client = getSupabaseClient();
                   if (!client) {
                     throw new Error(
                       'Supabase no está configurado en este entorno (revisa las variables de entorno).',
                     );
                   }

                   let eventImageUrl: string | null = null;
                   let imageStatusMessage: string | null = null;
                   if (entryType === 'EVENT') {
                     if (eventImageFile) {
                       try {
                         const ext = eventImageFile.name.split('.').pop() || 'jpg';
                         const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                         const path = `event-banners/${Date.now()}-${Math.random()
                           .toString(36)
                           .slice(2)}.${safeExt}`;

                         const { data: uploadData, error: uploadError } = await client.storage
                           .from('event_banners')
                           .upload(path, eventImageFile, {
                             cacheControl: '3600',
                             upsert: false,
                           });

                         if (uploadError) {
                           imageStatusMessage = `No se pudo subir la imagen del evento: ${uploadError.message}`;
                         } else if (uploadData?.path) {
                           const { data: publicUrlData } = client.storage
                             .from('event_banners')
                             .getPublicUrl(uploadData.path);
                           if (publicUrlData?.publicUrl) {
                             eventImageUrl = publicUrlData.publicUrl;
                             imageStatusMessage = 'Imagen del evento cargada correctamente.';
                           } else {
                             imageStatusMessage =
                               'No se pudo obtener la URL pública del cartel del evento.';
                           }
                         } else {
                           imageStatusMessage =
                             'No se recibió información de la ruta de la imagen subida.';
                         }
                       } catch (error: any) {
                         imageStatusMessage =
                           'Error inesperado al subir la imagen del evento. Detalle: ' +
                           (error?.message || 'sin mensaje de error');
                       }
                     } else {
                       imageStatusMessage = 'No se detectó ningún archivo de imagen adjunto.';
                     }
                   }

                   if (entryType === 'GREEN_AREA') {
                     const payload = {
                       tipo: 'Área verde',
                       nombre: formData.name,
                       correo: formData.email,
                       whatsapp: formData.whatsapp || null,
                       areaName: formData.areaName,
                       areaAddress: formData.areaAddress,
                       areaLat: formData.areaLat,
                       areaLng: formData.areaLng,
                       areaNeed: formData.areaNeed,
                     };
                     const { error } = await client
                       .from('participation_submissions')
                       .insert({
                         type: entryType,
                         name: formData.name,
                         email: formData.email,
                         whatsapp: formData.whatsapp || null,
                         data: payload,
                       });
                     if (error) throw error;
                   } else {
                     const date = (formData.eventDate || '').toString().slice(0, 10);
                     const startTime = (formData.eventStartTime || '10:00').slice(0, 5);
                     const endTime = (formData.eventEndTime || formData.eventStartTime || '11:00').slice(0, 5);
                     const timeLabel = `${startTime}–${endTime}`;
                     const isoStart = `${date}T${startTime}:00`;
                     const isoEnd = `${date}T${endTime}:00`;
                     const { error } = await client
                       .from('events')
                       .insert({
                         title: formData.eventTitle,
                         date,
                         time: timeLabel,
                         iso_start: isoStart,
                         iso_end: isoEnd,
                         location: formData.eventLocation,
                         category: 'Propuesta ciudadana',
                         description: formData.eventDescription || null,
                         image: eventImageUrl || null,
                         status: 'pending',
                         source: 'participation',
                         contact_name: formData.name || null,
                         contact_email: formData.email || null,
                       });
                     if (error) throw error;
                   }

                   let successMessage =
                     'Gracias. Hemos registrado tu propuesta en la base de datos y el equipo la revisará pronto.';
                   if (imageStatusMessage) {
                     successMessage += ' Detalle sobre la imagen: ' + imageStatusMessage;
                   }
                   setSubmitMessage(successMessage);
                   setSubmitStatus('success');
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
                     eventStartTime: '',
                     eventEndTime: '',
                     eventLocation: '',
                     eventDescription: '',
                   });
                   setEventImageFile(null);
                   if (eventImagePreview) {
                     URL.revokeObjectURL(eventImagePreview);
                   }
                   setEventImagePreview(null);
                 } catch (err: any) {
                   setSubmitMessage(
                     'No pudimos guardar en Supabase. Revisa la configuración del backend o vuelve a intentarlo más tarde.',
                   );
                  setSubmitStatus('error');
                 } finally {
                   setIsSubmitting(false);
                 }
               }}
             >
              {submitMessage && snackbarOpen && (
                <div
                  role="alert"
                  className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-3 rounded-lg shadow-lg border max-w-[min(90vw,28rem)] min-w-[18rem] animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    submitStatus === 'success'
                      ? 'bg-green-600 border-green-700 text-white'
                      : 'bg-red-600 border-red-700 text-white'
                  }`}
                >
                  <span className="text-sm flex-1">{submitMessage}</span>
                  <button
                    type="button"
                    className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={() => setSnackbarOpen(false)}
                    aria-label="Cerrar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
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
                     inputMode="numeric"
                     maxLength={10}
                     className="w-full bg-transparent border-b-2 border-black/20 py-4 text-2xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                    placeholder="Ej. 4492345678"
                     value={formData.whatsapp}
                     onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))
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
                        Ubicación en mapa (OpenStreetMap)
                      </span>
                      <div className="w-full h-64 border border-black bg-gray-100 overflow-hidden">
                        <Map
                          center={
                            formData.areaLat && formData.areaLng
                              ? [
                                  parseFloat(formData.areaLat) || mapCenter[0],
                                  parseFloat(formData.areaLng) || mapCenter[1],
                                ]
                              : mapCenter
                          }
                          zoom={mapZoom}
                          height={256}
                          provider={(x, y, z) =>
                            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
                          }
                          onBoundsChanged={({ center, zoom }: any) => {
                            setMapCenter(center);
                            setMapZoom(zoom);
                          }}
                          onClick={async ({ latLng }: { latLng: [number, number] }) => {
                            const [lat, lng] = latLng;
                            setFormData((prev) => ({
                              ...prev,
                              areaLat: lat.toFixed(6),
                              areaLng: lng.toFixed(6),
                              // Fallback inmediato: al menos mostrar coordenadas como texto
                              areaAddress:
                                prev.areaAddress && prev.areaAddress.length > 0
                                  ? prev.areaAddress
                                  : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                            }));
                            setMapCenter([lat, lng]);
                            try {
                              setIsReverseGeocoding(true);
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                              );
                              if (response.ok) {
                                const data = await response.json();
                                if (data?.display_name) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    areaAddress: data.display_name,
                                  }));
                                }
                              }
                            } finally {
                              setIsReverseGeocoding(false);
                            }
                          }}
                        >
                          {formData.areaLat && formData.areaLng && (
                            <Marker
                              width={40}
                              anchor={[
                                parseFloat(formData.areaLat) || mapCenter[0],
                                parseFloat(formData.areaLng) || mapCenter[1],
                              ]}
                            />
                          )}
                        </Map>
                      </div>
                      <p className="text-[11px] font-mono text-gray-500">
                        Haz clic en el mapa para elegir el lugar.{' '}
                        {isReverseGeocoding && 'Buscando dirección...'}
                      </p>
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
                         Fecha y horario
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
                         <div className="grid grid-cols-2 gap-3">
                           <select
                             className="w-full bg-transparent border-b-2 border-black/20 py-3 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all"
                             value={formData.eventStartTime}
                             onChange={(e) =>
                               setFormData((prev) => ({
                                 ...prev,
                                 eventStartTime: e.target.value,
                                 // Siempre forzar a que el usuario vuelva a elegir la hora de fin
                                 eventEndTime: '',
                               }))
                             }
                             required
                           >
                             <option value="">Inicio</option>
                             {HALF_HOUR_TIME_OPTIONS.map((time) => (
                               <option key={time} value={time}>
                                 {time}
                               </option>
                             ))}
                           </select>
                           <select
                             className="w-full bg-transparent border-b-2 border-black/20 py-3 text-base font-light focus:border-[#d89dff] focus:outline-none transition-all"
                             value={formData.eventEndTime}
                             onChange={(e) =>
                               setFormData((prev) => ({ ...prev, eventEndTime: e.target.value }))
                             }
                             required
                           >
                             <option value="">Fin</option>
                             {HALF_HOUR_TIME_OPTIONS.map((time) => {
                               const startMinutes = timeToMinutes(formData.eventStartTime);
                               const thisMinutes = timeToMinutes(time);
                               const disabled =
                                 startMinutes != null &&
                                 thisMinutes != null &&
                                 thisMinutes <= startMinutes;
                               return (
                                 <option key={time} value={time} disabled={disabled}>
                                   {time}
                                 </option>
                               );
                             })}
                           </select>
                         </div>
                       </div>
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
                    <div className="space-y-3 md:col-span-2">
                      <span className="text-xs font-mono text-gray-600 uppercase block">
                        Cartel del evento o imagen
                      </span>
                      <div>
                        <label className="inline-flex items-center justify-center px-4 py-2 border-2 border-black bg-[#d89dff] text-black font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-[#ff7e67] hover:text-white transition-colors">
                          Seleccionar imagen
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files && e.target.files[0];
                              setEventImageFile(file || null);
                              setEventImageName(file ? file.name : null);
                              if (eventImagePreview) {
                                URL.revokeObjectURL(eventImagePreview);
                              }
                              if (file) {
                                const previewUrl = URL.createObjectURL(file);
                                setEventImagePreview(previewUrl);
                              } else {
                                setEventImagePreview(null);
                              }
                            }}
                          />
                        </label>
                      </div>
                       <div className="text-[11px] font-mono text-gray-600 mt-1">
                         {eventImageName ? (
                           <span>Archivo seleccionado: {eventImageName}</span>
                         ) : (
                           <span>Sin archivo seleccionado</span>
                         )}
                       </div>
                       {eventImagePreview && (
                         <div className="mt-3 border border-black bg-gray-100 w-full max-w-md overflow-hidden">
                           <img
                             src={eventImagePreview}
                             alt="Vista previa del cartel del evento"
                             className="w-fit h-[250px] object-contain bg-white"
                           />
                         </div>
                       )}
                       <p className="text-[11px] font-mono text-gray-500">
                         Opcional. Se usará como imagen de referencia del evento.
                       </p>
                     </div>
                     <div className="space-y-3 md:col-span-2">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                         Lugar / punto de reunión
                       </span>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
                          placeholder="Dirección o referencia del lugar"
                          value={formData.eventLocation}
                          onChange={async (e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({ ...prev, eventLocation: value }));

                            // Limpia sugerencias si hay muy poco texto
                            if (!value || value.trim().length < 3) {
                              setEventLocationSuggestions([]);
                              if (eventLocationAbortRef.current) {
                                eventLocationAbortRef.current.abort();
                              }
                              return;
                            }

                            if (eventLocationAbortRef.current) {
                              eventLocationAbortRef.current.abort();
                            }
                            const controller = new AbortController();
                            eventLocationAbortRef.current = controller;

                            try {
                              setIsSearchingLocation(true);
                              const baseUrl = 'https://nominatim.openstreetmap.org/search';
                              // Viewbox aproximado que cubre el estado de Aguascalientes
                              const params = new URLSearchParams({
                                format: 'jsonv2',
                                // Forzar contexto de búsqueda en Aguascalientes para nombres de negocios
                                q: `${value}, Aguascalientes`,
                                addressdetails: '1',
                                namedetails: '1',
                                limit: '15',
                                countrycodes: 'mx',
                                viewbox: '-102.8,22.3,-101.8,21.5', // lon_min,lat_max,lon_max,lat_min
                                bounded: '1',
                              });
                              const url = `${baseUrl}?${params.toString()}`;
                              const response = await fetch(url, {
                                signal: controller.signal,
                                headers: {
                                  'Accept-Language': 'es',
                                },
                              });
                              if (!response.ok) {
                                setEventLocationSuggestions([]);
                                return;
                              }
                              const data: any[] = await response.json();
                              const qLower = value.toLowerCase();
                              const filtered = (data || []).filter((item: any) => {
                                const address = item.address || {};
                                const state: string | undefined =
                                  address.state || address.state_district;
                                const displayName: string = item.display_name || '';
                                return (
                                  (state &&
                                    state.toLowerCase().includes('aguascalientes')) ||
                                  displayName.toLowerCase().includes('aguascalientes')
                                );
                              });

                              // Priorizar lugares cuyo nombre parezca negocio / lugar específico
                              const scored = filtered
                                .map((item: any) => {
                                  const displayName: string = item.display_name || '';
                                  const name: string =
                                    (item.namedetails && item.namedetails.name) || '';
                                  const cls: string = item.class || '';
                                  let score = 0;

                                  const displayLower = displayName.toLowerCase();
                                  const nameLower = name.toLowerCase();

                                  if (nameLower === qLower) score += 5;
                                  else if (nameLower.startsWith(qLower)) score += 4;
                                  else if (displayLower.startsWith(qLower)) score += 3;
                                  else if (displayLower.includes(qLower)) score += 1;

                                  if (
                                    ['amenity', 'shop', 'tourism', 'leisure', 'landuse'].includes(
                                      cls,
                                    )
                                  ) {
                                    score += 1;
                                  }

                                  return { item, score };
                                })
                                .sort((a: any, b: any) => b.score - a.score);

                              const suggestions = scored.slice(0, 5).map(({ item }: any) => ({
                                label: item.display_name as string,
                                lat: parseFloat(item.lat),
                                lng: parseFloat(item.lon),
                              }));
                              setEventLocationSuggestions(suggestions);
                            } catch {
                              // Ignorar errores de red / abort
                            } finally {
                              setIsSearchingLocation(false);
                            }
                          }}
                          required
                        />
                        {(eventLocationSuggestions.length > 0 || isSearchingLocation) && (
                          <div className="absolute left-0 right-0 mt-1 bg-white border border-black/20 shadow-lg max-h-64 overflow-auto z-20">
                            {isSearchingLocation && (
                              <div className="px-3 py-2 text-xs font-mono text-gray-500">
                                Buscando lugares...
                              </div>
                            )}
                            {eventLocationSuggestions.map((suggestion, index) => (
                              <button
                                key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                                type="button"
                                className="block w-full text-left px-3 py-2 text-xs font-mono hover:bg-[#f3f4f0] border-t border-black/5"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    eventLocation: suggestion.label,
                                  }));
                                  setMapCenter([suggestion.lat, suggestion.lng]);
                                  setMapZoom(16);
                                  setEventMarker([suggestion.lat, suggestion.lng]);
                                  setEventLocationSuggestions([]);
                                }}
                              >
                                {suggestion.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                     </div>
                    <div className="space-y-3 md:col-span-2">
                      <span className="text-xs font-mono text-gray-600 uppercase">
                        Ubicación en mapa (OpenStreetMap)
                      </span>
                      <div className="w-full h-64 border border-black bg-gray-100 overflow-hidden">
                        <Map
                          center={mapCenter}
                          zoom={mapZoom}
                          height={256}
                          provider={(x, y, z) =>
                            `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
                          }
                          onBoundsChanged={({ center, zoom }: any) => {
                            setMapCenter(center);
                            setMapZoom(zoom);
                          }}
                          onClick={async ({ latLng }: { latLng: [number, number] }) => {
                            const [lat, lng] = latLng;
                            setMapCenter([lat, lng]);
                            setEventMarker([lat, lng]);
                            // Fallback inmediato: escribir coordenadas si aún no hay texto
                            setFormData((prev) => ({
                              ...prev,
                              eventLocation:
                                prev.eventLocation && prev.eventLocation.length > 0
                                  ? prev.eventLocation
                                  : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                            }));
                            try {
                              setIsReverseGeocoding(true);
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
                              );
                              if (response.ok) {
                                const data = await response.json();
                                if (data?.display_name) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    eventLocation: data.display_name,
                                  }));
                                }
                              }
                            } finally {
                              setIsReverseGeocoding(false);
                            }
                          }}
                        >
                          {eventMarker && (
                            <Marker width={40} anchor={eventMarker} />
                          )}
                        </Map>
                      </div>
                      <p className="text-[11px] font-mono text-gray-500">
                        Haz clic en el mapa para buscar la dirección aproximada del evento.
                      </p>
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

             </form>
          </div>
        </div>
    </div>
  );
};

export default ParticipationPage;
