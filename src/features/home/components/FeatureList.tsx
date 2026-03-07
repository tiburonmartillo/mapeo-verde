import { ArrowRight } from 'lucide-react';
import { FeaturePreview } from './FeaturePreview';

interface Feature {
  title: string;
  desc: string;
  path: string;
  accentClass: string;
}

interface FeatureListProps {
  onFeatureEnter?: (title: string) => void;
  onFeatureLeave?: () => void;
  onNavigate?: (path: string, id?: string | number) => void;
}

const FeatureList = ({ onFeatureEnter, onFeatureLeave, onNavigate }: FeatureListProps) => {
  const features: Feature[] = [
    {
      title: "Agenda",
      desc: "Eventos, actividades y voluntariado para el cuidado ambiental.",
      path: "AGENDA",
      accentClass: "bg-[#ff7e67]",
    },
    {
      title: "Áreas Verdes",
      desc: "Inventario colaborativo de parques y espacios verdes.",
      path: "GREEN_AREAS",
      accentClass: "bg-[#b4ff6f]",
    },
    {
      title: "Participación",
      desc: "Contribuye con reportes, propuestas e ideas para tu comunidad.",
      path: "PARTICIPATION",
      accentClass: "bg-[#d89dff]",
    },
  ];

  return (
    <section className="bg-[#0a0a0a] text-white py-24 px-6 border-b border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border border-white bg-black px-3 py-1 inline-block shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
           <p className="font-mono text-xs uppercase tracking-widest text-white">Herramientas</p>
        </div>
        <h3 className="text-3xl md:text-5xl font-light mb-16">TECNOLOGÍA PARA <br/> <span className="font-bold">EL CUIDADO AMBIENTAL</span></h3>
        
        <div className="space-y-6">
          {features.map((f, i) => (
            <div key={i} className="border-2 border-white/20 bg-black overflow-hidden">
              <button
                type="button"
                className="w-full text-left hover:bg-white/5 transition-colors cursor-pointer border-b border-white/20"
                onClick={() => onNavigate?.(f.path)}
              >
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] items-start md:items-center gap-6 p-8 md:p-10">
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex h-12 w-12 items-center justify-center border-2 border-black ${f.accentClass} text-black font-mono text-sm font-bold shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)]`}>
                      0{i + 1}
                    </span>
                  </div>
                  <div className="max-w-3xl">
                    <h4 className="text-2xl md:text-3xl font-bold mb-2 uppercase tracking-tight">{f.title}</h4>
                    <p className="text-base md:text-lg text-zinc-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="flex items-center justify-start md:justify-end">
                    <span className="inline-flex items-center gap-3 font-mono text-xs md:text-sm uppercase tracking-widest text-white/80">
                      Explorar
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>
                </div>
              </button>
              <FeaturePreview
                hoveredFeature={f.title}
                onMouseEnter={() => {}}
                onMouseLeave={() => {}}
                onNavigate={onNavigate || (() => {})}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureList;
