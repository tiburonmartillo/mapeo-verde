import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Newspaper } from 'lucide-react';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(card.path)}
                className="group bg-white border-2 border-black p-8 text-left cursor-pointer hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className={`w-12 h-12 ${card.color} flex items-center justify-center mb-5 border-2 border-black`}>
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InvestigacionPage;
