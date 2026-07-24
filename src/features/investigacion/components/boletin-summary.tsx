'use client'

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
  staticMode?: boolean
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
    <div
      id="boletin-summary"
      className="boletin-summary mx-auto max-w-full bg-white"
    >
      {/* Header naranja */}
      <div
        className="rounded-t-lg px-2 py-2 text-center md:px-4 md:py-3"
        style={{ backgroundColor: 'var(--color-section-accent)', color: '#ffffff' }}
      >
        <h1 className="mb-1 text-lg font-bold md:text-xl" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)' }}>
          Resumen del Boletín Ambiental de SSMAA
        </h1>
        <p className="text-base font-normal md:text-lg" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}>
          {formatearFechaCorta(boletin.fecha_publicacion)}
        </p>
      </div>

      {/* Contenido principal */}
      <div className="p-2 md:p-4">
        {/* Sección de proyectos ingresados */}
        {boletin.proyectos_ingresados && boletin.proyectos_ingresados.length > 0 && (
          <div className="mb-4">
            <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-section-text)', fontSize: '1.5rem' }}>
              Proyectos ingresados a impacto ambiental
            </h2>
            
            <p className="mb-3 text-base text-gray-500">
              Fecha límite para solicitud de consulta pública: {fechaLimiteFormateada}
            </p>

            <hr className="mb-3 border-gray-200" />

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
          </div>
        )}

        {/* Sección de resolutivos emitidos */}
        <div className="mb-4">
          <h2 className="mb-2 text-center text-xl font-bold text-gray-800" style={{ fontSize: '1.5rem' }}>
            {getTextoResolutivos(boletin)}
          </h2>

          {boletin.resolutivos_emitidos && boletin.resolutivos_emitidos.length > 0 && (
            <>
              <hr className="mb-3 border-gray-200" />
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
        </div>

      </div>

      {/* Footer */}
      <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-2 py-2 md:px-4 md:py-3">
        <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between md:gap-0">
          <div className="flex-1">
            <p className="mb-1 block text-xs leading-relaxed text-gray-500">
              La información presentada es obtenida de{' '}
              <a
                href="https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--color-section-accent)' }}
              >
                https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp
              </a>
            </p>
            <p className="mb-1 block text-xs leading-relaxed text-gray-500">
              La precisión de las ubicaciones y la calidad de la información son responsabilidad de la Secretaría de Sustentabilidad, Medio Ambiente y Agua.
            </p>
            <p className="block text-xs leading-relaxed text-gray-500">
              ADN-A se limita a compartir información pública de interés para la sociedad.
            </p>
          </div>

          <div className="md:ml-3">
            <img
              src="/assets/logocompleto.png"
              alt="Alianza por la Defensa de la Naturaleza Aguascalientes"
              className="h-10 w-auto md:h-[60px]"
            />
          </div>
        </div>
      </div>

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
        }
      `}</style>
    </div>
  )
}
