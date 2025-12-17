import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Download, ExternalLink, ArrowDown, ArrowRight, TreePine, MessageCircle, Image, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as Popover from '@radix-ui/react-popover';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { getGoogleCalendarUrl, downloadICS } from '../../../utils/helpers/calendarHelpers';
import { useAccentColor } from '../../../utils/helpers/routingHelpers';
import { shareToWhatsApp, shareToInstagram } from '../../../utils/helpers/shareHelpers';

interface EventsPageProps {
  onSelectImpact?: (impactId: string | number) => void;
}

// Subcomponent: EventImage
const EventImage = ({ event }: any) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full md:w-64 h-48 md:h-auto border-t-2 md:border-t-0 md:border-l-2 border-black relative overflow-hidden bg-gray-100">
      {event.image && !imageError ? (
        <img 
          src={event.image} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center p-4">
            <TreePine size={48} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono uppercase opacity-50 line-clamp-2 px-2">{event.title}</p>
          </div>
        </div>
      )}
      {event.image && !imageError && (
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors pointer-events-none" />
      )}
    </div>
  );
};

// Componente para renderizar descripción HTML de forma segura
const EventDescription = ({ description }: { description: string }) => {
  if (!description) return null;
  
  // Limpiar y formatear HTML básico
  const formatDescription = (text: string) => {
    // Remover URLs de imágenes (no queremos mostrarlas en el texto)
    const imageUrlPatterns = [
      /https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<>"']*)?/gi,
      /https?:\/\/photos\.app\.goo\.gl\/[^\s<>"']+/gi,
      /https?:\/\/drive\.google\.com\/[^\s<>"']+/gi,
      /https?:\/\/(?:i\.)?imgur\.com\/[^\s<>"']+/gi,
      /https?:\/\/[^\s<>"']*\.(jpg|jpeg|png|gif|webp|svg)/gi
    ];
    
    let formatted = text;
    imageUrlPatterns.forEach(pattern => {
      formatted = formatted.replace(pattern, '');
    });
    
    // Limpiar espacios múltiples y saltos de línea duplicados
    formatted = formatted.replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim();
    
    // Convertir saltos de línea a <br>
    formatted = formatted.replace(/\n/g, '<br>').replace(/<br><br>/g, '<br>');
    
    // Convertir <h1> a estilos apropiados
    formatted = formatted.replace(/<h1>(.*?)<\/h1>/gi, '<h3 class="font-bold text-lg mb-2 mt-4">$1</h3>');
    formatted = formatted.replace(/<h2>(.*?)<\/h2>/gi, '<h4 class="font-bold text-base mb-2 mt-3">$1</h4>');
    formatted = formatted.replace(/<h3>(.*?)<\/h3>/gi, '<h5 class="font-bold text-sm mb-1 mt-2">$1</h5>');
    
    // Convertir <strong> y <b> a bold
    formatted = formatted.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, '<strong class="font-bold">$2</strong>');
    
    // Convertir <em> y <i> a italic
    formatted = formatted.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, '<em class="italic">$2</em>');
    
    // Convertir <p> a párrafos con espaciado
    formatted = formatted.replace(/<p>(.*?)<\/p>/gi, '<p class="mb-2">$1</p>');
    
    // Convertir <a> a enlaces (solo si no son imágenes)
    formatted = formatted.replace(/<a\s+href=["']([^"']+)["']([^>]*)>(.*?)<\/a>/gi, 
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#ff7e67] underline hover:text-black break-all">$3</a>');
    
    return formatted;
  };
  
  const htmlContent = formatDescription(description);
  
  if (!htmlContent || htmlContent.trim() === '') {
    return null;
  }
  
  return (
    <div 
      className="font-serif text-gray-600 text-sm leading-relaxed max-h-40 overflow-y-auto overflow-x-hidden
        prose prose-sm max-w-none
        prose-headings:font-bold prose-headings:text-gray-800 prose-headings:mt-4 prose-headings:mb-2
        prose-p:mb-2 prose-p:last:mb-0 prose-p:break-words
        prose-strong:font-bold prose-strong:text-gray-800
        prose-a:text-[#ff7e67] prose-a:underline prose-a:hover:text-black prose-a:break-all
        [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm
        [&>br]:block [&>br]:mb-1
        [&_*]:break-words"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Componente para evento del calendario con Popover
const CalendarEventPopover = ({ event, baseUrl, handleShareToInstagram }: { event: any; baseUrl: string; handleShareToInstagram: (event: any) => void }) => {
  const [open, setOpen] = useState(false);
  
  // Bloquear scroll cuando el Popover está abierto
  useEffect(() => {
    if (open) {
      // Guardar el valor actual del overflow
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Bloquear el scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar el scroll cuando se cierra
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);
  
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div 
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full truncate text-[8px] md:text-[10px] bg-black text-white px-0.5 md:px-1 py-0.5 rounded-none font-medium cursor-pointer hover:bg-[#ff7e67] transition-colors"
        >
          {event.title}
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-w-[calc(100vw-2rem)] md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          sideOffset={8}
          align="start"
          side="right"
        >
          {/* Botón cerrar */}
          <Popover.Close asChild>
            <button
              className="absolute top-4 right-4 z-10 p-2 bg-black text-white hover:bg-[#ff7e67] transition-colors border-2 border-black"
            >
              <X size={16} />
            </button>
          </Popover.Close>
          
          {/* Contenido del evento */}
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* Imagen */}
            <div className="w-full md:w-64 h-48 md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-black relative overflow-hidden bg-gray-100">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                  <TreePine size={48} className="opacity-30" />
                </div>
              )}
            </div>
            
            {/* Contenido */}
            <div className="flex-1 p-6 flex flex-col min-w-0 overflow-hidden">
              <div className="flex-shrink-0 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                    {event.category}
                  </span>
                  <span className="font-mono text-xs flex items-center gap-1 flex-shrink-0">
                    {event.time}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight break-words">
                  {event.title}
                </h3>
              </div>
              
              <div className="flex-1 min-h-0 mb-4 overflow-y-auto">
                <EventDescription description={event.description} />
              </div>
              
              <div className="flex-shrink-0 border-t border-dashed border-gray-300 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                  <MapPin size={14} className="text-[#ff7e67]" />
                  <span className="break-words">{event.location}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <a 
                    href={getGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <ExternalLink size={12} />
                    Google
                  </a>
                  <button 
                    onClick={() => downloadICS(event)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border-2 border-black bg-white text-black text-xs font-bold uppercase hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Download size={12} />
                    .ICS
                  </button>
                  <a
                    href={shareToWhatsApp(event, baseUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white text-xs font-bold uppercase hover:bg-[#20BA5A] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                  <button
                    onClick={() => handleShareToInstagram(event)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-xs font-bold uppercase hover:opacity-90 transition-opacity border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Image size={12} />
                    Instagram
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Popover.Arrow className="fill-black" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

const EventsPage = ({ onSelectImpact }: EventsPageProps) => {
  const { events: EVENTS_DATA = [], pastEvents: PAST_EVENTS_DATA = [] } = useContext(DataContext) as any;
  const accentColor = useAccentColor();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  
  // Obtener la fecha de hoy en zona horaria de CDMX en formato YYYY-MM-DD
  const getTodayInCdmx = useCallback(() => {
    const now = new Date();
    // Obtener la fecha en formato local de CDMX
    const cdmxDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); // 'en-CA' da formato YYYY-MM-DD
    return cdmxDateStr;
  }, []);
  
  const [todayStr, setTodayStr] = useState(() => {
    return getTodayInCdmx();
  });
  
  // Actualizar la fecha de hoy cada minuto para detectar cambios de día
  useEffect(() => {
    const updateToday = () => {
      const newTodayStr = getTodayInCdmx();
      setTodayStr(newTodayStr);
    };
    
    updateToday();
    const interval = setInterval(updateToday, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [getTodayInCdmx]);
  
  // Obtener el objeto Date de hoy para otros cálculos
  const getTodayDate = useCallback(() => {
    const now = new Date();
    const cdmxDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    const [year, month, day] = cdmxDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, []);
  
  const today = getTodayDate();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const lastScrollYRef = useRef(0);
  const [cdmxTime, setCdmxTime] = useState<string>('');
  
  // Función para obtener la hora de CDMX
  const getCdmxTime = useCallback(() => {
    const now = new Date();
    const cdmxDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    return cdmxDate.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  }, []);
  
  // Actualizar la hora de CDMX cada minuto
  useEffect(() => {
    setCdmxTime(getCdmxTime());
    const interval = setInterval(() => {
      setCdmxTime(getCdmxTime());
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [getCdmxTime]);
  
  const baseUrl = (import.meta as any).env?.BASE_URL || '/';
  
  const handleShareToInstagram = async (event: any) => {
    const success = await shareToInstagram(event, baseUrl);
    if (success) {
      setShareNotification('¡Copiado al portapapeles! Pega en Instagram');
      setTimeout(() => setShareNotification(null), 3000);
    } else {
      setShareNotification('Error al copiar. Intenta de nuevo.');
      setTimeout(() => setShareNotification(null), 3000);
    }
  };
  
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
      // Solo en móvil: detectar si el navbar está oculto
      if (window.innerWidth < 768) {
        const currentScrollY = window.scrollY;
        const navbarMobile = document.querySelector('[data-navbar-mobile]') as HTMLElement;
        
        if (navbarMobile) {
          // Verificar si el navbar tiene la clase translate-y-full (oculto)
          const isHidden = navbarMobile.classList.contains('-translate-y-full');
          setIsNavbarVisible(!isHidden);
          
          // Si el navbar está oculto, el sticky debe estar en top: 0
          if (isHidden) {
            setNavbarHeight(0);
          } else {
            updateNavbarHeight();
          }
        }
        lastScrollYRef.current = currentScrollY;
      } else {
        // En desktop, siempre usar la altura del navbar
        updateNavbarHeight();
      }
    };
    
    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Observar cambios en el navbar móvil usando MutationObserver
    const navbarMobile = document.querySelector('[data-navbar-mobile]');
    if (navbarMobile && window.innerWidth < 768) {
      const observer = new MutationObserver(() => {
        const isHidden = navbarMobile.classList.contains('-translate-y-full');
        setIsNavbarVisible(!isHidden);
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
  
  const getCurrentMonthYear = () => {
    const now = new Date();
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  };
  
  const getMonthName = (date: Date) => {
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    return months[date.getMonth()];
  };

  const getMonthAbbr = (dateString: string) => {
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const date = new Date(dateString);
    return months[date.getMonth()];
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthDays = useMemo(() => {
    const days: Array<{ label: string; date: string; num: string; fullDate: Date; isToday: boolean }> = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ label: '', date: '', num: '', fullDate: new Date(), isToday: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      // Usar el mismo formato que todayStr (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      const dayNum = dayStr;
      const dayOfWeek = date.getDay();
      const label = dayLabels[dayOfWeek];
      const isToday = dateStr === todayStr;
      
      days.push({ label, date: dateStr, num: dayNum, fullDate: date, isToday });
    }
    
    return days;
  }, [currentMonth, todayStr]);
  
  // Filtrar para mostrar los 7 días de la semana (lunes a domingo) desde el día seleccionado
  const visibleDays = useMemo(() => {
    if (!selectedDate) return monthDays;
    
    const selectedDateObj = new Date(selectedDate);
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const visibleDaysList: Array<{ label: string; date: string; num: string; fullDate: Date; isToday: boolean }> = [];
    
    // Encontrar el lunes de la semana del día seleccionado
    let startDate = new Date(selectedDateObj);
    const dayOfWeek = startDate.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    // Calcular cuántos días retroceder para llegar al lunes de esa semana
    // Si es domingo (0), retroceder 6 días; si es lunes (1), retroceder 0 días; etc.
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + daysToMonday);
    
    // Generar 7 días de la semana (lunes a domingo)
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      // Usar el mismo formato que todayStr (YYYY-MM-DD en zona horaria de CDMX)
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayNum = day;
      const currentDayOfWeek = currentDate.getDay();
      const label = dayLabels[currentDayOfWeek];
      const isToday = dateStr === todayStr;
      
      visibleDaysList.push({ label, date: dateStr, num: dayNum, fullDate: currentDate, isToday });
    }
    
    return visibleDaysList;
  }, [selectedDate, todayStr]);

  const goToNextMonth = useCallback(() => {
    if (viewMode === 'week') {
      // En vista semanal: avanzar 7 días (una semana completa)
      const currentSelectedDate = new Date(selectedDate);
      const nextWeek = new Date(currentSelectedDate);
      nextWeek.setDate(currentSelectedDate.getDate() + 7);
      
      const nextMonth = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), 1);
      setCurrentMonth(nextMonth);
      
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      setSelectedDate(nextWeekStr);
    } else {
      // En vista mensual: cambiar al mes siguiente completo
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      setCurrentMonth(nextMonth);
    }
  }, [selectedDate, viewMode, currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (viewMode === 'week') {
      // En vista semanal: retroceder 7 días (una semana completa)
      const currentSelectedDate = new Date(selectedDate);
      const previousWeek = new Date(currentSelectedDate);
      previousWeek.setDate(currentSelectedDate.getDate() - 7);
      
      const prevMonth = new Date(previousWeek.getFullYear(), previousWeek.getMonth(), 1);
      setCurrentMonth(prevMonth);
      
      const previousWeekStr = previousWeek.toISOString().split('T')[0];
      setSelectedDate(previousWeekStr);
    } else {
      // En vista mensual: cambiar al mes anterior completo
      const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      setCurrentMonth(prevMonth);
    }
  }, [selectedDate, viewMode, currentMonth]);


  const goToToday = useCallback(() => {
    const todayDate = new Date();
    const todayMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    setCurrentMonth(todayMonth);
    setSelectedDate(todayStr);
    
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const todayButton = selectedDayRefs.current[todayStr];
        if (todayButton) {
          const container = scrollContainerRef.current;
          const buttonLeft = todayButton.offsetLeft;
          const buttonWidth = todayButton.offsetWidth;
          const containerWidth = container.offsetWidth;
          const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    }, 150);
  }, [todayStr]);

  // Centrar el día de hoy cuando se carga inicialmente o cuando se cambia a vista semanal
  useEffect(() => {
    if (viewMode === 'week' && scrollContainerRef.current) {
      const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                            currentMonth.getFullYear() === today.getFullYear();
      
      setTimeout(() => {
        if (isCurrentMonth) {
          // Si es el mes actual, centrar el día de hoy
          const todayButton = selectedDayRefs.current[todayStr];
          if (todayButton) {
            const container = scrollContainerRef.current;
            if (container) {
              const buttonLeft = todayButton.offsetLeft;
              const buttonWidth = todayButton.offsetWidth;
              const containerWidth = container.offsetWidth;
              const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
              container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
          }
        } else {
          // Si no es el mes actual, centrar el primer día del mes
          const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
          const firstDayButton = selectedDayRefs.current[firstDayOfMonth];
          if (firstDayButton && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            if (container) {
              const buttonLeft = firstDayButton.offsetLeft;
              container.scrollTo({ left: buttonLeft, behavior: 'smooth' });
            }
          }
        }
      }, 300);
    }
  }, [viewMode, currentMonth, todayStr, today]);

  // Centrar el día seleccionado cuando el usuario hace clic en un día (solo si no está visible)
  useEffect(() => {
    if (viewMode === 'week' && selectedDate && scrollContainerRef.current) {
      const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                            currentMonth.getFullYear() === today.getFullYear();
      const isToday = selectedDate === todayStr;
      
      // Solo centrar si no es el día de hoy en el mes actual (para evitar conflicto con el efecto anterior)
      if (!(isCurrentMonth && isToday)) {
        setTimeout(() => {
          const selectedButton = selectedDayRefs.current[selectedDate];
          if (selectedButton && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const buttonLeft = selectedButton.offsetLeft;
            const buttonRight = buttonLeft + selectedButton.offsetWidth;
            const containerLeft = container.scrollLeft;
            const containerRight = containerLeft + container.offsetWidth;
            
            // Solo hacer scroll si el botón no está completamente visible
            if (buttonLeft < containerLeft || buttonRight > containerRight) {
              const buttonWidth = selectedButton.offsetWidth;
              const containerWidth = container.offsetWidth;
              const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
              container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
          }
        }, 100);
      }
    }
  }, [selectedDate, viewMode, currentMonth, todayStr, today]);

  const monthViewDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: Array<{ num: number; date: string }> = [];
    
    // Generar días del mes usando el mismo formato que todayStr (YYYY-MM-DD)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      days.push({ num: day, date: dateStr });
    }
    
    return days;
  }, [currentMonth]);
  
  const monthOffset = getFirstDayOfMonth(currentMonth);

  const filteredEvents = useMemo(() => {
    const filtered = EVENTS_DATA.filter((e: any) => e.date === selectedDate);
    return filtered;
  }, [EVENTS_DATA, selectedDate]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0] overflow-x-hidden" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
       {shareNotification && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black text-white px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono text-sm uppercase">
             {shareNotification}
          </div>
       )}
       <div 
         className="bg-[#ff7e67] border-b border-black p-8 md:p-12 shrink-0 relative transition-[padding-top] duration-300 ease-in-out" 
         style={{ paddingTop: isMobile ? `${navbarHeight + 32}px` : undefined }}
       >
          <div className="max-w-7xl mx-auto relative flex flex-col h-full">
             <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 inline-flex items-center gap-2">
                   <Calendar size={16} className="text-black flex-shrink-0" />
                   <span className="font-mono text-xs uppercase tracking-widest font-bold text-black whitespace-nowrap">{getCurrentMonthYear()}</span>
                </div>
             </div>

             <div className="mb-6">
                <h1 className="text-4xl md:text-6xl font-black uppercase leading-[0.9] tracking-tighter text-black">
                   AGENDA<br/>AMBIENTAL
                </h1>
             </div>

             <div className="mb-6">
                <p className="font-serif text-lg text-black max-w-2xl leading-relaxed">
                   Encuentra actividades, talleres y voluntariados cerca de ti.
                </p>
             </div>

             <div className="flex justify-end mt-auto">
                <div className="flex bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <button 
                     onClick={() => setViewMode('week')}
                     className={`px-4 py-2 font-mono text-sm uppercase font-bold border-r border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${viewMode === 'week' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#ff7e67] hover:text-white'}`}
                   >
                      SEMANAL
                   </button>
                   <button 
                     onClick={() => setViewMode('month')}
                     className={`px-4 py-2 font-mono text-sm uppercase font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${viewMode === 'month' ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#ff7e67] hover:text-white'}`}
                   >
                      MENSUAL
                   </button>
                </div>
             </div>
          </div>
       </div>

       {viewMode === 'week' && (
           <div 
             className="bg-black text-white border-b border-black sticky z-20 w-full transition-[top] duration-300 ease-in-out" 
             style={{ top: `${navbarHeight}px` }}
           >
              <div className="relative flex items-center justify-between border-b border-white/20 w-full px-4 py-2">
                 <div className="flex items-center gap-3">
                   <div className="bg-white/10 px-4 py-2 font-mono text-base uppercase tracking-widest font-bold">
                      {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                   </div>
                   {cdmxTime && (
                     <div className="bg-white/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/80 border-l border-white/20">
                       GTM-CDMX
                     </div>
                   )}
                 </div>
                 <div className="flex items-center gap-2">
                   <button onClick={goToPreviousMonth} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0">
                     <ChevronLeft className="w-[18px] h-[18px]" />
                   </button>
                   <button onClick={goToToday} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0 font-mono text-base uppercase">
                     HOY
                   </button>
                   <button onClick={goToNextMonth} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0">
                     <ChevronRight className="w-[18px] h-[18px]" />
                   </button>
                 </div>
              </div>
              
              <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide w-full scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                 <div className="flex w-full">
                    {visibleDays.map((day, index) => {
                      if (!day.date) {
                        return (
                          <div 
                            key={`empty-${index}`}
                            className="flex-1 py-4 px-2 flex flex-col items-center justify-center border-r border-white/20 min-w-0"
                          />
                        );
                      }
                      
                      const hasEvent = EVENTS_DATA.some((e: any) => e.date === day.date);
                      const isSelected = selectedDate === day.date;
                      
                      return (
                         <button 
                           key={day.date}
                           ref={(el) => { if (el) selectedDayRefs.current[day.date] = el; }}
                           onClick={() => setSelectedDate(day.date)}
                           className={`flex-1 py-4 px-2 flex flex-col items-center justify-center border-r border-white/20 transition-colors relative min-w-0
                             ${isSelected ? 'bg-white text-black' : day.isToday ? 'bg-white/10' : 'hover:bg-zinc-800'}
                           `}
                           style={day.isToday ? { 
                             borderBottom: '4px solid #b4ff6f'
                           } : {}}
                         >
                            <span className="text-[10px] font-mono tracking-widest mb-1 opacity-60">{day.label}</span>
                            <span className="text-2xl font-bold">{day.num}</span>
                            {hasEvent && (
                               <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#ff7e67]`} />
                            )}
                         </button>
                      );
                    })}
                 </div>
              </div>
           </div>
       )}

       {viewMode === 'month' && (
          <>
            <div 
              className="bg-black text-white border-b border-black sticky z-20 w-full transition-[top] duration-300 ease-in-out" 
              style={{ top: `${navbarHeight}px` }}
            >
              <div className="relative flex items-center justify-between border-b border-white/20 w-full px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 px-4 py-2 font-mono text-base uppercase tracking-widest font-bold">
                     {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                  </div>
                  {cdmxTime && (
                    <div className="bg-white/10 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white/80 border-l border-white/20">
                      GTM-CDMX
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={goToPreviousMonth} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0">
                    <ChevronLeft className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={goToToday} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0 font-mono text-base uppercase">
                    HOY
                  </button>
                  <button onClick={goToNextMonth} className="px-3 py-2 hover:bg-white/10 transition-colors flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-[#f3f4f0] pt-6 pb-6 md:p-6 border-b border-black mb-6 w-full" style={{ marginTop: '24px', marginBottom: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
             <div className="w-full px-4 md:px-6" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                <div className="flex flex-row gap-6 min-h-[672px]" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
                   {/* Calendario - 75% del ancho */}
                   <div className="flex-shrink-0" style={{ width: '75%', maxWidth: '75%', flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden' }}>
                      <div className="grid grid-cols-7 gap-px bg-black border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                         {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                            <div key={d} className="bg-black text-white text-center py-1 md:py-2 font-mono text-[10px] md:text-xs font-bold uppercase min-w-[45px] md:min-w-0">{d}</div>
                         ))}
                         
                         {Array.from({ length: monthOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-white h-20 md:h-32 opacity-50 relative min-w-[45px] md:min-w-0">
                                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                            </div>
                         ))}

                         {monthViewDays.map((day) => {
                            const dayEvents = EVENTS_DATA.filter((e: any) => e.date === day.date);
                            const isSelected = selectedDate === day.date;
                            const isToday = day.date === todayStr;
                            
                            return (
                               <button 
                                 key={day.date}
                                 onClick={() => { setSelectedDate(day.date); }}
                                 className={`bg-white h-20 md:h-32 p-1 md:p-2 flex flex-col items-start hover:bg-[#ff7e67]/20 transition-colors relative text-left group min-w-[45px] md:min-w-0
                                    ${isSelected ? 'ring-inset ring-4 ring-[#ff7e67]' : ''}
                                    ${isToday ? 'border-b-4 border-[#b4ff6f]' : ''}
                                 `}
                               >
                                  <span className={`font-mono font-bold text-xs md:text-sm ${isSelected ? 'text-[#ff7e67]' : isToday ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{day.num}</span>
                                  
                                  <div className="mt-auto w-full space-y-0.5 md:space-y-1">
                                     {dayEvents.map((ev: any) => (
                                       <CalendarEventPopover 
                                         key={ev.id}
                                         event={ev}
                                         baseUrl={baseUrl}
                                         handleShareToInstagram={handleShareToInstagram}
                                       />
                                     ))}
                                  </div>
                               </button>
                            );
                         })}
                      </div>
                   </div>

                   {/* Eventos del día seleccionado - 25% del ancho */}
                   <div className="flex flex-col flex-shrink-0" style={{ width: '25%', maxWidth: '25%', flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingRight: '16px' }}>
                      {filteredEvents.length > 0 ? (
                         <div className="space-y-4 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <div className="flex items-center gap-4 mb-6" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                               <div className="w-3 h-3 bg-black rounded-full animate-pulse flex-shrink-0" />
                               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight break-words" style={{ wordBreak: 'break-word', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                               </h2>
                            </div>

                            <div className="space-y-3 w-full" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
                               {filteredEvents.map((event: any) => {
                                  const isExpanded = expandedEventId === event.id;
                                  return (
                                     <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ 
                                           opacity: 1, 
                                           x: 0,
                                           boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)'
                                        }}
                                        whileHover={{ 
                                           boxShadow: '12px 12px 0px 0px #ff7e67',
                                           transition: { duration: 0.2 }
                                        }}
                                        className="w-full text-left border-2 border-black bg-white group cursor-pointer"
                                        style={{ 
                                           width: 'calc(100% - 8px)', 
                                           maxWidth: 'calc(100% - 8px)', 
                                           boxSizing: 'border-box', 
                                           overflow: 'hidden'
                                        }}
                                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                     >
                                        <div className="p-4">
                                           <div className="flex items-start justify-between gap-4 w-full min-w-0" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0 }}>
                                              <div className="flex-1 min-w-0 overflow-hidden" style={{ flex: '1 1 0%', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                                                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-mono text-xs font-bold text-[#ff7e67] flex-shrink-0">
                                                       {event.time}
                                                    </span>
                                                    <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100 flex-shrink-0">
                                                       {event.category}
                                                    </span>
                                                 </div>
                                                 <h3 className="text-base md:text-lg font-bold leading-tight group-hover:text-[#ff7e67] transition-colors break-words" style={{ wordBreak: 'break-word', overflow: 'hidden', textOverflow: isExpanded ? 'clip' : 'ellipsis', display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: isExpanded ? 'none' : 2, WebkitBoxOrient: isExpanded ? 'initial' : 'vertical' }}>
                                                    {event.title}
                                                 </h3>
                                                 {event.location && (
                                                    <div className="flex items-center gap-1.5 mt-2 text-xs font-mono uppercase text-gray-600 min-w-0" style={{ minWidth: 0, maxWidth: '100%' }}>
                                                       <MapPin size={12} className="text-[#ff7e67] flex-shrink-0" />
                                                       <span className={isExpanded ? "block break-words" : "truncate block min-w-0"} style={{ minWidth: 0, maxWidth: '100%', overflow: isExpanded ? 'visible' : 'hidden', textOverflow: isExpanded ? 'clip' : 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>{event.location}</span>
                                                    </div>
                                                 )}
                                              </div>
                                              <div className="flex-shrink-0" style={{ flexShrink: 0 }}>
                                                 <ArrowRight size={20} className={`text-gray-400 group-hover:text-[#ff7e67] transition-all ${isExpanded ? 'rotate-90' : ''}`} />
                                              </div>
                                           </div>
                                        </div>
                                        
                                        <AnimatePresence>
                                           {isExpanded && (
                                              <motion.div
                                                 initial={{ height: 0, opacity: 0 }}
                                                 animate={{ height: 'auto', opacity: 1 }}
                                                 exit={{ height: 0, opacity: 0 }}
                                                 transition={{ duration: 0.3 }}
                                                 style={{ overflow: 'hidden' }}
                                              >
                                                 <div className="px-4 pb-4 border-t border-dashed border-gray-300 pt-4 space-y-4">
                                                    {event.image && typeof event.image === 'string' && event.image.trim() !== '' && event.image !== 'undefined' && (
                                                       <div className="w-full h-48 border-2 border-black relative overflow-hidden bg-gray-100">
                                                          <img 
                                                             src={event.image} 
                                                             alt={event.title} 
                                                             className="w-full h-full object-cover"
                                                             onError={(e) => {
                                                                e.currentTarget.parentElement?.remove();
                                                             }}
                                                          />
                                                       </div>
                                                    )}
                                                    <div className="overflow-y-auto max-h-40">
                                                       <EventDescription description={event.description} />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-2 w-full" style={{ width: '100%' }}>
                                                       <a 
                                                          href={getGoogleCalendarUrl(event)}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                          onClick={(e) => e.stopPropagation()}
                                                          style={{ width: '100%' }}
                                                       >
                                                          <ExternalLink size={12} />
                                                          Añadir a calendario
                                                       </a>
                                                       <a
                                                          href={shareToWhatsApp(event, baseUrl)}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white text-xs font-bold uppercase hover:bg-[#20BA5A] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                                          onClick={(e) => e.stopPropagation()}
                                                          style={{ width: '100%' }}
                                                       >
                                                          <MessageCircle size={12} />
                                                          Compartir
                                                       </a>
                                                    </div>
                                                 </div>
                                              </motion.div>
                                           )}
                                        </AnimatePresence>
                                     </motion.div>
                                  );
                               })}
                            </div>
                         </div>
                      ) : (
                         <div className="flex-1 flex flex-col items-center justify-center py-12 md:py-24 text-gray-400 opacity-50 w-full min-h-full">
                            <Calendar size={48} strokeWidth={1} className="mb-4" />
                            <p className="font-mono text-sm md:text-lg uppercase">No hay eventos programados</p>
                            <p className="font-serif text-sm">Selecciona otro día en el calendario.</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
       </>
       )}

       {viewMode === 'week' && (
          <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
             {filteredEvents.length > 0 ? (
                <div className="space-y-8">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                      <h2 className="text-2xl font-bold uppercase tracking-tight">
                         {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h2>
                   </div>

                   {filteredEvents.map((event: any) => (
                      <motion.div 
                         key={event.id}
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="group border-2 border-black bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_#ff7e67] transition-all flex flex-col md:flex-row overflow-hidden max-h-[600px]"
                      >
                         <div className="bg-[#ff7e67] text-black w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-4 border-b-2 md:border-b-0 md:border-r-2 border-black shrink-0 gap-2 md:gap-0">
                            <span className="font-mono text-xs uppercase tracking-widest text-black/60">{getMonthAbbr(event.date)}</span>
                            <span className="text-4xl font-bold">{event.date.split('-')[2]}</span>
                         </div>

                         <div className="flex-1 p-6 flex flex-col min-w-0 overflow-hidden">
                            <div className="flex-shrink-0">
                               <div className="flex justify-between items-start mb-2">
                                  <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                                     {event.category}
                                  </span>
                                  <span className="font-mono text-xs flex items-center gap-1 flex-shrink-0">
                                     {event.time}
                                  </span>
                               </div>
                               <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-[#ff7e67] transition-colors break-words">
                                  {event.title}
                               </h3>
                            </div>
                            <div className="flex-1 min-h-0 mb-4 overflow-hidden">
                               <EventDescription description={event.description} />
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-dashed border-gray-300 pt-4">
                               <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                                  <MapPin size={14} className="text-[#ff7e67]" />
                                  {event.location}
                               </div>

                               <div className="flex flex-wrap gap-2 w-full" style={{ width: '100%' }}>
                                  <a 
                                     href={getGoogleCalendarUrl(event)}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                     style={{ width: '100%' }}
                                  >
                                     <ExternalLink size={12} />
                                     Añadir a calendario
                                  </a>
                                  <a
                                     href={shareToWhatsApp(event, baseUrl)}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white text-xs font-bold uppercase hover:bg-[#20BA5A] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                     style={{ width: '100%' }}
                                  >
                                     <MessageCircle size={12} />
                                     Compartir
                                  </a>
                               </div>
                            </div>
                         </div>

                         <EventImage event={event} />
                      </motion.div>
                   ))}
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center py-24 text-gray-400 opacity-50">
                   <Calendar size={64} strokeWidth={1} className="mb-4" />
                   <p className="font-mono text-lg uppercase">No hay eventos programados</p>
                   <p className="font-serif">Selecciona otro día en el calendario.</p>
                </div>
             )}
          </div>
       )}

       <div className="border-t-4 border-black bg-white">
          <div className="max-w-6xl mx-auto px-6 py-20">
              <div className="flex items-end justify-between mb-12 gap-4 border-b border-black pb-4">
                  <div>
                     <span className="font-mono text-xs font-bold uppercase tracking-widest bg-black text-white px-2 py-1">Archivo de Misiones</span>
                     <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mt-2">Bitácora<br/>de Impacto</h2>
                  </div>
                  <button className="hidden md:block px-6 py-2 border-2 border-black bg-white text-black font-bold uppercase hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Ver Historial Completo
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {PAST_EVENTS_DATA.map((event: any) => (
                      <div key={event.id} className="flex flex-col border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-zinc-50 h-full relative overflow-hidden group">
                          <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12">
                             <div className="border-4 border-black rounded-full p-4 w-32 h-32 flex items-center justify-center">
                                <span className="font-black text-xs uppercase text-center rotate-[-12deg]">Misión<br/>Completada</span>
                             </div>
                          </div>

                          <div className="flex justify-between items-center mb-4 relative z-10">
                              <span className="bg-[#b4ff6f] border border-black text-black text-[10px] font-mono px-2 py-1 uppercase font-bold">{event.category}</span>
                              <span className="font-mono text-xs text-gray-500 line-through decoration-black">{event.date}</span>
                          </div>
                          
                          <h3 className="text-xl font-bold mb-2 leading-tight flex-grow">{event.title}</h3>
                          
                          <div className="font-mono text-2xl font-black text-[#ff7e67] mb-4">
                             {event.stats}
                          </div>

                          <p className="font-serif text-sm text-gray-600 mb-6 line-clamp-3">
                              {event.summary}
                          </p>
                          
                          <div className="mt-auto pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
                             <span className="text-xs font-mono uppercase text-gray-400">Estado: Finalizado</span>
                             <button 
                                onClick={() => onSelectImpact && onSelectImpact(event.id)}
                                className="p-2 border border-black hover:bg-black hover:text-white transition-colors"
                             >
                                <ArrowRight size={14} />
                             </button>
                          </div>
                      </div>
                  ))}
              </div>
              <div className="mt-8 md:hidden">
                  <button className="w-full px-6 py-4 border-2 border-black bg-white text-black font-bold uppercase hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      Ver Historial
                  </button>
              </div>
          </div>
       </div>

       <div className="bg-[#ff7e67] border-t-4 border-black py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
              <div className="inline-block bg-black text-white px-4 py-1 font-mono text-xs uppercase tracking-widest mb-6 rotate-[-2deg]">
                  Boletín Semanal
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-[0.9] tracking-tighter text-black">
                  NO TE PIERDAS<br/>LA ACCIÓN
              </h2>
              <p className="font-serif text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                  Recibe cada lunes en tu correo la agenda curada de eventos, convocatorias de voluntariado y las noticias ambientales más relevantes.
              </p>

              <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
                  <input 
                      type="email" 
                      placeholder="tu@correo.com" 
                      className="flex-1 border-2 border-black p-4 text-lg placeholder:text-black/40 focus:outline-none focus:bg-white bg-white/50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  />
                  <button className="bg-black text-white px-8 py-4 text-lg font-bold uppercase tracking-widest hover:bg-[#ff7e67] border-2 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                      Suscribirme
                  </button>
              </form>
              <p className="mt-4 text-xs font-mono opacity-60">Sin spam. Solo contenido verde de calidad.</p>
          </div>
       </div>

       {/* Tooltip/Callout para evento seleccionado en vista mensual */}
       {selectedEvent && viewMode === 'month' && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 event-tooltip"
                onClick={() => setSelectedEvent(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                >
                  {/* Botón cerrar */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-black text-white hover:bg-[#ff7e67] transition-colors border-2 border-black"
                  >
                    <X size={16} />
                  </button>
                  
                  {/* Contenido del evento */}
                  <div className="flex flex-col md:flex-row overflow-hidden">
                    {/* Imagen */}
                    <div className="w-full md:w-64 h-48 md:h-auto border-b-2 md:border-b-0 md:border-r-2 border-black relative overflow-hidden bg-gray-100">
                      {selectedEvent.image ? (
                        <img 
                          src={selectedEvent.image} 
                          alt={selectedEvent.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                          <Calendar size={48} className="opacity-30" />
                        </div>
                      )}
                    </div>
                    
                    {/* Contenido */}
                    <div className="flex-1 p-6 flex flex-col min-w-0 overflow-hidden">
                      <div className="flex-shrink-0 mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                            {selectedEvent.category}
                          </span>
                          <span className="font-mono text-xs flex items-center gap-1 flex-shrink-0">
                            {selectedEvent.time}
                          </span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight break-words">
                          {selectedEvent.title}
                        </h3>
                      </div>
                      
                      <div className="flex-1 min-h-0 mb-4 overflow-y-auto">
                        <EventDescription description={selectedEvent.description} />
                      </div>
                      
                      <div className="flex-shrink-0 border-t border-dashed border-gray-300 pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                          <MapPin size={14} className="text-[#ff7e67]" />
                          <span className="break-words">{selectedEvent.location}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <a 
                            href={getGoogleCalendarUrl(selectedEvent)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <ExternalLink size={12} />
                            Google
                          </a>
                          <button 
                            onClick={() => downloadICS(selectedEvent)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border-2 border-black bg-white text-black text-xs font-bold uppercase hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <Download size={12} />
                            .ICS
                          </button>
                          <a
                            href={shareToWhatsApp(selectedEvent, baseUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] text-white text-xs font-bold uppercase hover:bg-[#20BA5A] transition-colors border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <MessageCircle size={12} />
                            WhatsApp
                          </a>
                          <button
                            onClick={() => handleShareToInstagram(selectedEvent)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white text-xs font-bold uppercase hover:opacity-90 transition-opacity border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <Image size={12} />
                            Instagram
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
    </div>
  );
};

export default EventsPage;
