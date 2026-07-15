import { useState, useEffect } from 'react'
import type { BoletinesData, Boletin, Proyecto, Resolutivo } from '../lib/types'
import { getInvestigacionClient } from '../lib/supabase-data'
import {
  getStats,
  getTimeSeriesData,
  getAllProyectos,
  getAllResolutivos,
  getDistributionByMunicipio,
  getDistributionByGiro,
} from '../lib/data-utils'

function getLatestBoletinDate(boletines: Boletin[]): string {
  if (!boletines || boletines.length === 0) {
    return '2025-01-01T00:00:00.000Z'
  }
  const latestBoletin = boletines.reduce((latest, current) => {
    const latestDate = new Date(latest.fecha_publicacion)
    const currentDate = new Date(current.fecha_publicacion)
    return currentDate > latestDate ? current : latest
  })
  return latestBoletin.fecha_publicacion
}

interface ProcessedData {
  stats: any
  timeSeriesData: any
  municipiosData: any
  girosData: any
  proyectos: any
  resolutivos: any
  metadata: {
    totalBoletines: number
    totalProyectos: number
    totalResolutivos: number
    lastUpdated: string
  }
}

function mapBoletin(row: any): Boletin {
  const proyectos: Proyecto[] = (row.proyectos_ingresados || []).map((p: any) => ({
    numero: p.numero,
    tipo_estudio: p.tipo_estudio,
    promovente: p.promovente,
    nombre_proyecto: p.nombre_proyecto,
    giro: p.giro,
    municipio: p.municipio,
    coordenadas_x: p.coordenadas_x,
    coordenadas_y: p.coordenadas_y,
    expediente: p.expediente,
    fecha_ingreso: p.fecha_ingreso,
    boletin_id: p.boletin_id,
    coord_valida: null,
    naturaleza_proyecto: p.naturaleza_proyecto,
  }))
  const resolutivos: Resolutivo[] = (row.boletines_resolutivos || []).map((r: any) => ({
    numero: r.numero,
    tipo_estudio: r.tipo_estudio,
    promovente: r.promovente,
    nombre_proyecto: r.nombre_proyecto,
    giro: r.giro,
    municipio: r.municipio,
    coordenadas_x: null,
    coordenadas_y: null,
    expediente: r.expediente,
    fecha_ingreso: r.fecha_ingreso,
    fecha_resolutivo: r.fecha_resolutivo,
    no_oficio_resolutivo: r.no_oficio_resolutivo,
    boletin_id: r.boletin_id,
    naturaleza_proyecto: r.naturaleza_proyecto,
  }))
  return {
    id: row.id,
    secretario: row.secretario,
    director: row.director,
    fecha_publicacion: row.fecha_publicacion,
    cantidad_ingresados: row.cantidad_ingresados,
    cantidad_resolutivos: row.cantidad_resolutivos,
    filename: row.filename,
    url: row.url,
    proyectos_ingresados: proyectos,
    resolutivos_emitidos: resolutivos,
    año: row.año,
    mes: row.mes,
    procesado: row.procesado,
    fecha_limite_consulta: row.fecha_limite_consulta || null,
  }
}

export function useDashboardData() {
  const [data, setData] = useState<BoletinesData | null>(null)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = getInvestigacionClient()

        const { data: rows, error: queryError } = await supabase
          .from('boletines')
          .select(`
            *,
            proyectos_ingresados(*),
            boletines_resolutivos(*)
          `)
          .order('fecha_publicacion', { ascending: false })

        if (queryError) {
          throw new Error(queryError.message)
        }

        if (!rows || rows.length === 0) {
          throw new Error('No se encontraron boletines en la base de datos')
        }

        const boletines = rows.map(mapBoletin)
        const jsonData: BoletinesData = { boletines }

        setData(jsonData)

        const stats = getStats(jsonData)
        const timeSeriesData = getTimeSeriesData(jsonData)
        const municipiosData = getDistributionByMunicipio(jsonData)
        const girosData = getDistributionByGiro(jsonData)
        const proyectos = getAllProyectos(jsonData)
        const resolutivos = getAllResolutivos(jsonData)

        const processed: ProcessedData = {
          stats,
          timeSeriesData,
          municipiosData,
          girosData,
          proyectos,
          resolutivos,
          metadata: {
            totalBoletines: jsonData.boletines.length,
            totalProyectos: proyectos.length,
            totalResolutivos: resolutivos.length,
            lastUpdated: getLatestBoletinDate(jsonData.boletines),
          },
        }

        setProcessedData(processed)
        setLoading(false)
      } catch (err) {
        if (err instanceof Error) {
          setError(`Error al cargar los datos: ${err.message}`)
        } else {
          setError('Error desconocido al cargar los datos.')
        }
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return {
    data,
    processedData,
    loading,
    error,
  }
}
