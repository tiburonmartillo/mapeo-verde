import { Eye } from 'lucide-react';

const TextContentSection = () => {
  return (
    <section className="bg-white text-black py-12 px-4 sm:px-6 md:py-20 border-b border-black">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <div className="md:col-span-4">
           <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">El Problema</h3>
           <p className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
              Nuestras ciudades se están calentando.
           </p>
           <p className="font-serif text-gray-600 leading-relaxed">
              La falta de arbolado y la expansión de superficies de concreto generan islas de calor que afectan desproporcionadamente a las zonas marginadas.
           </p>
        </div>
        
        <div className="md:col-span-4">
           <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-black pb-2 inline-block">La Solución</h3>
           <p className="text-2xl sm:text-3xl font-bold leading-tight mb-4">
              Inteligencia Colectiva.
           </p>
           <p className="font-serif text-gray-600 leading-relaxed">
              No podemos esperar a que otros lo resuelvan. Mapeo Verde te invita a sumarte a la agenda de actividades, participar con reportes y propuestas, y explorar el inventario de áreas verdes para censar, vigilar y exigir el mantenimiento de los espacios vitales.
           </p>
        </div>

        <div className="md:col-span-4 bg-[#f3f4f0] border border-black p-6 flex flex-col justify-center items-center text-center">
           <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mb-4">
              <Eye size={24} />
           </div>
           <p className="font-bold uppercase text-sm mb-2">Transparencia Total</p>
           <p className="text-xs font-mono text-gray-500">
              Cada parque registrado, cada reporte y cada dato es de acceso público. Sin cajas negras.
           </p>
        </div>
      </div>
    </section>
  );
};

export default TextContentSection;
