import { CoordinateValidator } from './coordinate-validator'
import { normalizeRawCoordinate } from './coordinate-corrections'

const coordinateValidator = new CoordinateValidator()

export interface MapStaticConfig {
  width?: number
  height?: number
  zoom?: number
  markerColor?: string
}

export interface MapStaticResult {
  url: string
  lat: number
  lng: number
  success: boolean
  error?: string
}

/**
 * Convierte coordenadas UTM a Lat/Lng usando el validador existente.
 * Acepta números o strings crudos de la BD (DMS "21°48´26.13´´" o UTM).
 */
export function convertirCoordenadasUTM(
  coordenadas_x: number | string | null,
  coordenadas_y: number | string | null
): { lat: number; lng: number; success: boolean; error?: string } {
  const nx = normalizeRawCoordinate(coordenadas_x)
  const ny = normalizeRawCoordinate(coordenadas_y)

  if (nx === null || ny === null) {
    return {
      lat: 0,
      lng: 0,
      success: false,
      error: 'No se pudieron normalizar las coordenadas'
    }
  }

  try {
    const result = coordinateValidator.processCoordinates(nx, ny)
    
    if (result.success && result.corrected) {
      return {
        lat: result.corrected.y,
        lng: result.corrected.x,
        success: true
      }
    }
    
    return {
      lat: 0,
      lng: 0,
      success: false,
      error: result.error || 'No se pudieron convertir las coordenadas'
    }
  } catch (error) {
    return {
      lat: 0,
      lng: 0,
      success: false,
      error: 'Error al procesar coordenadas'
    }
  }
}

/**
 * Genera URL para mapa estático de OpenStreetMap
 */
export function generarMapaEstaticoOSM(
  coordenadas_x: number | string | null,
  coordenadas_y: number | string | null,
  config: MapStaticConfig = {}
): MapStaticResult {
  const {
    width = 400,
    height = 300,
    zoom = 15,
    markerColor = 'red'
  } = config

  const nx = normalizeRawCoordinate(coordenadas_x)
  const ny = normalizeRawCoordinate(coordenadas_y)

  if (nx === null || ny === null) {
    return {
      url: '',
      lat: 0,
      lng: 0,
      success: false,
      error: 'No se pudieron normalizar las coordenadas'
    }
  }

  let lat: number, lng: number

  // Si las coordenadas parecen ser lat/lng (valores pequeños), usarlas directamente
  if (Math.abs(nx) < 90 && Math.abs(ny) < 180) {
    lat = nx
    lng = ny
  } else {
    // Intentar conversión UTM
    const conversion = convertirCoordenadasUTM(nx, ny)
    
    if (!conversion.success) {
      return {
        url: '',
        lat: 0,
        lng: 0,
        success: false,
        error: conversion.error
      }
    }

    lat = conversion.lat
    lng = conversion.lng
  }
  
  // URL base de OpenStreetMap Static Map API
  const baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php'
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    markers: `${lat},${lng},${markerColor}`,
    maptype: 'mapnik'
  })

  return {
    url: `${baseUrl}?${params.toString()}`,
    lat,
    lng,
    success: true
  }
}

/**
 * Genera URL alternativa usando Mapbox (requiere API key)
 * Solo usar si OpenStreetMap falla
 */
export function generarMapaEstaticoMapbox(
  coordenadas_x: number | string | null,
  coordenadas_y: number | string | null,
  apiKey: string,
  config: MapStaticConfig = {}
): MapStaticResult {
  const {
    width = 400,
    height = 300,
    zoom = 15
  } = config

  const nx = normalizeRawCoordinate(coordenadas_x)
  const ny = normalizeRawCoordinate(coordenadas_y)

  if (nx === null || ny === null) {
    return { url: '', lat: 0, lng: 0, success: false, error: 'No se pudieron normalizar las coordenadas' }
  }

  const conversion = convertirCoordenadasUTM(nx, ny)
  
  if (!conversion.success) {
    return {
      url: '',
      lat: 0,
      lng: 0,
      success: false,
      error: conversion.error
    }
  }

  const { lat, lng } = conversion
  
  // URL de Mapbox Static Images API
  const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static'
  const marker = `pin-s+f97316(${lng},${lat})`
  const center = `${lng},${lat},${zoom}`
  const size = `${width}x${height}@2x`
  
  return {
    url: `${baseUrl}/${marker}/${center}/${size}?access_token=${apiKey}`,
    lat,
    lng,
    success: true
  }
}

/**
 * Genera URL para ver el mapa completo en OpenStreetMap
 */
export function generarURLMapaCompleto(
  coordenadas_x: number | string | null,
  coordenadas_y: number | string | null
): string {
  const nx = normalizeRawCoordinate(coordenadas_x)
  const ny = normalizeRawCoordinate(coordenadas_y)

  if (nx === null || ny === null) return ''

  let lat: number, lng: number

  // Si las coordenadas parecen ser lat/lng (valores pequeños), usarlas directamente
  if (Math.abs(nx) < 90 && Math.abs(ny) < 180) {
    lat = nx
    lng = ny
  } else {
    // Intentar conversión UTM
    const conversion = convertirCoordenadasUTM(nx, ny)
    
    if (!conversion.success) {
      return ''
    }

    lat = conversion.lat
    lng = conversion.lng
  }

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`
}

/**
 * Valida si las coordenadas son válidas para generar mapas
 */
export function validarCoordenadasParaMapa(
  coordenadas_x: number | string | null,
  coordenadas_y: number | string | null
): boolean {
  const nx = normalizeRawCoordinate(coordenadas_x)
  const ny = normalizeRawCoordinate(coordenadas_y)

  if (nx === null || ny === null) {
    return false
  }

  // Si las coordenadas parecen ser lat/lng (valores pequeños), aceptarlas directamente
  if (Math.abs(nx) < 90 && Math.abs(ny) < 180) {
    return true
  }

  const conversion = convertirCoordenadasUTM(nx, ny)
  return conversion.success
}
