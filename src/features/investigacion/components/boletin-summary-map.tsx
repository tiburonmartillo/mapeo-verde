'use client'

import { useState, useEffect } from 'react'
import { generarMapaEstaticoOSM, generarURLMapaCompleto, validarCoordenadasParaMapa } from '../lib/map-static-generator'
import { FrogLoading } from './frog-loading'

interface MapStaticProps {
  coordenadas_x: number | null
  coordenadas_y: number | null
  municipio: string
  width?: number
  height?: number
  showLink?: boolean
}

export function BoletinSummaryMap({ 
  coordenadas_x, 
  coordenadas_y, 
  municipio,
  width = 400,
  height = 300,
  showLink = true
}: MapStaticProps) {
  const [mapData, setMapData] = useState<{
    url: string
    lat: number
    lng: number
    success: boolean
    error?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMap = () => {
      if (!coordenadas_x || !coordenadas_y) {
        setError('Coordenadas no disponibles')
        setLoading(false)
        return
      }

      if (!validarCoordenadasParaMapa(coordenadas_x, coordenadas_y)) {
        setError('Coordenadas inválidas')
        setLoading(false)
        return
      }

      try {
        const mapResult = generarMapaEstaticoOSM(coordenadas_x, coordenadas_y, {
          width,
          height,
          zoom: 15,
          markerColor: 'red'
        })

        if (mapResult.success) {
          setMapData(mapResult)
        } else {
          setError(mapResult.error || 'Error al generar el mapa')
        }
      } catch (err) {
        setError('Error al cargar el mapa')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(loadMap, 100)
    return () => clearTimeout(timeoutId)
  }, [coordenadas_x, coordenadas_y, width, height])

  if (loading) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center rounded border border-gray-200 bg-gray-100"
      >
        <FrogLoading fullScreen={false} size={140} message="Cargando mapa..." className="min-h-0" />
      </div>
    )
  }

  if (error || !mapData?.success) {
    return (
      <div
        style={{ width, height }}
        className="flex flex-col items-center justify-center rounded border border-gray-200 bg-gray-100 p-2"
      >
        <p className="text-center text-sm text-red-600">
          {error || 'No se pudo cargar el mapa'}
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          Municipio: {municipio}
        </p>
      </div>
    )
  }

  return (
    <div style={{ width, height }}>
      <img
        src={mapData.url}
        alt={`Mapa de ubicación en ${municipio}`}
        className="h-full w-full cursor-pointer rounded border border-gray-200 object-cover"
        onClick={() => {
          if (showLink && mapData.success) {
            const url = generarURLMapaCompleto(coordenadas_x!, coordenadas_y!)
            window.open(url, '_blank')
          }
        }}
      />
      
      <div className="mt-1 text-center">
        <p className="text-xs text-gray-500">
          Ubicación en {municipio}
        </p>
        {showLink && mapData.success && (
          <div className="mt-0.5">
            <a
              href={generarURLMapaCompleto(coordenadas_x!, coordenadas_y!)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-700 underline hover:text-blue-900"
            >
              Ver en OpenStreetMap
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
