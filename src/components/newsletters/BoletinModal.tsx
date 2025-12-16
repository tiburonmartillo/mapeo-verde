import { useEffect } from 'react';
import { X, Download, FileText, Calendar, MapPin, Building2 } from 'lucide-react';

interface BoletinModalProps {
  boletin: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BoletinModal = ({ boletin, isOpen, onClose }: BoletinModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!boletin || !isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b-4 border-black bg-black text-white flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter truncate">
                  {boletin.expediente ? `EXPEDIENTE ${boletin.expediente}` : `PROYECTO ${boletin.id}`}
                </h2>
                <p className="text-xs md:text-sm font-mono text-gray-300 mt-1">
                  {boletin.date}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 transition-colors flex-shrink-0 p-2 border-2 border-white hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-6">
                {/* Título */}
                <div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase leading-tight mb-4">
                    {boletin.project}
                  </h3>
                </div>

                {/* Información Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 size={18} className="text-gray-600" />
                      <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">PROMOVENTE</span>
                    </div>
                    <p className="font-serif text-lg border-l-4 border-black pl-4">
                      {boletin.promoter}
                    </p>
                  </div>

                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={18} className="text-gray-600" />
                      <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">TIPO</span>
                    </div>
                    <p className="font-mono text-lg font-bold">
                      {boletin.type}
                    </p>
                  </div>
                </div>

                {/* Descripción */}
                {boletin.description && (
                  <div className="border-2 border-black p-4 md:p-6 bg-white">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-3">
                      DESCRIPCIÓN
                    </span>
                    <p className="font-serif text-lg text-gray-800 leading-relaxed">
                      {boletin.description}
                    </p>
                  </div>
                )}

                {/* Impacto y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-black p-4 text-center bg-gray-50">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-2">
                      IMPACTO
                    </span>
                    <div className="border-2 border-black p-3 text-sm font-bold bg-white">
                      {boletin.impact}
                    </div>
                  </div>
                  <div className="border-2 border-black p-4 text-center bg-gray-50">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-2">
                      ESTADO
                    </span>
                    <div className={`border-2 border-black p-3 text-sm font-bold ${
                      boletin.status?.includes('Aprobado') ? 'bg-[#b4ff6f]' : 
                      boletin.status?.includes('Denegado') ? 'bg-red-400' : 
                      'bg-[#fccb4e]'
                    }`}>
                      {boletin.status}
                    </div>
                  </div>
                </div>

                {/* Expediente */}
                {boletin.expediente && (
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-2">
                      EXPEDIENTE
                    </span>
                    <p className="font-mono text-lg font-bold">
                      {boletin.expediente}
                    </p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="pt-4 border-t-2 border-dashed border-gray-300 space-y-3">
                  {/* Botón para ver boletín original */}
                  {(boletin.filename || boletin.url) && (
                    <button
                      onClick={() => window.open(boletin.filename || boletin.url, '_blank', 'noopener,noreferrer')}
                      className="w-full flex items-center justify-center gap-2 bg-[#fccb4e] hover:bg-[#ff9d9d] hover:text-white transition-colors font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none text-lg"
                    >
                      <FileText size={20} />
                      VER BOLETÍN ORIGINAL PDF
                    </button>
                  )}
                  
                  {/* Botón para consultar expediente (si hay URL alternativa) */}
                  {boletin.url && boletin.url !== boletin.filename && (
                    <button
                      onClick={() => window.open(boletin.url, '_blank', 'noopener,noreferrer')}
                      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white transition-colors font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none text-lg"
                    >
                      <Download size={20} />
                      CONSULTAR EXPEDIENTE PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

