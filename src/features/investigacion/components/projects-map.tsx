
import { useEffect, useMemo, useRef, useState } from "react"
import { coordinateValidator } from "../lib/coordinate-validator"

type Proyecto = {
  numero: number
  tipo_estudio: string
  promovente: string
  nombre_proyecto: string
  giro: string
  municipio: string
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  fecha_ingreso: string
  boletin_id: number
  naturaleza_proyecto: string
  fecha_publicacion: string
  boletin_url: string
}

interface ProjectsMapProps {
  proyectos: Proyecto[]
  onSelectExpediente?: (expediente: string) => void
  compact?: boolean
  /** Si se indica, el mapa hace zoom (flyTo) a la ubicación de este expediente */
  focusExpediente?: string | null
}

// Carga Leaflet desde CDN sólo en el cliente
const useLeaflet = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ensureReady = () => {
      if ((window as any).L) { setReady(true); return true }
      return false
    }

    const cssId = "leaflet-css"
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link")
      link.id = cssId
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      link.crossOrigin = ""
      document.head.appendChild(link)
    }

    const scriptId = "leaflet-js"
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!existing) {
      const script = document.createElement("script") as HTMLScriptElement
      script.id = scriptId
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      script.crossOrigin = ""
      script.onload = () => ensureReady()
      document.body.appendChild(script)
    } else {
      // Si ya existe, espera a que esté cargado o verifica periódicamente
      if (!ensureReady()) {
        existing.addEventListener('load', ensureReady)
        const id = window.setInterval(() => { if (ensureReady()) window.clearInterval(id) }, 50)
        return () => window.clearInterval(id)
      }
    }
  }, [])

  return ready
}

// Función para corregir coordenadas comunes con errores de dígitos
function fixCoordinateDigits(x: number, y: number): { x: number; y: number } {
  let correctedX = x;
  let correctedY = y;
  
  // Corregir Y si tiene dígitos extra (ej: 24146188 -> 2414688)
  if (y > 10000000) {
    const yStr = y.toString();
    if (yStr.length === 8 && yStr.startsWith('24')) {
      correctedY = parseInt(yStr.substring(0, 7)); // Remover último dígito
    }
  }
  
  // Corregir X si tiene formato incorrecto (ej: 781.265 -> 781265)
  // Solo aplica cuando Y está en rango UTM (millones), indicando que no son Lat/Lng
  if (x < 10000 && x > 500 && y > 1000000) {
    correctedX = Math.round(x * 1000);
  }
  
  return { x: correctedX, y: correctedY };
}

// Exportada para usar en la página (botones Ver en maps, etc.) con la misma conversión que el mapa
export function convertToLatLong(x: number | null, y: number | null): { lat: number; lng: number } | null {
  if (!x || !y) return null

  // Aplicar correcciones de dígitos antes de validar
  const { x: correctedX, y: correctedY } = fixCoordinateDigits(x, y);

  // Validar y corregir coordenadas
  const validationResult = coordinateValidator.processCoordinates(correctedX, correctedY);
  
  if (!validationResult.success) {
    return null;
  }

  const finalX = validationResult.corrected.x;
  const finalY = validationResult.corrected.y;

  // Si las coordenadas ya están en formato Lat/Lng, devolverlas directamente
  if (validationResult.type === 'latlng') {
    return { lat: finalY, lng: finalX };
  }

  // Si son coordenadas UTM, aplicar conversión completa
  if (validationResult.type === 'utm' || validationResult.type === 'utm14') {
    const zone = validationResult.type === 'utm14' ? 14 : 13;
    
    // Parámetros del elipsoide WGS84
    const sm_a = 6378137;
    const sm_b = 6356752.314;
    const UTMScaleFactor = 0.9996;
    
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
    
    // Ajustar coordenadas UTM
    let xx = finalX - 500000;
    xx = xx / UTMScaleFactor;
    const yy = finalY / UTMScaleFactor;
    
    // Calcular meridiano central de la zona
    const lambda0 = ((-183 + (zone * 6)) / 180) * Math.PI;
    
    // Calcular latitud del pie
    const phif = calculateFootpointLatitude(yy);
    
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
    const lat = phif + x2frac * x2poly * (xx * xx) + x4frac * x4poly * xx ** 4 + 
                x6frac * x6poly * xx ** 6 + x8frac * x8poly * xx ** 8;
    const lng = lambda0 + x1frac * xx + x3frac * x3poly * xx ** 3 + 
                x5frac * x5poly * xx ** 5 + x7frac * x7poly * xx ** 7;
    
    // Convertir de radianes a grados
    const latDegrees = (lat / Math.PI) * 180;
    const lngDegrees = (lng / Math.PI) * 180;
    
    return { lat: latDegrees, lng: lngDegrees };
  }

  return null;
}

