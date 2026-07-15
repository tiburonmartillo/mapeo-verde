'use client'

import { Box, Typography, Paper, Divider } from '@mui/material'
import { Proyecto, Resolutivo } from '../lib/types'
import { ClientOnlyMap } from './client-only-map'
import { formatearFechaCorta } from '../lib/boletin-utils'

interface ProjectSummaryProps {
  proyecto: Proyecto | Resolutivo
  numero: number
  tipo: 'proyecto' | 'resolutivo'
  staticMode?: boolean // Nueva prop para modo estático (para PDF)
  todosLosProyectos?: Proyecto[] // Proyectos del boletín para buscar coordenadas
}

export function BoletinSummaryProject({ proyecto, numero, tipo, staticMode = false, todosLosProyectos = [] }: ProjectSummaryProps) {
  const isResolutivo = tipo === 'resolutivo'
  const resolutivo = isResolutivo ? proyecto as Resolutivo : null
  
  // Para resolutivos, buscar coordenadas del proyecto ingresado correspondiente
  let coordenadas_x = proyecto.coordenadas_x
  let coordenadas_y = proyecto.coordenadas_y
  
  if (isResolutivo && !coordenadas_x && !coordenadas_y && todosLosProyectos.length > 0) {
    // Buscar el proyecto ingresado con el mismo expediente
    const proyectoIngresado = todosLosProyectos.find(p => p.expediente === proyecto.expediente)
    if (proyectoIngresado) {
      coordenadas_x = proyectoIngresado.coordenadas_x
      coordenadas_y = proyectoIngresado.coordenadas_y
    }
  }

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        backgroundColor: '#ffffff'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        gap: 3,
        flexDirection: { xs: 'column', lg: 'row' }
      }}>
        {/* Información del proyecto - Columna izquierda */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontWeight: 'bold',
              color: 'var(--color-section-text)',
              mb: 2,
              fontSize: '1.1rem'
            }}
          >
            {proyecto.nombre_proyecto}
          </Typography>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2
          }}>
            {/* Promovente */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                Promovente:
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                {proyecto.promovente}
              </Typography>
            </Box>

            {/* Municipio */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                Municipio:
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                {proyecto.municipio}
              </Typography>
            </Box>

            {/* Expediente */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                Expediente:
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                {proyecto.expediente}
              </Typography>
            </Box>

            {/* Fechas */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                {isResolutivo ? 'Fecha de ingreso:' : 'Fechas de ingreso:'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                {formatearFechaCorta(proyecto.fecha_ingreso)}
              </Typography>
            </Box>

            {/* Fecha de resolutivo (solo para resolutivos) */}
            {isResolutivo && resolutivo && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                  Fecha de resolutivo:
                </Typography>
                <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                  {formatearFechaCorta(resolutivo.fecha_resolutivo)}
                </Typography>
              </Box>
            )}

            {/* Tipo de estudio */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)' }}>
                Tipo:
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280', ml: 1 }}>
                {proyecto.tipo_estudio}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Mapa - Columna derecha */}
        <Box sx={{ 
          width: { xs: '100%', lg: '50%' },
          flexShrink: 0,
          order: { xs: -1, lg: 0 }
        }}>
          {coordenadas_x && coordenadas_y ? (
            <Box sx={{ 
              height: { xs: 150, sm: 200, md: 250 },
              width: '100%',
              overflow: 'hidden',
              borderRadius: 1
            }}>
              <ClientOnlyMap
                coordenadas_x={coordenadas_x}
                coordenadas_y={coordenadas_y}
                municipio={proyecto.municipio}
                width={400}
                height={staticMode ? 300 : undefined}
                showLink={false}
                staticMode={staticMode}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: { xs: 150, sm: 200, md: 250 },
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
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Mapas de ubicación no disponibles
              </Typography>
              <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                Este {isResolutivo ? 'resolutivo' : 'proyecto'} no tiene coordenadas registradas
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Naturaleza del proyecto - Ocupa el 100% del ancho debajo del contenido principal */}
      <Box sx={{ mt: 2, width: '100%' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'var(--color-section-text)', mb: 1 }}>
          Naturaleza del proyecto:
        </Typography>
        <Box
          sx={{
            p: 2,
            border: '1px solid #d1d5db',
            borderRadius: 1,
            backgroundColor: '#f9fafb',
            width: '100%'
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'var(--color-section-text)',
              lineHeight: 1.5,
              fontSize: '0.875rem'
            }}
          >
            {proyecto.naturaleza_proyecto}
          </Typography>
        </Box>
      </Box>

      {/* Separador entre proyectos */}
      {numero > 1 && (
        <Divider sx={{ mt: 3, borderColor: '#e5e7eb' }} />
      )}
    </Paper>
  )
}
