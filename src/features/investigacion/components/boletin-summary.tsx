'use client'

import { Box, Typography, Paper, Button, Divider } from '@mui/material'
import { Boletin } from '../lib/types'
import { BoletinSummaryProject } from './boletin-summary-project'
import { 
  calcularFechaLimiteConsulta, 
  formatearFechaCorta, 
  getTextoResolutivos,
  generarTituloBoletin 
} from '../lib/boletin-utils'
import '../../../styles/boletin-summary.css'

interface BoletinSummaryProps {
  boletin: Boletin
  showPrintButton?: boolean
  showDownloadButton?: boolean
  onDownloadPDF?: () => void
  staticMode?: boolean // Nueva prop para modo estático (para PDF)
}

export function BoletinSummary({ 
  boletin, 
  showPrintButton = true,
  showDownloadButton = true,
  onDownloadPDF,
  staticMode = false
}: BoletinSummaryProps) {
  const fechaLimite = calcularFechaLimiteConsulta(boletin.fecha_publicacion)
  const fechaLimiteFormateada = formatearFechaCorta(fechaLimite)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Box
      id="boletin-summary"
      className="boletin-summary"
      sx={{
        maxWidth: '100%',
        margin: '0 auto',
        backgroundColor: '#FFFFFF'
      }}
    >
      {/* Header naranja */}
      <Box
        sx={{
          backgroundColor: 'var(--color-section-accent)',
          color: '#ffffff',
          py: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          textAlign: 'center',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            mb: 1
          }}
        >
          Resumen del Boletín Ambiental de SSMAA
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1rem', md: '1.25rem' },
            fontWeight: 400
          }}
        >
          {formatearFechaCorta(boletin.fecha_publicacion)}
        </Typography>
      </Box>

      {/* Contenido principal */}
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Sección de proyectos ingresados */}
        {boletin.proyectos_ingresados && boletin.proyectos_ingresados.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 'bold',
                color: 'var(--color-section-text)',
                mb: 2,
                fontSize: '1.5rem'
              }}
            >
              Proyectos ingresados a impacto ambiental
            </Typography>
            
            <Typography
              variant="body1"
              sx={{
                color: '#6B7280',
                mb: 3,
                fontSize: '1rem'
              }}
            >
              Fecha límite para solicitud de consulta pública: {fechaLimiteFormateada}
            </Typography>

            <Divider sx={{ mb: 3, borderColor: '#e5e7eb' }} />

            {/* Lista de proyectos */}
            {(boletin.proyectos_ingresados || []).map((proyecto, index) => (
              <BoletinSummaryProject
                key={`proyecto-${proyecto.expediente}`}
                proyecto={proyecto}
                numero={index + 1}
                tipo="proyecto"
                staticMode={staticMode}
                todosLosProyectos={boletin.proyectos_ingresados}
              />
            ))}
          </Box>
        )}

        {/* Sección de resolutivos emitidos */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 'bold',
              color: '#1F2937',
              mb: 2,
              fontSize: '1.5rem',
              textAlign: 'center'
            }}
          >
            {getTextoResolutivos(boletin)}
          </Typography>

          {/* Lista de resolutivos */}
          {boletin.resolutivos_emitidos && boletin.resolutivos_emitidos.length > 0 && (
            <>
              <Divider sx={{ mb: 3, borderColor: '#e5e7eb' }} />
              {boletin.resolutivos_emitidos.map((resolutivo, index) => (
                <BoletinSummaryProject
                  key={`resolutivo-${resolutivo.expediente}`}
                  proyecto={resolutivo}
                  numero={index + 1}
                  tipo="resolutivo"
                  staticMode={staticMode}
                  todosLosProyectos={boletin.proyectos_ingresados}
                />
              ))}
            </>
          )}
        </Box>

      </Box>

      {/* Footer */}
      <Box
        sx={{
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          py: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          borderRadius: '0 0 8px 8px'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, md: 0 }
        }}>
          {/* Información legal */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: 'block',
                mb: 1
              }}
            >
              La información presentada es obtenida de{' '}
              <Box
                component="a"
                href="https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'var(--color-section-accent)', textDecoration: 'none' }}
              >
                https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp
              </Box>
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: 'block',
                mb: 1
              }}
            >
              La precisión de las ubicaciones y la calidad de la información son responsabilidad de la Secretaría de Sustentabilidad, Medio Ambiente y Agua.
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: 'block'
              }}
            >
              ADN-A se limita a compartir información pública de interés para la sociedad.
            </Typography>
          </Box>

          {/* Logo */}
          <Box sx={{ ml: { xs: 0, md: 3 } }}>
            <Box
              component="img"
              src="/assets/logocompleto.png"
              alt="Alianza por la Defensa de la Naturaleza Aguascalientes"
              sx={{
                height: { xs: 40, md: 60 },
                width: 'auto'
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Estilos CSS para impresión */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          #boletin-summary {
            box-shadow: none !important;
            border: none !important;
          }
          
          .MuiPaper-root {
            box-shadow: none !important;
            border: 1px solid #e0e0e0 !important;
          }
        }
      `}</style>
    </Box>
  )
}
