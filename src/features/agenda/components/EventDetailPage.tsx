import { useContext, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, MapPin, ExternalLink, MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataContext } from '../../../context/DataContext';
import { SafeImage } from '../../../components/common/SafeImage';
import { findEventByIdentifier } from '../../../utils/helpers/slugHelpers';
import { getGoogleCalendarUrl, downloadICS } from '../../../utils/helpers/calendarHelpers';
import { shareToWhatsApp, shareToInstagram } from '../../../utils/helpers/shareHelpers';
import { useSEO } from '../../../hooks/useSEO';
import { useNavigate } from 'react-router-dom';

interface EventDetailPageProps {
  eventId: string | number;
  onBack?: () => void;
}

const EventDetailPage = ({ eventId, onBack }: EventDetailPageProps) => {
  const { events = [], pastEvents = [], loading } = useContext(DataContext) as any;
  const navigate = useNavigate();
  const allEvents = useMemo(() => [...(events || []), ...(pastEvents || [])], [events, pastEvents]);

  const event = useMemo(
    () => findEventByIdentifier(allEvents, eventId),
    [allEvents, eventId],
  );

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://www.mapeoverde.org';

  const eventUrl = event ? `${baseUrl}/e/${event.id}` : '';

  useSEO(
    event
      ? {
          title: event.title,
          description: event.description || event.title,
          image: event.image || undefined,
          type: 'article',
        }
      : undefined,
  );

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/agenda');
    }
  };

  const currentIndex = allEvents.findIndex((e: any) => String(e.id) === String(eventId));
  const prevEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex >= 0 && currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center p-6">
        <div className="bg-white border-2 border-black p-8 max-w-2xl text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Cargando evento...</h2>
            <p className="text-gray-600">Obteniendo información</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center p-6">
        <div className="bg-white border-2 border-black p-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
          <p className="mb-6">No se pudo cargar la información del evento.</p>
          <button
            onClick={handleBack}
            className="bg-black text-white px-6 py-3 font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black cursor-pointer"
          >
            Volver a la Agenda
          </button>
        </div>
      </div>
    );
  }

  const dateFormatted = (() => {
    const [y, m, d] = event.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  })();

  return (
    <div className="min-h-screen bg-[#f3f4f0]">
      <div className="sticky top-0 z-30 bg-white border-b-2 border-black px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-mono font-bold uppercase hover:text-[#ff7e67] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          {event.category && (
            <span className="inline-block px-2 py-0.5 border border-black text-[10px] uppercase font-bold bg-gray-100">
              {event.category}
            </span>
          )}
          {event.category === 'Propuesta ciudadana' && (
            <span className="inline-block px-2 py-0.5 border border-amber-600 text-[10px] uppercase font-bold bg-amber-50 text-amber-800">
              Propuesta ciudadana
            </span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border-2 border-black p-6 md:p-8">
          <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter mb-8">
            {event.title}
          </h1>

          {event.image && typeof event.image === 'string' && event.image.trim() !== '' && event.image !== 'undefined' && (
            <div className="w-full border-2 border-black relative overflow-hidden bg-gray-100 mb-8">
              <SafeImage
                src={event.image}
                alt={event.title}
                className="w-full h-auto max-h-[70vh] object-contain"
                loading="lazy"
                iconSize={48}
              />
            </div>
          )}

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#ff7e67] mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{dateFormatted}</p>
                <p className="text-sm text-gray-600">{event.time}</p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#ff7e67] mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{event.location}</p>
                  {event.placeName && (
                    <p className="text-sm text-gray-600">{event.placeName}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {event.organizers && (
            <p className="text-sm text-gray-600 mb-6">
              <strong>Organiza:</strong> {event.organizers}
            </p>
          )}

          {event.description && (
            <div className="prose prose-sm max-w-none mb-8 font-serif text-gray-800 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          )}

          {event.eventUrl && (
            <a
              href={event.eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-mono text-[#ff7e67] underline hover:text-black mb-8"
            >
              <ExternalLink size={14} />
              Más información
            </a>
          )}



          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-black">
            <a
              href={getGoogleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white text-xs font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black cursor-pointer"
            >
              <Calendar size={16} />
              Añadir a calendario
            </a>
            <button
              type="button"
              onClick={() => downloadICS(event)}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Calendar size={16} />
              Descargar .ics
            </button>
            <a
              href={shareToWhatsApp(event, baseUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white text-xs font-bold uppercase hover:bg-[#20BA5A] transition-colors border-2 border-black cursor-pointer"
            >
              <MessageCircle size={16} />
              Compartir en WhatsApp
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-black text-xs font-bold uppercase hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Share2 size={16} />
              Copiar enlace
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-dashed border-gray-300 pt-4 mt-6">
            {prevEvent ? (
              <button
                onClick={() => navigate(`/e/${prevEvent.id}`)}
                className="flex items-center gap-1 text-xs font-mono font-bold uppercase hover:text-[#ff7e67] transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                {prevEvent.title.length > 30 ? prevEvent.title.slice(0, 30) + '...' : prevEvent.title}
              </button>
            ) : (
              <div />
            )}
            {nextEvent ? (
              <button
                onClick={() => navigate(`/e/${nextEvent.id}`)}
                className="flex items-center gap-1 text-xs font-mono font-bold uppercase hover:text-[#ff7e67] transition-colors text-right cursor-pointer"
              >
                {nextEvent.title.length > 30 ? nextEvent.title.slice(0, 30) + '...' : nextEvent.title}
                <ChevronRight size={14} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
