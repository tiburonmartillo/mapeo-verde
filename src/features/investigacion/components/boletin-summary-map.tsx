'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Link, Alert } from '@mui/material'
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

    // Usar setTimeout para asegurar que se ejecute después del render
    const timeoutId = setTimeout(loadMap, 100)
    return () => clearTimeout(timeoutId)
  }, [coordenadas_x, coordenadas_y, width, height])

  if (loading) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 1
        }}
      >
        <FrogLoading fullScreen={false} size={140} message="Cargando mapa..." className="min-h-0" />
      </Box>
    )
  }

  if (error || !mapData?.success) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          p: 2
        }}
      >
        <Typography variant="body2" color="error" textAlign="center">
          {error || 'No se pudo cargar el mapa'}
        </Typography>
        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          Municipio: {municipio}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width, height }}>
      {/* Mapa estático */}
      <Box
        component="img"
        src={mapData.url}
        alt={`Mapa de ubicación en ${municipio}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          cursor: 'pointer'
        }}
        onClick={() => {
          if (showLink && mapData.success) {
            const url = generarURLMapaCompleto(coordenadas_x!, coordenadas_y!)
            window.open(url, '_blank')
          }
        }}
      />
      
      {/* Información del mapa */}
      <Box sx={{ mt: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Ubicación en {municipio}
        </Typography>
        {showLink && mapData.success && (
          <Box sx={{ mt: 0.5 }}>
            <Link
              href={generarURLMapaCompleto(coordenadas_x!, coordenadas_y!)}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              sx={{ fontSize: '0.75rem' }}
            >
              Ver en OpenStreetMap
            </Link>
          </Box>
        )}
      </Box>
    </Box>
  )
}
