import React, { useMemo, useState } from 'react';
import { ChevronLeft, AlertCircle, TreePine, MapPin } from 'lucide-react';
import { useContext } from 'react';
import { DataContext } from '../../../context/DataContext';
import { Map, Overlay } from 'pigeon-maps';

interface GreenAreaDetailPageProps {
  areaId: string | number;
  onBack: () => void;
}

const GreenAreaDetailPage = ({ areaId, onBack }: GreenAreaDetailPageProps) => {
  const { greenAreas: GREEN_AREAS_DATA = [] } = useContext(DataContext) as any;
  const area = GREEN_AREAS_DATA.find((a: any) => String(a.id) === String(areaId));
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  if (!area) return null;

  const hasValidCoords =
    typeof area.lat === 'number' &&
    typeof area.lng === 'number' &&
    !Number.isNaN(area.lat) &&
    !Number.isNaN(area.lng);
  const galleryImages: string[] = useMemo(() => {
    const images: string[] = [];
    if (area.image) images.push(area.image);
    if (Array.isArray(area.images)) {
      for (const img of area.images) {
        if (typeof img === 'string' && img && !images.includes(img)) {
          images.push(img);
        }
      }
    }
    return images;
  }, [area]);

  const activeImage =
    galleryImages[selectedImageIndex] ?? galleryImages[0] ?? area.image ?? '';

  const mapTiler = (x: number, y: number, z: number) =>
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center pb-24">
      <div className="w-full h-[45vh] relative border-b-4 border-black bg-gray-800">
        {activeImage ? (
          <img 
            src={activeImage} 
            alt={area.name}
            className="w-full h-full object-cover grayscale"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        {(!area.image || area.image === '') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <TreePine size={64} className="opacity-30 text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <div className="absolute top-6 left-6">
           <button onClick={onBack} className="bg-white border-2 border-black px-4 py-2 font-mono text-xs uppercase font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff7e67] hover:text-white transition-all flex items-center gap-2">
              <ChevronLeft size={14}/> Regresar al Mapa
           </button>
        </div>

        <div className="absolute bottom-8 left-6 right-6 text-white">
           <div className="flex gap-2 mb-4">
              {(area.tags || []).map((tag: string) => (
                 <span key={tag} className="bg-[#b4ff6f] text-black px-2 py-1 font-mono text-[10px] uppercase font-bold border border-black">
                    {tag}
                 </span>
              ))}
           </div>
           <h1 className="text-4xl md:text-6xl font-black leading-none tracking-tighter mb-2">{area.name}</h1>
           <p className="font-mono text-sm opacity-80 flex items-center gap-2">
              <MapPin size={16} /> {area.address}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-3 w-full max-w-4xl mx-auto -mt-6 relative z-10 px-4 gap-2 md:gap-4">
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Árboles</p>
            <p className="text-2xl font-black">1,240</p>
         </div>
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Superficie</p>
            <p className="text-2xl font-black">4.5 Ha</p>
         </div>
         <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-[10px] font-mono uppercase text-gray-500">Salud</p>
            <p className="text-2xl font-black text-green-600">85%</p>
         </div>
      </div>

      <div className="w-full max-w-4xl mx-auto px-6 mt-12 space-y-8">
         {area.need && (
           <div className="bg-[#fff0f0] border-l-8 border-red-500 p-6">
              <h3 className="font-bold uppercase text-red-600 flex items-center gap-2 mb-2">
                 <AlertCircle size={20}/> Necesidad Prioritaria
              </h3>
              <p className="text-xl font-medium">{area.need}</p>
              <p className="text-sm text-gray-600 mt-2">
                 Este espacio requiere intervención urgente. Se han reportado múltiples incidentes en el último mes.
              </p>
           </div>
         )}

         <div>
            <h3 className="font-bold text-2xl mb-4 border-b border-black pb-2">Acerca del Lugar</h3>
            <p className="font-serif text-lg leading-relaxed text-gray-700">
               Este espacio verde es fundamental para la regulación térmica de la zona. Cuenta con especies nativas de más de 50 años. Es un punto de encuentro vital para los vecinos de la colonia y sirve como corredor para aves migratorias.
            </p>
         </div>

         {/* Mapa con ubicación real (o centro por defecto si no hay coords) */}
         <div className="w-full h-72 border-2 border-black relative overflow-hidden bg-gray-200">
           <Map
               center={
                 hasValidCoords
                   ? [area.lat, area.lng]
                   : ([21.8853, -102.2916] as [number, number])
               }
               zoom={16}
               provider={mapTiler}
               metaWheelZoom={true}
               twoFingerDrag={true}
           >
             {hasValidCoords && (
               <Overlay anchor={[area.lat, area.lng]} offset={[15, 30]}>
                 <div className="transform -translate-x-1/2 -translate-y-full">
                   <TreePine
                     fill="#3CB371"
                     color="white"
                     size={40}
                     strokeWidth={1.5}
                     className="drop-shadow-md"
                   />
                 </div>
               </Overlay>
             )}
           </Map>
         </div>

         {/* Galería de imágenes si hay al menos una */}
         {galleryImages.length > 0 && (
           <div>
             <h3 className="font-bold text-2xl mb-4 border-b border-black pb-2">Galería</h3>
             <div className="flex gap-3 overflow-x-auto pb-2">
               {galleryImages.map((img, idx) => (
                 <button
                   key={img + idx}
                   type="button"
                   onClick={() => setSelectedImageIndex(idx)}
                   className={`relative w-28 h-20 border-2 ${
                     idx === selectedImageIndex ? 'border-black' : 'border-gray-300'
                   } overflow-hidden flex-shrink-0`}
                 >
                   <img
                     src={img}
                     alt={`${area.name} ${idx + 1}`}
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       (e.target as HTMLImageElement).style.display = 'none';
                     }}
                   />
                 </button>
               ))}
             </div>
           </div>
         )}
      </div>

      <div className="fixed bottom-6 left-0 w-full px-4 z-50 flex flex-col items-center gap-3 pointer-events-none">
         <button className="pointer-events-auto w-[90vw] max-w-md bg-white text-black font-bold uppercase tracking-widest py-4 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff7e67] hover:text-white transition-all flex items-center justify-center gap-2 border-2 border-black">
            <AlertCircle size={20} className="text-red-500"/> Reportar Incidente
         </button>
         <button className="pointer-events-auto w-[90vw] max-w-md bg-[#b4ff6f] text-black font-bold uppercase tracking-widest py-4 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff7e67] hover:text-white transition-all flex items-center justify-center gap-2 border-2 border-black">
            <TreePine size={20}/> Voluntariado Aquí
         </button>
      </div>
    </div>
  );
};

export default GreenAreaDetailPage;
