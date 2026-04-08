import { useNavigate } from 'react-router-dom';

const CtaSection = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-[#b4ff6f] text-black py-16 px-4 sm:px-6 md:py-32 border-b border-black text-center overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 md:mb-8 inline-block">
          <p className="font-mono text-xs uppercase tracking-widest border border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Acción</p>
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-8xl font-bold tracking-tighter mb-8 md:mb-12 leading-[0.95] px-1">
          EXPLORA LA AGENDA,<br />
          PARTICIPA Y CONOCE LAS ÁREAS VERDES
        </h2>
      </div>
      <div className="w-full max-w-full">
        <button
          className="w-full px-4 sm:px-8 py-4 sm:py-5 bg-black text-white text-2xl sm:text-4xl md:text-6xl font-bold hover:bg-[#ff7e67] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none rounded-full leading-tight"
          onClick={() => navigate('/agenda')}
          aria-label="Ver la agenda de eventos y actividades"
        >
          EXPLORAR AGENDA
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