export function ProjectsMap({ proyectos, onSelectExpediente, compact, focusExpediente }: ProjectsMapProps) {
  const ready = useLeaflet()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const markersLayerRef = useRef<any>(null)
  const [visibleBounds, setVisibleBounds] = useState<any>(null)
  const [currentZoom, setCurrentZoom] = useState<number>(9)

  // Pre-procesar todos los proyectos con sus coordenadas convertidas y ordenarlos por fecha
  const proyectosProcesados = useMemo(() => {
    const proyectosOrdenados = [...(proyectos || [])].sort((a, b) => {
      const fechaA = a.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0
      const fechaB = b.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0
      return fechaB - fechaA // Orden descendente (más reciente primero)
    })
    
    return proyectosOrdenados
      .map(p => {
        const coords = convertToLatLong(p.coordenadas_x, p.coordenadas_y)
        if (!coords) return null
        return {
          ...p,
          lat: coords.lat,
          lng: coords.lng
        }
      })
      .filter((p): p is Proyecto & { lat: number; lng: number } => p !== null)
  }, [proyectos])

  // Filtrar proyectos basándose en bounds visibles y zoom
  const items = useMemo(() => {
    let filtrados = proyectosProcesados

    // Si hay zoom suficiente y bounds visibles, filtrar por área visible
    // Zoom mínimo de 9 para mostrar marcadores (evita sobrecarga en vista inicial)
    if (currentZoom >= 9 && visibleBounds) {
      filtrados = filtrados.filter(p => {
        try {
          return visibleBounds.contains([p.lat, p.lng])
        } catch {
          return false
        }
      })
    } else if (currentZoom < 9) {
      // Si el zoom es muy bajo, no mostrar marcadores
      return []
    }

    // Limitar a 50 proyectos máximo para evitar sobrecarga
    return filtrados.slice(0, 50)
  }, [proyectosProcesados, visibleBounds, currentZoom])

  useEffect(() => {
    if (!ready || !mapRef.current || typeof window === "undefined") return
    const L = (window as any).L
    if (!L) return
    if (!leafletMapRef.current) {
      // Centro de Aguascalientes
      const centerAgs = [21.8818, -102.2916]
      // Límites aproximados del estado de Aguascalientes
      const boundsAgs = L.latLngBounds(
        [21.5, -102.8],  // Suroeste
        [22.5, -101.7]   // Noreste
      )
      
      leafletMapRef.current = L.map(mapRef.current, {
        center: centerAgs,
        zoom: 12,
        maxBounds: boundsAgs,
        maxBoundsViscosity: 1.0 // Evita que el mapa se salga de los límites
      })
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMapRef.current)
      
      markersLayerRef.current = L.layerGroup().addTo(leafletMapRef.current)

      // Actualizar bounds visibles cuando el mapa se mueve o hace zoom
      const updateVisibleBounds = () => {
        if (!leafletMapRef.current) return
        const bounds = leafletMapRef.current.getBounds()
        const zoom = leafletMapRef.current.getZoom()
        setVisibleBounds(bounds)
        setCurrentZoom(zoom)
      }

      // Escuchar eventos de movimiento y zoom
      leafletMapRef.current.on('moveend', updateVisibleBounds)
      leafletMapRef.current.on('zoomend', updateVisibleBounds)
      
      // Actualizar bounds iniciales
      updateVisibleBounds()

      // Cleanup al desmontar
      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.off('moveend', updateVisibleBounds)
          leafletMapRef.current.off('zoomend', updateVisibleBounds)
        }
      }
    }
  }, [ready])

  useEffect(() => {
    if (!ready || !markersLayerRef.current) return
    const L = (window as any).L
    if (!L) return
    
    markersLayerRef.current.clearLayers()
    
    // Incluir siempre el proyecto seleccionado en los marcadores para que el pin rojo sea visible
    let itemsToShow = items && items.length > 0 ? [...items] : []
    if (focusExpediente) {
      const focused = proyectosProcesados.find((p) => p.expediente === focusExpediente)
      if (focused && ('lat' in focused) && ('lng' in focused) && !itemsToShow.some((p) => p.expediente === focusExpediente)) {
        itemsToShow = [...itemsToShow, focused]
      }
    }
    if (itemsToShow.length === 0) return

    const redIcon = L.divIcon({
      className: 'leaflet-div-icon adna-marker-selected',
      html: '<div style="width:26px;height:26px;background:#dc2626;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    })

    const bounds: any[] = []
    itemsToShow.forEach(p => {
      if (!p || !p.expediente || !('lat' in p) || !('lng' in p)) return
      
      const isSelected = focusExpediente != null && p.expediente === focusExpediente
      const icon = isSelected ? redIcon : undefined

      // Escapar HTML para prevenir XSS
      const nombreProyecto = String(p.nombre_proyecto || 'Sin nombre').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const expediente = String(p.expediente || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const promovente = String(p.promovente || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const html = `
        <div style="min-width:240px">
          <div style="font-weight:600;margin-bottom:4px">${nombreProyecto}</div>
          <div style="font-size:12px;opacity:.8">Expediente: ${expediente}</div>
          <div style="font-size:12px;opacity:.8">Promovente: ${promovente}</div>
        </div>`
      try {
        const marker = L.marker([p.lat, p.lng], icon ? { icon } : {}).bindTooltip(html, { direction: 'top' })
        marker.on('click', () => {
          if (onSelectExpediente && p.expediente) onSelectExpediente(p.expediente)
        })
        marker.addTo(markersLayerRef.current)
        bounds.push([p.lat, p.lng])
      } catch (error) {
        // Ignorar errores al crear marcadores individuales
      }
    })
  }, [items, ready, onSelectExpediente, focusExpediente, proyectosProcesados])

  // Zoom a la ubicación del expediente seleccionado (pin centrado en la vista)
  useEffect(() => {
    if (!focusExpediente || !ready || !leafletMapRef.current) return
    const L = (window as any).L
    if (!L) return
    const project = proyectosProcesados.find((p) => p.expediente === focusExpediente)
    if (!project || !('lat' in project) || !('lng' in project)) return
    const map = leafletMapRef.current
    map.invalidateSize()
    map.setView(L.latLng(project.lat, project.lng), 15)
  }, [focusExpediente, ready, proyectosProcesados])

  return (
    <div
      className="h-full w-full max-w-full overflow-hidden"
      style={{ borderRadius: "20px", minHeight: compact ? 220 : 300 }}
    >
      <div
        className="adna-map relative h-full w-full max-w-full overflow-hidden"
        style={{ borderRadius: 12, minHeight: compact ? 220 : 300, zIndex: 0 }}
      >
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500">
            Cargando mapa...
          </div>
        )}
        <div ref={mapRef} className={`h-full w-full ${ready ? "visible" : "invisible"}`} />
      </div>
      <style jsx global>{`
        .adna-map { z-index: 0 !important; }
        .adna-map .leaflet-pane,
        .adna-map .leaflet-control,
        .adna-map .leaflet-top,
        .adna-map .leaflet-bottom { z-index: 10 !important; }
      `}</style>
    </div>
  )
}


