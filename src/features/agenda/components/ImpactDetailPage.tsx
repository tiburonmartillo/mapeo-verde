import React, { useState } from 'react';
import { ChevronLeft, AlertCircle, ArrowRight, TreePine } from 'lucide-react';
import { getRandomUnsplashImage } from '../../../utils/helpers/imageHelpers';

interface ImpactDetailPageProps {
  eventId: string | number;
  onBack: () => void;
}

const ImpactDetailPage = ({ eventId, onBack }: ImpactDetailPageProps) => {
  const PAST_EVENTS_DATA = [
    { id: 1, category: 'Limpieza', date: '2025-02-15', title: 'Jornada de Limpieza - Arroyo Seco', stats: '240kg residuos', summary: 'Limpieza integral del arroyo con participación comunitaria.' },
    { id: 2, category: 'Reforestación', date: '2025-02-08', title: 'Plantación Primavera 2025', stats: '500 árboles', summary: 'Plantación masiva de árboles nativos en zona de riesgo.' },
    { id: 3, category: 'Educación', date: '2025-02-01', title: 'Taller Biodiversidad Urbana', stats: '120 personas', summary: 'Capacitación sobre importancia de la biodiversidad.' },
  ];

  const event = PAST_EVENTS_DATA.find(e => e.id === eventId);
  
  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center pb-20">
      <div className="w-full h-[40vh] bg-black relative overflow-hidden border-b-4 border-black">
        <div className="absolute inset-0 opacity-60">
           <img 
             src={getRandomUnsplashImage('impact-detail', 2000, 800)} 
             className="w-full h-full object-cover"
             onError={(e) => {
               (e.target as HTMLImageElement).style.display = 'none';
               const fallback = (e.target as HTMLImageElement).nextElementSibling;
               if (fallback) (fallback as HTMLElement).style.display = 'flex';
             }}
           />
           <div className="absolute inset-0 bg-gray-800 flex items-center justify-center" style={{ display: 'none' }}>
             <TreePine size={64} className="opacity-30 text-white" />
           </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-t from-black to-transparent">
           <button onClick={onBack} className="mb-6 flex items-center gap-2 bg-white text-black px-4 py-2 font-mono uppercase text-xs font-bold border-2 border-black hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ChevronLeft size={16}/> Volver a la Bitácora
           </button>
           <span className="bg-[#b4ff6f] text-black px-3 py-1 font-mono text-xs font-bold uppercase border border-black shadow-[4px_4px_0px_0px_white]">
              {event.category}
           </span>
           <h1 className="text-4xl md:text-6xl font-black text-white mt-4 leading-none tracking-tighter">
              {event.title}
           </h1>
        </div>
      </div>

      <div className="max-w-3xl w-full px-6 -mt-10 relative z-10">
         <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-6 mb-6">
               <div>
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Fecha de Ejecución</p>
                  <p className="font-bold text-xl">{event.date}</p>
               </div>
               <div className="text-right">
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Impacto Directo</p>
                  <p className="font-black text-2xl text-[#ff7e67]">{event.stats}</p>
               </div>
            </div>
            
            <div className="prose prose-lg font-serif space-y-4">
               <p className="text-xl leading-relaxed text-gray-800">
                  {event.summary}
               </p>
               <p>
                  La jornada comenzó a las 8:00 AM con la participación de vecinos, estudiantes y organizaciones locales. Se realizó primero una capacitación breve sobre el manejo de residuos y seguridad.
               </p>
               <p>
                  Además de la recolección, se clasificaron los materiales para asegurar su reciclaje efectivo. Este esfuerzo conjunto no solo mejora la estética del lugar, sino que previene la contaminación del agua y reduce riesgos de inundaciones.
               </p>
            </div>

            <div className="mt-12 bg-gray-100 p-6 border border-black">
               <h3 className="font-bold uppercase text-sm mb-4">Galería de Evidencia</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gray-300 border border-black relative">
                     <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">FOTO 1</div>
                  </div>
                  <div className="aspect-square bg-gray-300 border border-black relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-mono text-xs">FOTO 2</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="fixed bottom-6 left-0 w-full px-6 z-50 flex justify-center pointer-events-none">
         <button className="pointer-events-auto w-[90vw] max-w-md bg-black text-white font-bold uppercase tracking-widest py-4 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff7e67] transition-all flex items-center justify-center gap-2 border-2 border-black">
            Participar en la Siguiente Misión <ArrowRight size={20}/>
         </button>
      </div>
    </div>
  );
};

export default ImpactDetailPage;
