'use client'

import { Proyecto, Resolutivo } from '../lib/types'
import { ClientOnlyMap } from './client-only-map'
import { formatearFechaCorta } from '../lib/boletin-utils'

interface ProjectSummaryProps {
  proyecto: Proyecto | Resolutivo
  numero: number
  tipo: 'proyecto' | 'resolutivo'
  staticMode?: boolean
  todosLosProyectos?: Proyecto[]
}

export function BoletinSummaryProject({ proyecto, numero, tipo, staticMode = false, todosLosProyectos = [] }: ProjectSummaryProps) {
  const isResolutivo = tipo === 'resolutivo'
  const resolutivo = isResolutivo ? proyecto as Resolutivo : null
  
  let coordenadas_x = proyecto.coordenadas_x
  let coordenadas_y = proyecto.coordenadas_y
  
  if (isResolutivo && !coordenadas_x && !coordenadas_y && todosLosProyectos.length > 0) {
    const proyectoIngresado = todosLosProyectos.find(p => p.expediente === proyecto.expediente)
    if (proyectoIngresado) {
      coordenadas_x = proyectoIngresado.coordenadas_x
      coordenadas_y = proyectoIngresado.coordenadas_y
    }
  }

  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Información del proyecto - Columna izquierda */}
        <div className="flex-1">
          <h3 className="mb-2 text-base font-bold" style={{ color: 'var(--color-section-text)', fontSize: '1.1rem' }}>
            {proyecto.nombre_proyecto}
          </h3>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Promovente */}
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Promovente:</p>
              <p className="ml-1 text-sm text-gray-500">{proyecto.promovente}</p>
            </div>

            {/* Municipio */}
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Municipio:</p>
              <p className="ml-1 text-sm text-gray-500">{proyecto.municipio}</p>
            </div>

            {/* Expediente */}
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Expediente:</p>
              <p className="ml-1 text-sm text-gray-500">{proyecto.expediente}</p>
            </div>

            {/* Fechas */}
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>
                {isResolutivo ? 'Fecha de ingreso:' : 'Fechas de ingreso:'}
              </p>
              <p className="ml-1 text-sm text-gray-500">{formatearFechaCorta(proyecto.fecha_ingreso)}</p>
            </div>

            {/* Fecha de resolutivo (solo para resolutivos) */}
            {isResolutivo && resolutivo && (
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Fecha de resolutivo:</p>
                <p className="ml-1 text-sm text-gray-500">{formatearFechaCorta(resolutivo.fecha_resolutivo)}</p>
              </div>
            )}

            {/* Tipo de estudio */}
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Tipo:</p>
              <p className="ml-1 text-sm text-gray-500">{proyecto.tipo_estudio}</p>
            </div>
          </div>
        </div>

        {/* Mapa - Columna derecha */}
        <div className="w-full shrink-0 lg:w-1/2 lg:order-1" style={{ order: '-1' as any }}>
          {coordenadas_x && coordenadas_y ? (
            <div className="h-[150px] w-full overflow-hidden rounded sm:h-[200px] md:h-[250px]">
              <ClientOnlyMap
                coordenadas_x={coordenadas_x}
                coordenadas_y={coordenadas_y}
                municipio={proyecto.municipio}
                width={400}
                height={staticMode ? 300 : undefined}
                showLink={false}
                staticMode={staticMode}
              />
            </div>
          ) : (
            <div className="flex h-[150px] w-full flex-col items-center justify-center rounded border border-gray-200 bg-gray-100 p-2 sm:h-[200px] md:h-[250px]">
              <p className="text-center text-sm text-gray-500">Mapas de ubicación no disponibles</p>
              <p className="mt-1 text-center text-xs text-gray-500">
                Este {isResolutivo ? 'resolutivo' : 'proyecto'} no tiene coordenadas registradas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Naturaleza del proyecto */}
      <div className="mt-2 w-full">
        <p className="mb-1 text-sm font-bold" style={{ color: 'var(--color-section-text)' }}>Naturaleza del proyecto:</p>
        <div className="w-full rounded border border-gray-300 bg-gray-50 p-2">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-section-text)', fontSize: '0.875rem' }}>
            {proyecto.naturaleza_proyecto}
          </p>
        </div>
      </div>

      {numero > 1 && (
        <hr className="mt-3 border-gray-200" />
      )}
    </div>
  )
}
