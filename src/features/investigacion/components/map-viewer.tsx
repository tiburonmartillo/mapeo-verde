"use client"

import { useEffect, useState } from 'react'

interface MapViewerProps {
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  nombre_proyecto: string
  municipio: string
}

// Función para convertir UTM a Lat/Long (Zona 14N para Aguascalientes)
function utmToLatLong(utmX: number, utmY: number): { lat: number; lng: number } | null {
  if (!utmX || !utmY) return null

  // Verificar si las coordenadas están invertidas
  let x = utmX
  let y = utmY
  
  // Si y > x y y > 1000000, probablemente están invertidas
  if (y > x && y > 1000000) {
    const temp = x
    x = y
    y = temp
  }

  // Parámetros para UTM Zona 14N (Aguascalientes)
  const zone = 14
  const falseEasting = 500000
  const falseNorthing = 0
  const k0 = 0.9996
  const a = 6378137 // WGS84 semi-major axis
  const e2 = 0.00669438002290 // WGS84 first eccentricity squared
  
  const x_adj = x - falseEasting
  const y_adj = y - falseNorthing
  
  const m = y_adj / k0
  const mu = m / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256))
  
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2))
  const j1 = 3*e1/2 - 27*e1*e1*e1/32
  const j2 = 21*e1*e1/16 - 55*e1*e1*e1*e1/32
  const j3 = 151*e1*e1*e1/96
  const j4 = 1097*e1*e1*e1*e1/512
  
  const fp = mu + j1*Math.sin(2*mu) + j2*Math.sin(4*mu) + j3*Math.sin(6*mu) + j4*Math.sin(8*mu)
  
  const e_prim2 = e2/(1-e2)
  const c1 = e_prim2 * Math.cos(fp) * Math.cos(fp)
  const t1 = Math.tan(fp) * Math.tan(fp)
  const n1 = a / Math.sqrt(1 - e2*Math.sin(fp)*Math.sin(fp))
  const r1 = a*(1-e2)/Math.pow(1 - e2*Math.sin(fp)*Math.sin(fp), 1.5)
  const d = x_adj / (n1*k0)
  
  const lat = fp - (n1*Math.tan(fp)/r1) * (d*d/2 - (5 + 3*t1 + 10*c1 - 4*c1*c1 - 9*e_prim2)*d*d*d*d/24 + (61 + 90*t1 + 298*c1 + 45*t1*t1 - 252*e_prim2 - 3*c1*c1)*d*d*d*d*d*d/720)
  const lon = (d - (1 + 2*t1 + c1)*d*d*d/6 + (5 - 2*c1 + 28*t1 - 3*c1*c1 + 8*e_prim2 + 24*t1*t1)*d*d*d*d*d/120) / Math.cos(fp)
  
  const longitude = lon * 180 / Math.PI + (zone - 1) * 6 - 180
  const latitude = lat * 180 / Math.PI
  
  return { lat: latitude, lng: longitude }
}

export function MapViewer({ coordenadas_x, coordenadas_y, expediente, nombre_proyecto, municipio }: MapViewerProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (coordenadas_x && coordenadas_y) {
        const coords = utmToLatLong(coordenadas_x, coordenadas_y)
        setCoordinates(coords)
        setError(null)
      } else {
        setCoordinates(null)
        setError(null)
      }
    } catch (err) {
      console.error('Error procesando coordenadas:', err)
      setError('Error al procesar las coordenadas')
    }
  }, [coordenadas_x, coordenadas_y])

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 bg-red-50 rounded-lg">
        <div className="text-red-600">⚠️ {error}</div>
      </div>
    )
  }

  if (!coordinates) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <div className="text-gray-500">Sin coordenadas disponibles</div>
      </div>
    )
  }

  // URL de OpenStreetMap estática con marcador
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng-0.01},${coordinates.lat-0.01},${coordinates.lng+0.01},${coordinates.lat+0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`

  return (
    <div className="w-full h-48 rounded-lg overflow-hidden border border-gray-200">
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        className="border-0"
        title={`Mapa de ${expediente}`}
      />
    </div>
  )
}
