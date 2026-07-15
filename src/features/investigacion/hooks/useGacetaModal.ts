'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getInvestigacionClient } from '../lib/supabase-data'
import type { ProcessedGacetaAnalysis } from './useGacetasData'
import type { RegistroGaceta } from './useGacetasData'

// Cache de gacetas para evitar múltiples queries
let gacetasCache: any[] | null = null
let gacetasPromise: Promise<any[]> | null = null

async function fetchGacetas(): Promise<any[]> {
  if (gacetasCache) return gacetasCache
  if (gacetasPromise) return gacetasPromise

  gacetasPromise = (async () => {
    const supabase = getInvestigacionClient()
    const { data: jsonRow, error } = await supabase
      .from('gacetas_json')
      .select('data')
      .eq('id', 1)
      .single()
    if (error) throw new Error(error.message)
    const rawData = jsonRow?.data as any
    const analyses = rawData?.analyses || []
    gacetasCache = analyses
    return gacetasCache
  })()

  return gacetasPromise
}

function normalizeFecha(gaceta: any): string {
  if (gaceta.fecha_publicacion) {
    return gaceta.fecha_publicacion
  }
  return `${gaceta.año}-01-01`
}

export function useGacetaModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedGaceta, setSelectedGaceta] = useState<ProcessedGacetaAnalysis | null>(null)
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroGaceta | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const gacetaId = urlParams.get('gaceta')
      const registroId = urlParams.get('registro')
      if (gacetaId) {
        if (registroId) {
          loadGacetaDataWithRegistro(gacetaId, parseInt(registroId))
        } else {
          loadGacetaData(gacetaId)
        }
      }
    }
  }, [])

  const loadGacetaDataWithRegistro = useCallback(async (gacetaId: string, registroId: number) => {
    try {
      const rows = await fetchGacetas()
      const gaceta = rows.find((g: any) => g.gaceta_id === gacetaId)
      if (gaceta) {
        let registroEncontrado: RegistroGaceta | null = null
        const registros = gaceta.analisis_completo?.registros || []
        registroEncontrado = registros.find((r: any) => r.id_db === registroId) || null

        setSelectedGaceta({
          ...gaceta,
          fecha_publicacion: normalizeFecha(gaceta),
        } as ProcessedGacetaAnalysis)
        setSelectedRegistro(registroEncontrado as unknown as RegistroGaceta)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Error cargando datos de la gaceta:', error)
    }
  }, [])

  const loadGacetaData = useCallback(async (gacetaId: string) => {
    try {
      const rows = await fetchGacetas()
      const gaceta = rows.find((g: any) => g.gaceta_id === gacetaId)
      if (gaceta) {
        setSelectedGaceta({
          ...gaceta,
          fecha_publicacion: normalizeFecha(gaceta),
        } as ProcessedGacetaAnalysis)
        setIsOpen(true)
      } else {
        console.warn(`Gaceta con ID ${gacetaId} no encontrada`)
      }
    } catch (error) {
      console.error('Error cargando datos de la gaceta:', error)
    }
  }, [])

  const openModal = useCallback((gaceta: ProcessedGacetaAnalysis, registro?: RegistroGaceta | null) => {
    setSelectedGaceta(gaceta)
    setSelectedRegistro(registro || null)
    setIsOpen(true)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('gaceta', gaceta.gaceta_id)
      if (registro?.id_db) {
        url.searchParams.set('registro', registro.id_db.toString())
      }
      window.history.pushState({}, '', url.toString())
    }
  }, [])

  const openModalByUrl = useCallback((gacetaUrl: string, registro?: RegistroGaceta | null) => {
    loadGacetaByUrl(gacetaUrl, registro)
  }, [])

  const openModalWithRegistro = useCallback(async (gacetaUrl: string, registroId: number) => {
    try {
      const rows = await fetchGacetas()
      const gaceta = rows.find((g: any) => g.url === gacetaUrl)
      if (!gaceta) return

      let registroEncontrado: RegistroGaceta | null = null
      const registros = gaceta.analisis_completo?.registros || []
      registroEncontrado = registros.find((r: any) => r.id_db === registroId) || null

      setSelectedGaceta({
        ...gaceta,
        fecha_publicacion: normalizeFecha(gaceta),
      } as ProcessedGacetaAnalysis)
      setSelectedRegistro(registroEncontrado as unknown as RegistroGaceta)
      setIsOpen(true)

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set('gaceta', gaceta.gaceta_id)
        if (registroEncontrado?.id_db) {
          url.searchParams.set('registro', registroEncontrado.id_db.toString())
        }
        window.history.pushState({}, '', url.toString())
      }
    } catch (error) {
      console.error('Error cargando datos de la gaceta con registro:', error)
    }
  }, [])

  const loadGacetaByUrl = useCallback(async (gacetaUrl: string, registro?: RegistroGaceta | null) => {
    try {
      const rows = await fetchGacetas()
      const gaceta = rows.find((g: any) => g.url === gacetaUrl)
      if (gaceta) {
        setSelectedGaceta({
          ...gaceta,
          fecha_publicacion: normalizeFecha(gaceta),
        } as ProcessedGacetaAnalysis)
        setSelectedRegistro(registro || null)
        setIsOpen(true)

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.set('gaceta', gaceta.gaceta_id)
          if (registro?.id_db) {
            url.searchParams.set('registro', registro.id_db.toString())
          }
          window.history.pushState({}, '', url.toString())
        }
      }
    } catch (error) {
      console.error('Error cargando datos de la gaceta por URL:', error)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setSelectedGaceta(null)
    setSelectedRegistro(null)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('gaceta')
      url.searchParams.delete('registro')
      window.history.pushState({}, '', url.toString())
    }
  }, [])

  return {
    isOpen,
    selectedGaceta,
    selectedRegistro,
    openModal,
    openModalByUrl,
    openModalWithRegistro,
    closeModal,
  }
}
