import StatCircle from './StatCircle';

const StatsSection = () => {
  return (
    <section className="bg-[#f3f4f0] text-black py-12 px-6 border-b border-black overflow-hidden">
       <div className="max-w-7xl mx-auto mb-8 border border-black bg-white p-4 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-mono text-xs uppercase tracking-widest">Impacto: Cobertura Vegetal</p>
       </div>
       
       <div className="scale-75 origin-center -my-10 md:-my-20">
         <StatCircle 
           value="9m²" 
           label="Área verde recomendada por habitante (OMS)."
           description="Nuestras ciudades enfrentan un déficit crítico. El mapeo ciudadano es el primer paso para identificar zonas prioritarias de reforestación y asegurar la equidad en el acceso a espacios verdes."
         />
       </div>

       <div className="mt-12 max-w-7xl mx-auto flex justify-end">
          <div className="max-w-md border border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
             <div className="font-mono text-xs border-b border-black pb-2 mb-4">REGISTRO ACTUAL</div>
             <p className="font-sans text-lg font-bold">
               +15,000 ÁRBOLES CATALOGADOS Y MONITOREADOS POR VECINOS EN EL ÚLTIMO AÑO.
             </p>
          </div>
       </div>
    </section>
  );
};

export default StatsSection;
