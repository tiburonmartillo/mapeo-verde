import { useNavigate } from 'react-router-dom';

const CtaSection = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-[#b4ff6f] text-black py-32 px-6 border-b border-black text-center">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 inline-block">
          <p className="font-mono text-xs uppercase tracking-widest border border-black bg-white px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Acción</p>
        </div>
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 leading-[0.9]">
          ÚNETE A LA<br/>REVOLUCIÓN
        </h2>
      </div>
      <div className="w-screen -mx-6">
        <button
          className="w-full px-8 py-5 bg-black text-white text-4xl md:text-6xl font-bold hover:bg-[#ff7e67] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none rounded-full"
          onClick={() => navigate('/participacion')}
          aria-label="Ir a la página de participación ciudadana"
        >
          COMENZAR AHORA
        </button>
      </div>
    </section>
  );
};

export default CtaSection;
