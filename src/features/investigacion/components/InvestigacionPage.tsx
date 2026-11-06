import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Newspaper, BookOpen, TrendingUp, AlertTriangle, MapPin, Clock } from 'lucide-react';

const cards = [
  {
    id: 'boletines',
    title: 'Boletines',
    subtitle: 'Boletines Ambientales SSMAA',
    description: 'Explora los proyectos y resolutivos de impacto ambiental registrados ante la Secretaría de Sustentabilidad, Medio Ambiente y Agua del Estado de Aguascalientes.',
    path: '/boletines',
    icon: FileText,
    color: 'bg-[#ff9d9d]',
  },
  {
    id: 'gacetas',
    title: 'Gacetas',
    subtitle: 'Gacetas Ecológicas SEMARNAT',
    description: 'Consulta los proyectos federales de impacto ambiental publicados en las gacetas ecológicas de la Secretaría de Medio Ambiente y Recursos Naturales.',
    path: '/gacetas',
    icon: Newspaper,
    color: 'bg-[#9dcdff]',
  },
  {
    id: 'informe-analisis',
    title: 'Informe de Análisis',
    subtitle: 'Análisis Interactivo 2017-2026',
    description: 'Patrones de calidad de captura, tiempos de resolución por administración, re-ingresos detectados y anomalías geoespaciales. Visualizaciones interactivas con Recharts.',
    path: '/informe-analisis',
    icon: BookOpen,
    color: 'bg-[#b4ff6f]',
    highlight: true,
  },
];

const InvestigacionPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Investigación
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Herramientas de consulta y monitoreo ambiental para Aguascalientes.
          </p>
        </div>
        
        {/* Tarjeta destacada: Informe de Análisis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          {cards.filter(c => c.highlight).map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.path)}
                className="group w-full bg-white border-2 border-black p-6 md:p-8 text-left cursor-pointer hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] hover:border-[#b4ff6f] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 relative overflow-hidden"
                style={{ borderLeft: '6px solid #b4ff6f' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#b4ff6f] to-[#ff7e67] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                <div className="relative flex flex-col md:flex-row md:items-start gap-6">
                  <div className={`flex-shrink-0 w-14 h-14 ${card.color} flex items-center justify-center border-2 border-black`}>
                    <Icon className="w-7 h-7 text-black group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-black text-white text-xs font-mono uppercase tracking-wider">Nuevo</span>
                      <span className="px-2 py-0.5 bg-[#b4ff6f] text-black text-xs font-mono uppercase tracking-wider">Interactivo</span>
                    </div>
                    <h2 className="text-2xl font-bold text-black mb-2 group-hover:text-[#b4ff6f] transition-colors">
                      {card.title}
                    </h2>
                    <p className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
                      {card.subtitle}
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 max-w-2xl">
                      {card.description}
                    </p>
                    <div className="flex items-center gap-2 text-black font-mono text-xs uppercase tracking-wider group-hover:gap-4 transition-all">
                      <span>Explorar análisis</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Tarjetas normales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {cards.filter(c => !c.highlight).map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                type="button"
                onClick={() => navigate(card.path)}
                className="group bg-white border-2 border-black p-8 text-left cursor-pointer hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className={`w-12 h-12 ${card.color} flex items-center justify-center mb-5 border-2 border-black group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-xl font-bold text-black mb-1">
                  {card.title}
                </h2>
                <p className="text-sm font-mono uppercase tracking-wider text-gray-500 mb-3">
                  {card.subtitle}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {card.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvestigacionPage;
