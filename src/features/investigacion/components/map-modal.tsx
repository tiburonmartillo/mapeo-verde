
import { useState } from 'react'
import { Button } from './ui/button'
import { MapViewer } from './map-viewer'
import { coordinateValidator } from '../lib/coordinate-validator'

// Función para convertir coordenadas a Lat/Long usando validación inteligente
function convertToLatLong(x: number | null, y: number | null): { lat: number; lng: number } | null {
  if (!x || !y) return null

  // Validar y corregir coordenadas
  const validationResult = coordinateValidator.processCoordinates(x, y);
  
  if (!validationResult.success) {
    console.warn('Coordenadas inválidas:', validationResult.error);
    return null;
  }

  // Usar coordenadas corregidas
  const correctedX = validationResult.corrected.x;
  const correctedY = validationResult.corrected.y;

  // Si las coordenadas fueron corregidas, loggear la corrección
  if (validationResult.wasCorrected) {
    console.log(`Coordenadas corregidas automáticamente: ${x}, ${y} → ${correctedX}, ${correctedY}`);
  }

  // Si las coordenadas ya están en formato Lat/Lng, devolverlas directamente
  if (validationResult.type === 'latlng') {
    console.log(`Coordenadas ya están en formato Lat/Lng: ${correctedX}, ${correctedY}`);
    return { lat: correctedY, lng: correctedX };
  }

  // Si son coordenadas UTM, aplicar conversión
  if (validationResult.type === 'utm' || validationResult.type === 'utm14') {
    const zone = validationResult.type === 'utm14' ? 14 : 13;
    console.log(`Aplicando conversión UTM zona ${zone} a Lat/Lng para: ${correctedX}, ${correctedY}`);

  // Implementación precisa de conversión UTM a coordenadas geográficas
  // Basada en las ecuaciones estándar de la proyección UTM
  
  // Parámetros del elipsoide WGS84
  const sm_a = 6378137; // Semieje mayor
  const sm_b = 6356752.314; // Semieje menor
  const UTMScaleFactor = 0.9996; // Factor de escala UTM
  // Zona UTM determinada dinámicamente
  
  // Función auxiliar para calcular la latitud del pie
  const calculateFootpointLatitude = (y: number): number => {
    const n = (sm_a - sm_b) / (sm_a + sm_b);
    const alpha_ = ((sm_a + sm_b) / 2) * (1 + (n ** 2) / 4) + (n ** 4) / 64;
    const y_ = y / alpha_;
    
    const beta_ = (3 * n / 2) + (-27 * (n ** 3) / 32) + (269 * (n ** 5) / 512);
    const gamma_ = (21 * (n ** 2) / 16) + (-55 * (n ** 4) / 32);
    const delta_ = (151 * (n ** 3) / 96) + (-417 * (n ** 5) / 128);
    const epsilon_ = (1097 * (n ** 4) / 512);
    
    return y_ + (beta_ * Math.sin(2 * y_)) + (gamma_ * Math.sin(4 * y_)) + 
           (delta_ * Math.sin(6 * y_)) + (epsilon_ * Math.sin(8 * y_));
  };
  
  // Ajustar coordenadas UTM (usar coordenadas corregidas)
  let x = correctedX - 500000; // Remover false easting
  x = x / UTMScaleFactor;
  const y = correctedY / UTMScaleFactor;
  
  // Calcular meridiano central de la zona
  const lambda0 = ((-183 + (zone * 6)) / 180) * Math.PI;
  
  // Calcular latitud del pie
  const phif = calculateFootpointLatitude(y);
  
  // Precalcular valores auxiliares
  const ep2 = (sm_a ** 2 - sm_b ** 2) / (sm_b ** 2);
  const cf = Math.cos(phif);
  const nuf2 = ep2 * (cf ** 2);
  const Nf = (sm_a ** 2) / (sm_b * Math.sqrt(1 + nuf2));
  
  const tf = Math.tan(phif);
  const tf2 = tf * tf;
  const tf4 = tf2 * tf2;
  
  // Calcular coeficientes fraccionarios
  let Nfpow = Nf;
  const x1frac = 1 / (Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x2frac = tf / (2 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x3frac = 1 / (6 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x4frac = tf / (24 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x5frac = 1 / (120 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x6frac = tf / (720 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x7frac = 1 / (5040 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x8frac = tf / (40320 * Nfpow);
  
  // Calcular coeficientes polinomiales
  const x2poly = -1 - nuf2;
  const x3poly = -1 - 2 * tf2 - nuf2;
  const x4poly = 5 + 3 * tf2 + 6 * nuf2 - 6 * tf2 * nuf2 - 3 * (nuf2 * nuf2) - 9 * tf2 * (nuf2 * nuf2);
  const x5poly = 5 + 28 * tf2 + 24 * tf4 + 6 * nuf2 + 8 * tf2 * nuf2;
  const x6poly = -61 - 90 * tf2 - 45 * tf4 - 107 * nuf2 + 162 * tf2 * nuf2;
  const x7poly = -61 - 662 * tf2 - 1320 * tf4 - 720 * (tf4 * tf2);
  const x8poly = 1385 + 3633 * tf2 + 4095 * tf4 + 1575 * (tf4 * tf2);
  
  // Calcular latitud y longitud
  const lat = phif + x2frac * x2poly * (x * x) + x4frac * x4poly * x ** 4 + 
              x6frac * x6poly * x ** 6 + x8frac * x8poly * x ** 8;
  const lng = lambda0 + x1frac * x + x3frac * x3poly * x ** 3 + 
              x5frac * x5poly * x ** 5 + x7frac * x7poly * x ** 7;
  
  // Convertir de radianes a grados
  const latDegrees = (lat / Math.PI) * 180;
  const lngDegrees = (lng / Math.PI) * 180;
  
    console.log(`Conversión UTM precisa: ${correctedX}, ${correctedY} → Lat/Lng: ${latDegrees.toFixed(6)}, ${lngDegrees.toFixed(6)}`);
    if (validationResult.wasCorrected) {
      console.log(`⚠️  Coordenadas fueron corregidas automáticamente`);
    }
    
    return { lat: latDegrees, lng: lngDegrees }
  }

  // Si llegamos aquí, no se pudo determinar el tipo de coordenadas
  console.warn('No se pudo determinar el tipo de coordenadas:', validationResult.type);
  return null;
}

interface MapModalProps {
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  nombre_proyecto: string
  municipio: string
  promovente?: string
  fecha_ingreso?: string
  naturaleza_proyecto?: string
  boletin_url?: string
  isOpen?: boolean
  onClose?: () => void
}

export function MapModal({ coordenadas_x, coordenadas_y, expediente, nombre_proyecto, municipio, promovente, fecha_ingreso, naturaleza_proyecto, boletin_url, isOpen: externalIsOpen, onClose }: MapModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Usar control externo si está disponible, sino usar control interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = onClose || setInternalIsOpen

  if (!coordenadas_x || !coordenadas_y) {
    return (
      <span className="text-gray-400 text-sm">Sin coordenadas</span>
    )
  }

  // Convertir coordenadas a Lat/Lng (UTM o Lat/Lng según el tipo detectado)
  const coords = convertToLatLong(coordenadas_x, coordenadas_y)
  const lat = coords?.lat || 21.8818 // Coordenadas por defecto de Aguascalientes
  const lng = coords?.lng || -102.2916

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
        title="Ver ubicación en mapa"
      >
        📍Ver ubicación
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black opacity-75"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white z-10">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Ubicación del Proyecto</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{expediente} - {municipio}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Map Content - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-3 sm:p-4 md:p-6 pb-20 sm:pb-24">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base">{nombre_proyecto}</h3>
                  <div className="text-xs sm:text-sm text-gray-600 mt-2 space-y-1">
                    <div><strong>Expediente:</strong> {expediente}</div>
                    <div><strong>Promovente:</strong> {promovente || 'No disponible'}</div>
                    <div><strong>Fecha de Ingreso:</strong> {fecha_ingreso ? new Date(fecha_ingreso).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'No disponible'}</div>
                    <div><strong>Naturaleza del Proyecto:</strong> {naturaleza_proyecto || 'No disponible'}</div>
                    <div><strong>Municipio:</strong> {municipio}</div>
                    <div><strong>Coordenadas UTM:</strong> {coordenadas_x}, {coordenadas_y}</div>
                    {coords && (
                      <div><strong>Coordenadas Lat/Lng:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}</div>
                    )}
                    {coords && (
                      <div className="text-xs text-gray-500 mt-1">
                       Coordenadas procesadas con validación automática y conversión precisa.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="h-64 sm:h-80 md:h-96">
                  {coords ? (
                    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.005},${lng+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lng}`}
                        width="100%"
                        height="100%"
                        className="border-0"
                        title="Mapa de ubicación del proyecto"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-600 mb-4">📍 Mapa de ubicación</div>
                        <div className="text-sm text-gray-500 mb-4">
                          UTM: {coordenadas_x}, {coordenadas_y}
                        </div>
                        <div className="text-sm text-red-500 mb-4">
                          Error: No se pudieron convertir las coordenadas UTM
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Floating Buttons - Always Visible */}
              <div className="sticky bottom-2 left-0 right-0 flex justify-center z-20 px-4 pointer-events-none">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pointer-events-auto w-full sm:w-auto max-w-sm sm:max-w-none">
                  {/* Consultar Boletín - Full width on mobile, auto on desktop */}
                  {boletin_url && (
                    <button
                      onClick={() => window.open(boletin_url, '_blank', 'noopener,noreferrer')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-section-accent)] text-white rounded-full hover:bg-[var(--color-section-accent-hover)] transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                      title="Consultar boletín oficial"
                    >
                      📄 Consultar Boletín
                    </button>
                  )}
                  {/* Google Maps y Apple Maps - 50% each on mobile, auto on desktop */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-full hover:text-white hover:bg-gray-400 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://maps.apple.com/?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-full hover:text-white hover:bg-gray-400 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Apple Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
