import React, { useState, useEffect, useRef, useMemo, useContext, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Download, ExternalLink, ArrowDown, ArrowRight, TreePine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataContext } from '../../../context/DataContext';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';
import { getGoogleCalendarUrl, downloadICS } from '../../../utils/helpers/calendarHelpers';
import { useAccentColor } from '../../../utils/helpers/routingHelpers';

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

const EventsPage = ({ onSelectImpact }: EventsPageProps) => {
  const { events: EVENTS_DATA = [], pastEvents: PAST_EVENTS_DATA = [] } = useContext(DataContext) as any;
  const accentColor = useAccentColor();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedDayRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
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

  const generateMonthDays = (): Array<{ label: string; date: string; num: string; fullDate: Date; isToday: boolean }> => {
    const days: Array<{ label: string; date: string; num: string; fullDate: Date; isToday: boolean }> = [];
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ label: '', date: '', num: '', fullDate: new Date(), isToday: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const dayNum = day.toString().padStart(2, '0');
      const dayOfWeek = date.getDay();
      const label = dayLabels[dayOfWeek];
      const isToday = dateStr === todayStr;
      
      days.push({ label, date: dateStr, num: dayNum, fullDate: date, isToday });
    }
    
    return days;
  };
  
  const monthDays = generateMonthDays();
  
  // Filtrar para mostrar solo los siguientes 7 días desde el día seleccionado, incluyendo días del siguiente mes si es necesario
  const visibleDays = useMemo(() => {
    if (!selectedDate) return monthDays;
    
    const selectedDateObj = new Date(selectedDate);
    const sevenDaysLater = new Date(selectedDateObj);
    sevenDaysLater.setDate(selectedDateObj.getDate() + 7);
    
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    const visibleDaysList: Array<{ label: string; date: string; num: string; fullDate: Date; isToday: boolean }> = [];
    
    // Obtener días del mes actual que están en el rango
    const currentMonthVisibleDays = monthDays.filter((day) => {
      if (!day.date) return false; // Excluir espacios vacíos
      const dayDate = new Date(day.date);
      return dayDate >= selectedDateObj && dayDate <= sevenDaysLater;
    });
    
    visibleDaysList.push(...currentMonthVisibleDays);
    
    // Si necesitamos días del siguiente mes para completar los 7 días, generarlos
    const daysNeeded = 7 - visibleDaysList.length;
    if (daysNeeded > 0) {
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      const daysInNextMonth = getDaysInMonth(nextMonth);
      
      for (let day = 1; day <= Math.min(daysNeeded, daysInNextMonth); day++) {
        const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const dayNum = day.toString().padStart(2, '0');
        const dayOfWeek = date.getDay();
        const label = dayLabels[dayOfWeek];
        const isToday = dateStr === todayStr;
        
        visibleDaysList.push({ label, date: dateStr, num: dayNum, fullDate: date, isToday });
      }
    }
    
    return visibleDaysList;
  }, [monthDays, selectedDate, currentMonth, todayStr]);

  const goToNextMonth = useCallback(() => {
    if (viewMode === 'week') {
      // En vista semanal: avanzar 7 días
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
      // En vista semanal: retroceder 7 días
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
    
    // Generar días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ num: day, date: dateStr });
    }
    
    return days;
  }, [currentMonth]);
  
  const monthOffset = getFirstDayOfMonth(currentMonth);

  const filteredEvents = useMemo(() => 
    EVENTS_DATA.filter((e: any) => e.date === selectedDate),
    [EVENTS_DATA, selectedDate]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f0]">
       <div 
         className="bg-[#ff7e67] border-b border-black p-8 md:p-12 shrink-0 relative transition-[padding-top] duration-300 ease-in-out" 
         style={{ paddingTop: isMobile ? `${navbarHeight + 32}px` : undefined }}
       >
          <div className="max-w-7xl mx-auto relative flex flex-col h-full">
             <div className="mb-6 inline-block">
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
                 <div className="bg-white/10 px-4 py-2 font-mono text-base uppercase tracking-widest font-bold">
                    {getMonthName(currentMonth)} {currentMonth.getFullYear()}
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
                         >
                            <span className="text-[10px] font-mono tracking-widest mb-1 opacity-60">{day.label}</span>
                            <span className="text-2xl font-bold">{day.num}</span>
                            {hasEvent && (
                               <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#ff7e67]`} />
                            )}
                            {day.isToday && (
                               <div 
                                 className="absolute bottom-0 left-0 right-0 z-50 h-[3px]" 
                                 style={{ 
                                   backgroundColor: accentColor, 
                                   boxShadow: `0 -2px 0 0 ${accentColor}`
                                 }} 
                               />
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
                <div className="bg-white/10 px-4 py-2 font-mono text-base uppercase tracking-widest font-bold">
                   {getMonthName(currentMonth)} {currentMonth.getFullYear()}
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
            <div className="bg-[#f3f4f0] pt-6 pb-6 md:p-6 border-b border-black mb-6 w-full" style={{ marginTop: '24px' }}>
             <div className="max-w-7xl w-full px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch min-h-[672px] w-full">
                   {/* Calendario */}
                   <div className="flex-shrink-0 w-full lg:w-auto">
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
                                 `}
                               >
                                  <span className={`font-mono font-bold text-xs md:text-sm ${isSelected ? 'text-[#ff7e67]' : isToday ? 'text-black' : 'text-gray-400 group-hover:text-black'}`}>{day.num}</span>
                                  {isToday && (
                                     <div className="absolute bottom-0 left-0 right-0 h-1 z-10" style={{ backgroundColor: accentColor }} />
                                  )}
                                  
                                  <div className="mt-auto w-full space-y-0.5 md:space-y-1">
                                     {dayEvents.map((ev: any) => (
                                        <div key={ev.id} className="w-full truncate text-[8px] md:text-[10px] bg-black text-white px-0.5 md:px-1 py-0.5 rounded-none font-medium">
                                           {ev.title}
                                        </div>
                                     ))}
                                  </div>
                               </button>
                            );
                         })}
                      </div>
                   </div>

                   {/* Eventos del día seleccionado */}
                   <div className="flex-1 min-w-0 flex flex-col min-h-full w-full">
                      {filteredEvents.length > 0 ? (
                         <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-6">
                               <div className="w-3 h-3 bg-black rounded-full animate-pulse" />
                               <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight">
                                  {new Date(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                               </h2>
                            </div>

                            <div className="space-y-6">
                               {filteredEvents.map((event: any) => (
                                  <motion.div 
                                     key={event.id}
                                     initial={{ opacity: 0, y: 20 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     className="group border-2 border-black bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_#ff7e67] transition-all flex flex-col md:flex-row overflow-hidden"
                                  >
                                     <div className="bg-[#ff7e67] text-black w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-4 border-b-2 md:border-b-0 md:border-r-2 border-black shrink-0 gap-2 md:gap-0">
                                        <span className="font-mono text-xs uppercase tracking-widest text-black/60">{getMonthAbbr(event.date)}</span>
                                        <span className="text-4xl font-bold">{event.date.split('-')[2]}</span>
                                     </div>

                                     <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                           <div className="flex justify-between items-start mb-2">
                                              <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                                                 {event.category}
                                              </span>
                                              <span className="font-mono text-xs flex items-center gap-1">
                                                 {event.time}
                                              </span>
                                           </div>
                                           <h3 className="text-xl md:text-2xl font-bold mb-3 leading-tight group-hover:text-[#ff7e67] transition-colors">
                                              {event.title}
                                           </h3>
                                           <p className="font-serif text-gray-600 mb-6 text-sm leading-relaxed">
                                              {event.description}
                                           </p>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-dashed border-gray-300 pt-4">
                                           <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                                              <MapPin size={14} className="text-[#ff7e67]" />
                                              {event.location}
                                           </div>

                                           <div className="flex gap-2 w-full md:w-auto">
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
                                           </div>
                                        </div>
                                     </div>

                                     <EventImage event={event} />
                                  </motion.div>
                               ))}
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
                         className="group border-2 border-black bg-white p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_#ff7e67] transition-all flex flex-col md:flex-row overflow-hidden"
                      >
                         <div className="bg-[#ff7e67] text-black w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-4 border-b-2 md:border-b-0 md:border-r-2 border-black shrink-0 gap-2 md:gap-0">
                            <span className="font-mono text-xs uppercase tracking-widest text-black/60">{getMonthAbbr(event.date)}</span>
                            <span className="text-4xl font-bold">{event.date.split('-')[2]}</span>
                         </div>

                         <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                               <div className="flex justify-between items-start mb-2">
                                  <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
                                     {event.category}
                                  </span>
                                  <span className="font-mono text-xs flex items-center gap-1">
                                     {event.time}
                                  </span>
                               </div>
                               <h3 className="text-2xl font-bold mb-3 leading-tight group-hover:text-[#ff7e67] transition-colors">
                                  {event.title}
                               </h3>
                               <p className="font-serif text-gray-600 mb-6 text-sm leading-relaxed">
                                  {event.description}
                               </p>
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-dashed border-gray-300 pt-4">
                               <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-gray-700">
                                  <MapPin size={14} className="text-[#ff7e67]" />
                                  {event.location}
                               </div>

                               <div className="flex gap-2 w-full md:w-auto">
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
    </div>
  );
};

export default EventsPage;
