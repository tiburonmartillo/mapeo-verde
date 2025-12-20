import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { FeaturePreview } from './FeaturePreview';

interface Feature {
  title: string;
  desc: string;
}

interface FeatureListProps {
  onFeatureEnter?: (title: string) => void;
  onFeatureLeave?: () => void;
  onNavigate?: (path: string, id?: string | number) => void;
}

const FeatureList = ({ onFeatureEnter, onFeatureLeave, onNavigate }: FeatureListProps) => {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const expandedRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Scroll al bloque expandido cuando cambia expandedFeature
  useEffect(() => {
    if (isMobile && expandedFeature) {
      const expandedElement = expandedRefs.current[expandedFeature];
      if (expandedElement) {
        setTimeout(() => {
          expandedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }, 100); // Pequeño delay para asegurar que la animación haya comenzado
      }
    }
  }, [expandedFeature, isMobile]);
  
  const features: Feature[] = [
    { title: "Agenda", desc: "Actividades de voluntariado y educación." },
    { title: "Áreas Verdes", desc: "Inventario colaborativo de flora urbana." },
    { title: "Boletines", desc: "Monitor de proyectos locales y alertas ciudadanas." },
    { title: "Gacetas", desc: "Rastreo de impacto ambiental federal." }
  ];

  const handleFeatureClick = (title: string) => {
    // En móvil, toggle el estado expandido
    if (isMobile) {
      const newExpanded = expandedFeature === title ? null : title;
      setExpandedFeature(newExpanded);
    }
  };

  const handleMouseEnter = (title: string) => {
    // En desktop, usar hover normal
    if (!isMobile && onFeatureEnter) {
      onFeatureEnter(title);
    }
  };

  const handleMouseLeave = () => {
    // En desktop, limpiar hover
    if (!isMobile && onFeatureLeave) {
      onFeatureLeave();
    }
  };

  return (
    <section className="bg-[#0a0a0a] text-white py-24 px-6 border-b border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border border-white bg-black px-3 py-1 inline-block shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
           <p className="font-mono text-xs uppercase tracking-widest text-white">Herramientas</p>
        </div>
        <h3 className="text-3xl md:text-5xl font-light mb-16">TECNOLOGÍA PARA <br/> <span className="font-bold">EL CUIDADO AMBIENTAL</span></h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-white/20">
          {features.map((f, i) => (
            <div key={i} className="border-r border-b border-white/20">
              <div 
                className="group p-8 hover:bg-white/5 transition-colors cursor-pointer min-h-[250px] flex flex-col justify-between"
                onMouseEnter={() => handleMouseEnter(f.title)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleFeatureClick(f.title)}
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs text-white/50">0{i+1}</span>
                  <ArrowRight className={`w-5 h-5 transition-all ${
                    expandedFeature === f.title 
                      ? 'text-[#b4ff6f] translate-x-0' 
                      : 'text-white/0 -translate-x-4 group-hover:text-[#b4ff6f] group-hover:translate-x-0'
                  }`} />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{f.title}</h4>
                  <p className="text-sm text-zinc-400">{f.desc}</p>
                </div>
              </div>
              
              {/* En móvil, mostrar el contenido expandido debajo de cada herramienta */}
              {isMobile && expandedFeature === f.title && (
                <div 
                  ref={(el) => { expandedRefs.current[f.title] = el; }}
                  className="md:hidden border-t border-white/20"
                >
                  <FeaturePreview
                    hoveredFeature={f.title}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    onNavigate={onNavigate || (() => {})}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureList;
