import { motion } from 'motion/react';
import { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { LogoMap } from '../../../components/common/LogoMap';
import { SafeImage } from '../../../components/common/SafeImage';
import FacebookLogo from '../../../assets/Facebook_Logo_Primary.png';
import WhatsAppLogo from '../../../assets/whatsapp.svg';
import TikTokLogo from '../../../assets/tiktok-svgrepo-com.svg';

const LinktreePage = () => {
  const [calendarError, setCalendarError] = useState(false);
  
  const calendarId = 'bce9da9cb33f280d49d3962f712747a07d9728d2954bac9d0c24db0c08f16470@group.calendar.google.com';
  const calendarEmbedUrl = `https://calendar.google.com/calendar/u/0/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FMexico_City&mode=MONTH&showPrint=0&showTabs=0&showCalendars=0&showTz=0`;
  const calendarViewUrl = `https://calendar.google.com/calendar/u/0/embed?src=${encodeURIComponent(calendarId)}&ctz=America%2FMexico_City`;
  
  const profiles = [
    {
      id: 1,
      name: 'Instagram',
      url: 'https://www.instagram.com/mapeoverde/',
      logo: null,
      logoType: 'icon' as const,
    },
    {
      id: 2,
      name: 'Facebook',
      url: 'https://www.facebook.com/mapeoverde/',
      logo: FacebookLogo,
      logoType: 'image' as const,
    },
    {
      id: 3,
      name: 'WhatsApp',
      url: 'https://wa.me/5214491234567',
      logo: WhatsAppLogo,
      logoType: 'image' as const,
    },
    {
      id: 4,
      name: 'TikTok',
      url: 'https://www.tiktok.com/@mapeoverde',
      logo: TikTokLogo,
      logoType: 'image' as const,
    },
    {
      id: 5,
      name: 'Agenda',
      url: '/agenda',
      logo: null,
      logoType: 'text' as const,
      logoText: 'Agenda',
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 pt-24 pb-6 overflow-hidden">
      {/* Background - Dot Pattern (mismo que header de inicio) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md flex flex-col items-center pb-10"
        style={{ paddingTop: 40 }}
      >
        {/* Logo Mapeo Verde */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 w-full"
        >
          <div className="w-full aspect-[835/383]">
            <LogoMap className="w-full h-full" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold text-center mb-2 text-black"
        >
          Conecta con nosotros
        </motion.h1>

        {/* Profile Cards Grid - 2 columnas x 3 filas - Estilo Brutalista */}
        <div className="grid grid-cols-2 gap-4 mb-12 w-full">
          {profiles.map((profile, index) => {
            // Las últimas dos cards (Agenda y Áreas Verde) son rectángulos horizontales
            const isRectangular = profile.id === 5 || profile.id === 6;
            
            return (
              <motion.a
                key={profile.id}
                href={profile.url}
                target={profile.url.startsWith('http') ? '_blank' : undefined}
                rel={profile.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95, translateY: 1 }}
                className={`${isRectangular ? 'h-20' : 'aspect-square'} w-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center hover:bg-[#ff7e67] hover:text-white transition-all active:translate-y-1 active:shadow-none`}
                aria-label={profile.name}
              >
                {profile.logoType === 'image' && profile.logo ? (
                  <SafeImage
                    src={profile.logo}
                    alt={profile.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain p-2"
                    iconSize={32}
                  />
                ) : profile.logoType === 'icon' ? (
                  <svg viewBox="0 0 24 24" fill="url(#instagramGradient)" className="w-10 h-10 md:w-12 md:h-12">
                    <defs>
                      <linearGradient id="instagramGradient" x1="0" y1="0" x2="24" y2="24">
                        <stop offset="0%" stopColor="#F58529"/>
                        <stop offset="50%" stopColor="#DD2A7B"/>
                        <stop offset="100%" stopColor="#8134AF"/>
                      </linearGradient>
                    </defs>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                ) : profile.logoType === 'text' && profile.logoText ? (
                  <span className="text-lg md:text-xl font-bold text-black uppercase tracking-wider">
                    {profile.logoText}
                  </span>
                ) : null}
              </motion.a>
            );
          })}
        </div>

        {/* Calendar Embed - Estilo Brutalista */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="w-full border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {calendarError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-black" />
              <p className="text-black mb-4 font-bold">No se pudo cargar el calendario</p>
              <a
                href={calendarViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff7e67] text-white font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black transition-all active:translate-y-1 active:shadow-none"
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
                const iframe = e.target as HTMLIFrameElement;
                try {
                  if (iframe.contentWindow) {
                    setCalendarError(false);
                  }
                } catch (err) {
                  // Error de CORS es normal con iframes de Google Calendar
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
