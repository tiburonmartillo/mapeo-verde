import { motion } from 'motion/react';
import { useState } from 'react';
import { LogoMap } from '../../../components/common/LogoMap';
import { ExternalLink, Calendar, Instagram, Facebook, Music, AlertCircle } from 'lucide-react';

const LinktreePage = () => {
  const [calendarError, setCalendarError] = useState(false);
  
  const calendarId = 'bce9da9cb33f280d49d3962f712747a07d9728d2954bac9d0c24db0c08f16470@group.calendar.google.com';
  const calendarEmbedUrl = `https://calendar.google.com/calendar/u/0/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FMexico_City&mode=MONTH&showPrint=0&showTabs=0&showCalendars=0&showTz=0`;
  const calendarViewUrl = `https://calendar.google.com/calendar/u/0/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FMexico_City`;
  
  const links = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/mapeoverde/',
      icon: Instagram,
      bgColor: 'linear-gradient(to right, #a855f7, #ec4899)',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/mapeoverde/',
      icon: Facebook,
      bgColor: '#2563eb',
      className: 'bg-blue-600',
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@mapeoverde',
      icon: Music,
      bgColor: '#000000',
      className: 'bg-black',
    },
    {
      name: 'Sitio Web',
      url: 'https://mapeoverde.org',
      icon: ExternalLink,
      bgColor: '#7FB800',
      className: 'bg-[#7FB800]',
    },
    {
      name: 'Agenda Mapeo Verde',
      url: calendarViewUrl,
      icon: Calendar,
      bgColor: '#FF7F50',
      className: 'bg-[#FF7F50]',
      isCalendar: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32">
            <LogoMap className="w-full h-full" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2 text-black">Mapeo Verde</h1>
        <p className="text-center text-gray-600 mb-8">Conecta con nosotros</p>

        {/* Links */}
        <div className="space-y-4 mb-8">
          {links.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: link.bgColor,
                }}
                className={`
                  flex items-center justify-between
                  w-full p-4 rounded-lg
                  ${link.className} ${link.isCalendar ? 'text-[#fafafa]' : 'text-white'}
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                  transition-all duration-200
                  cursor-pointer
                  group
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${link.isCalendar ? 'text-[#fafafa]' : ''}`} style={link.isCalendar ? { color: '#fafafa' } : {}} />
                  <span className={`font-medium ${link.isCalendar ? 'text-[#fafafa]' : ''}`} style={link.isCalendar ? { color: '#fafafa' } : {}}>{link.name}</span>
                </div>
                <ExternalLink className={`w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity ${link.isCalendar ? 'text-[#fafafa]' : ''}`} style={link.isCalendar ? { color: '#fafafa' } : {}} />
              </motion.a>
            );
          })}
        </div>

        {/* Calendar Embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full rounded-lg overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black bg-white"
        >
          {calendarError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">No se pudo cargar el calendario</p>
              <a
                href={calendarViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7F50] text-[#fafafa] rounded-lg hover:opacity-90 transition-opacity"
              >
                <Calendar className="w-4 h-4" />
                Abrir calendario en Google Calendar
              </a>
            </div>
          ) : (
            <iframe
              src={calendarEmbedUrl}
              style={{ border: 0 }}
              width="100%"
              height="400"
              frameBorder="0"
              scrolling="no"
              title="Agenda Mapeo Verde"
              className="bg-white"
              allowFullScreen
              onError={() => setCalendarError(true)}
              onLoad={(e) => {
                // Verificar si el iframe cargó correctamente
                const iframe = e.target as HTMLIFrameElement;
                try {
                  // Si el iframe tiene contenido, está bien
                  if (iframe.contentWindow) {
                    setCalendarError(false);
                  }
                } catch (err) {
                  // Error de CORS es normal con iframes de Google Calendar
                  // No es un error real, el calendario debería cargar
                  console.log('Iframe cargado (CORS es normal)');
                }
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LinktreePage;

