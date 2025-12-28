import { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, Calendar, MapPin, Building2, AlertCircle } from 'lucide-react';

interface GacetaModalProps {
  gaceta: any | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SemarnatDocument {
  resumen?: string;
  estudio?: string;
  resolutivo?: string;
}

export const GacetaModal = ({ gaceta, isOpen, onClose }: GacetaModalProps) => {
  const [semarnatData, setSemarnatData] = useState<SemarnatDocument | null>(null);
  const [loadingSemarnat, setLoadingSemarnat] = useState(false);
  const [errorSemarnat, setErrorSemarnat] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Cargar datos de SEMARNAT si hay clave de proyecto
      if (gaceta?.clave_proyecto) {
        loadSemarnatData(gaceta.clave_proyecto);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, gaceta?.clave_proyecto]);

  const loadSemarnatData = async (clave: string) => {
    setLoadingSemarnat(true);
    setErrorSemarnat(null);
    
    try {
      // Intentar cargar desde API (si existe) o desde datos locales
      // Por ahora, solo mostramos estructura para futura integración
      setLoadingSemarnat(false);
    } catch (error) {
      setErrorSemarnat('Error al cargar datos de SEMARNAT');
      setLoadingSemarnat(false);
    }
  };

  const handleDownloadPdf = async (tipo: 'resumen' | 'estudio' | 'resolutivo', url: string) => {
    setLoadingPdf(prev => ({ ...prev, [tipo]: true }));
    try {
      // Aquí se integraría la llamada a la API de SEMARNAT para obtener el PDF
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
    } finally {
      setLoadingPdf(prev => ({ ...prev, [tipo]: false }));
    }
  };

  if (!gaceta || !isOpen) return null;

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
          <div className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b-4 border-black bg-black text-white flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter truncate">
                  GACETA {gaceta.id || gaceta.gaceta_id || ''}
                </h2>
                <p className="text-xs md:text-sm font-mono text-gray-300 mt-1">
                  {gaceta.date || gaceta.fecha_publicacion}
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
                    {gaceta.project || gaceta.proyecto_nombre || 'Proyecto Federal'}
                  </h3>
                </div>

                {/* Información Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gaceta.promoter && (
                    <div className="border-2 border-black p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={18} className="text-gray-600" />
                        <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">PROMOVENTE</span>
                      </div>
                      <p className="font-serif text-lg border-l-4 border-black pl-4">
                        {gaceta.promoter}
                      </p>
                    </div>
                  )}

                  {gaceta.type && (
                    <div className="border-2 border-black p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={18} className="text-gray-600" />
                        <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">TRÁMITE</span>
                      </div>
                      <p className="font-mono text-lg font-bold">
                        {gaceta.type}
                      </p>
                    </div>
                  )}
                </div>

                {/* Descripción */}
                {gaceta.description && (
                  <div className="border-2 border-black p-4 md:p-6 bg-white">
                    <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600 block mb-3">
                      DESCRIPCIÓN
                    </span>
                    <p className="font-serif text-lg text-gray-800 leading-relaxed">
                      {gaceta.description}
                    </p>
                  </div>
                )}

                {/* Documentos SEMARNAT */}
                {(semarnatData || loadingSemarnat) && (
                  <div className="border-2 border-black p-4 md:p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono uppercase tracking-widest font-bold text-gray-600">
                        DOCUMENTOS SEMARNAT
                      </span>
                      {gaceta.clave_proyecto && (
                        <a
                          href={`https://app.semarnat.gob.mx/consulta-tramite/#/portal-consulta?clave=${encodeURIComponent(gaceta.clave_proyecto)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 border-2 border-black bg-white hover:bg-gray-100 transition-colors font-mono text-xs uppercase font-bold flex items-center gap-2"
                        >
                          <ExternalLink size={14} />
                          CONSULTAR EN SEMARNAT
                        </a>
                      )}
                    </div>

                    {loadingSemarnat && (
                      <div className="flex items-center gap-2 py-4">
                        <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin" />
                        <span className="font-mono text-sm">Cargando documentos...</span>
                      </div>
                    )}

                    {errorSemarnat && (
                      <div className="border-2 border-red-500 bg-red-50 p-4 flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-600" />
                        <span className="font-mono text-sm text-red-600">{errorSemarnat}</span>
                      </div>
                    )}

                    {semarnatData && !loadingSemarnat && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {semarnatData.resumen && (
                          <button
                            onClick={() => handleDownloadPdf('resumen', semarnatData.resumen!)}
                            disabled={loadingPdf['resumen']}
                            className="border-2 border-black p-4 bg-white hover:bg-gray-50 transition-colors font-mono text-sm uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                          >
                            {loadingPdf['resumen'] ? 'CARGANDO...' : 'RESUMEN PDF'}
                          </button>
                        )}
                        {semarnatData.estudio && (
                          <button
                            onClick={() => handleDownloadPdf('estudio', semarnatData.estudio!)}
                            disabled={loadingPdf['estudio']}
                            className="border-2 border-black p-4 bg-white hover:bg-gray-50 transition-colors font-mono text-sm uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                          >
                            {loadingPdf['estudio'] ? 'CARGANDO...' : 'ESTUDIO PDF'}
                          </button>
                        )}
                        {semarnatData.resolutivo && (
                          <button
                            onClick={() => handleDownloadPdf('resolutivo', semarnatData.resolutivo!)}
                            disabled={loadingPdf['resolutivo']}
                            className="border-2 border-black p-4 bg-white hover:bg-gray-50 transition-colors font-mono text-sm uppercase font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                          >
                            {loadingPdf['resolutivo'] ? 'CARGANDO...' : 'RESOLUTIVO PDF'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Botón de consulta */}
                {gaceta.url && (
                  <div className="pt-4 border-t-2 border-dashed border-gray-300">
                    <button
                      onClick={() => window.open(gaceta.url, '_blank', 'noopener,noreferrer')}
                      className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white transition-colors font-bold uppercase py-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none text-lg"
                    >
                      <ExternalLink size={20} />
                      CONSULTAR GACETA ORIGINAL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

