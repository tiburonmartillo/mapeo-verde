
import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { X, ExternalLink } from "lucide-react"
import ReactMarkdown from "react-markdown"
import type { ProcessedGacetaAnalysis, RegistroGaceta } from '../hooks/useGacetasData'
import { FrogLoading } from './frog-loading'
import { getSemarnatEdgeFunctionUrl } from '../lib/supabase-data'

interface GacetaModalProps {
  gaceta: ProcessedGacetaAnalysis | null
  registro: RegistroGaceta | null
  isOpen: boolean
  onClose: () => void
}

interface SemarnatApiResponse {
  data?: any
  error?: string
  details?: string
  mensaje?: string
  detalle?: string
  resumen?: string
  estudio?: string
  resolutivo?: string
}

export function GacetaModal({ gaceta, registro, isOpen, onClose }: GacetaModalProps) {
  const [semarnatData, setSemarnatData] = useState<any>(null)
  const [loadingSemarnat, setLoadingSemarnat] = useState(false)
  const [errorSemarnat, setErrorSemarnat] = useState<string | null>(null)
  const [semarnatDataSource, setSemarnatDataSource] = useState<'api' | 'json' | null>(null)
  const [pdfResponseData, setPdfResponseData] = useState<{ [key: string]: any }>({})
  const [loadingPdf, setLoadingPdf] = useState<{ [key: string]: boolean }>({})
  const [historialData, setHistorialData] = useState<any>(null)
  const semarnatApiUrl = getSemarnatEdgeFunctionUrl()
  const [loadingHistorial, setLoadingHistorial] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)
  const [historialDataSource, setHistorialDataSource] = useState<'api' | 'json' | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const registroKeyRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const registroId = registro?.id
  const registroClave = registro?.clave_proyecto
  const registroKey = useMemo(() => {
    if (!registro) return null
    return `${registroId || registroClave || ''}-${registroClave || ''}`
  }, [registro, registroId, registroClave])

  const registroSemarnatData = registro?.semarnat_data
  const semarnatDataFromRegistro = useMemo(() => {
    if (!registroSemarnatData) return null
    if (registroSemarnatData.error) {
      return { error: registroSemarnatData.error, data: null }
    }
    if (registroSemarnatData.mensaje === 'error' && 
        !registroSemarnatData.resumen && 
        !registroSemarnatData.estudio && 
        !registroSemarnatData.resolutivo) {
      return { error: registroSemarnatData.detalle || 'Sin documentos disponibles', data: null }
    }
    return { error: null, data: registroSemarnatData }
  }, [registroSemarnatData])

  const semarnatHistorial = registro?.semarnat_historial
  const historialFromRegistro = useMemo(() => {
    if (!semarnatHistorial) return null
    const tieneHistorial = (semarnatHistorial.historial && 
                           Array.isArray(semarnatHistorial.historial) && 
                           semarnatHistorial.historial.length > 0) ||
                          (Array.isArray(semarnatHistorial) && 
                           semarnatHistorial.length > 0)
    if (tieneHistorial) {
      return { error: null, data: semarnatHistorial }
    }
    if (semarnatHistorial.error || 
        (semarnatHistorial.mensaje === 'error' && !tieneHistorial)) {
      return { 
        error: semarnatHistorial.detalle || 
               semarnatHistorial.error || 
               'No hay historial disponible', 
        data: null 
      }
    }
    return { error: null, data: semarnatHistorial }
  }, [semarnatHistorial])

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (!isOpen || !registro?.clave_proyecto) {
      setSemarnatData(null)
      setErrorSemarnat(null)
      setSemarnatDataSource(null)
      setLoadingSemarnat(false)
      return
    }
    if (registroKeyRef.current !== registroKey) {
      registroKeyRef.current = registroKey
      setPdfResponseData({})
      setLoadingPdf({})
    }
    const controller = new AbortController()
    abortControllerRef.current = controller
    const apiTimeoutId = setTimeout(() => controller.abort(), 6000)
    const fetchSemarnatData = async () => {
      setLoadingSemarnat(true)
      setErrorSemarnat(null)
      setSemarnatData(null)
      try {
        const response = await fetch(`${semarnatApiUrl}/proyecto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clave: registro.clave_proyecto }),
          signal: controller.signal
        })
        if (controller.signal.aborted) return
        const data: SemarnatApiResponse = await response.json()
        if (controller.signal.aborted) return
        if (response.ok && !data.error && (data.resumen || data.estudio || data.resolutivo)) {
          setSemarnatData(data)
          setErrorSemarnat(null)
          setSemarnatDataSource('api')
          setLoadingSemarnat(false)
          return
        }
        throw new Error(data.error || 'Petición rechazada')
      } catch (error: any) {
        if (error.name === 'AbortError') return
        if (semarnatDataFromRegistro) {
          if (semarnatDataFromRegistro.error) {
            setErrorSemarnat(semarnatDataFromRegistro.error)
            setSemarnatData(null)
            setSemarnatDataSource(null)
          } else {
            setSemarnatData(semarnatDataFromRegistro.data)
            setErrorSemarnat(null)
            setSemarnatDataSource('json')
          }
          setLoadingSemarnat(false)
          return
        }
        setErrorSemarnat('Error al conectar con el servicio de SEMARNAT')
        setSemarnatData(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSemarnat(false)
        }
      }
    }
    fetchSemarnatData()
    return () => {
      clearTimeout(apiTimeoutId)
      controller.abort()
    }
  }, [isOpen, registro?.clave_proyecto, registroKey, semarnatDataFromRegistro])

  const historialRegistroId = registro?.id
  const historialRegistroClave = registro?.clave_proyecto
  const historialNumBitacora =
    (registro as any)?.semarnat_proyecto?.tramite?.numBitacora ||
    (registro as any)?.semarnat_bitacora?.tramite?.numBitacora ||
    (registro as any)?.semarnat_proyecto_bitacora?.tramite?.numBitacora

  useEffect(() => {
    if (!isOpen || !registro) {
      setHistorialData(null)
      setErrorHistorial(null)
      setHistorialDataSource(null)
      setLoadingHistorial(false)
      return
    }
    const bitacoraParam = historialNumBitacora || historialRegistroId || historialRegistroClave
    if (!bitacoraParam) {
      setHistorialData(null)
      setErrorHistorial(null)
      setHistorialDataSource(null)
      setLoadingHistorial(false)
      return
    }
    const controller = new AbortController()
    const historialTimeoutId = setTimeout(() => controller.abort(), 6000)
    const fetchHistorialData = async () => {
      setLoadingHistorial(true)
      setErrorHistorial(null)
      setHistorialData(null)
      try {
        const response = await fetch(`${semarnatApiUrl}/historial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numBitacora: bitacoraParam }),
          signal: controller.signal
        })
        if (controller.signal.aborted) return
        const data = await response.json()
        if (controller.signal.aborted) return
        const tieneHistorial = (data.historial && Array.isArray(data.historial) && data.historial.length > 0) ||
                              (Array.isArray(data) && data.length > 0)
        if (response.ok && tieneHistorial) {
          setHistorialData(data)
          setErrorHistorial(null)
          setHistorialDataSource('api')
          setLoadingHistorial(false)
          return
        }
        throw new Error(data.error || data.mensaje || 'Petición rechazada')
      } catch (error: any) {
        if (error.name === 'AbortError') return
        if (historialFromRegistro) {
          if (historialFromRegistro.error) {
            setErrorHistorial(historialFromRegistro.error)
            setHistorialData(null)
            setHistorialDataSource(null)
          } else {
            setHistorialData(historialFromRegistro.data)
            setErrorHistorial(null)
            setHistorialDataSource('json')
          }
          setLoadingHistorial(false)
          return
        }
        setErrorHistorial('Error al conectar con el servicio de historial')
        setHistorialData(null)
      } finally {
        if (!controller.signal.aborted) {
          setLoadingHistorial(false)
        }
      }
    }
    fetchHistorialData()
    return () => {
      clearTimeout(historialTimeoutId)
      controller.abort()
    }
  }, [isOpen, registro, historialRegistroId, historialRegistroClave, historialNumBitacora, historialFromRegistro])

  const handlePdfDownload = useCallback(async (tipo: string, dataPath: string) => {
    setLoadingPdf(prev => ({ ...prev, [tipo]: true }))
    try {
      const response = await fetch(`${semarnatApiUrl}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: dataPath
      })
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/pdf')) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${tipo}_${registro?.clave_proyecto || 'documento'}.pdf`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
          setPdfResponseData(prev => ({
            ...prev,
            [tipo]: { tipo: 'PDF', tamaño: blob.size, descargado: true }
          }))
        } else {
          try {
            const data = await response.json()
            setPdfResponseData(prev => ({ ...prev, [tipo]: data }))
            if (data.url) {
              window.open(data.url, '_blank', 'noopener,noreferrer')
            }
          } catch {
            const text = await response.text()
            setPdfResponseData(prev => ({ ...prev, [tipo]: { respuesta: text } }))
          }
        }
      } else {
        const errorText = await response.text()
        setPdfResponseData(prev => ({ ...prev, [tipo]: { error: errorText, status: response.status } }))
      }
    } catch (error) {
      setPdfResponseData(prev => ({
        ...prev,
        [tipo]: { error: error instanceof Error ? error.message : 'Error desconocido' }
      }))
    } finally {
      setLoadingPdf(prev => ({ ...prev, [tipo]: false }))
    }
  }, [semarnatApiUrl, registro?.clave_proyecto])

  if (!gaceta || !isOpen) return null

  const fechaFormateada = (() => {
    try {
      const fecha = new Date(gaceta.fecha_publicacion)
      if (fecha.getMonth() === 0 && fecha.getDate() === 1) {
        if (fecha.getFullYear() === gaceta.año) {
          return `Año ${gaceta.año}`
        }
      }
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return `Año ${gaceta.año}`
    }
  })()

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 sm:p-8">
      <div className="fixed inset-0 -z-10 bg-black/75" onClick={onClose} />
      <div className="relative flex max-h-[95vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
              Gaceta Ecológica SEMARNAT {gaceta.gaceta_id ? `#${gaceta.gaceta_id}` : ''}
            </h2>
            <p className="mt-1 text-sm text-gray-500 sm:text-base">{fechaFormateada}</p>
          </div>
          <button
            onClick={onClose}
            className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="px-4 py-4 pb-16 sm:px-6 sm:pb-20">
            {registro && (
              <div>
                {/* Información del Registro */}
                <div className="mb-6">
                  <h3 className="mb-3 text-lg font-semibold sm:text-xl">Información del Registro</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Clave del Proyecto</span>
                      <p className="mb-2 text-sm font-medium">{registro.clave_proyecto || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Tipo de Registro</span>
                      <span className={`mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        registro.tipo_registro === 'resolutivo_emitido'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {registro.tipo_registro === 'proyecto_ingresado' ? 'Proyecto Ingresado' : 
                         registro.tipo_registro === 'resolutivo_emitido' ? 'Resolutivo Emitido' :
                         registro.tipo_registro === 'tramite_unificado' ? 'Trámite Unificado' :
                         registro.tipo_registro}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="mb-1 block text-xs text-gray-500">Nombre del Proyecto</span>
                      <p className="mb-2 text-sm">{registro.proyecto_nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Promovente</span>
                      <p className="mb-2 text-sm">{registro.promovente || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Modalidad</span>
                      <p className="mb-2 text-sm">{registro.modalidad || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Entidad</span>
                      <p className="mb-2 text-sm">{registro.entidad || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Municipio</span>
                      <p className="mb-2 text-sm">{registro.municipio || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Tipo de Proyecto</span>
                      <p className="mb-2 text-sm">{registro.tipo_proyecto || 'N/A'}</p>
                    </div>
                    {registro.fecha_ingreso && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Fecha de Ingreso</span>
                        <p className="mb-2 text-sm">
                          {new Date(registro.fecha_ingreso).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {registro.fecha_resolucion && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Fecha de Resolución</span>
                        <p className="mb-2 text-sm">
                          {new Date(registro.fecha_resolucion).toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {registro.estatus && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Estatus</span>
                        <span className={`mb-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          registro.estatus === 'autorizado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {registro.estatus}
                        </span>
                      </div>
                    )}
                    {registro.vigencia?.texto_completo && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Vigencia</span>
                        <p className="mb-2 text-sm">{registro.vigencia.texto_completo}</p>
                      </div>
                    )}
                    {registro.superficie && (registro.superficie.total_hectareas || registro.superficie.cambio_uso_suelo_hectareas) && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Superficie</span>
                        <p className="mb-2 text-sm">
                          {registro.superficie.total_hectareas ? `${registro.superficie.total_hectareas} ha` : ''}
                          {registro.superficie.cambio_uso_suelo_hectareas && (
                            <> (Cambio de uso: {registro.superficie.cambio_uso_suelo_hectareas} ha)</>
                          )}
                        </p>
                      </div>
                    )}
                    {registro.vegetacion?.tipo && (
                      <div>
                        <span className="mb-1 block text-xs text-gray-500">Vegetación</span>
                        <p className="mb-2 text-sm">
                          {registro.vegetacion.tipo}
                          {registro.vegetacion.remocion && ` - Remoción: ${registro.vegetacion.remocion}`}
                        </p>
                      </div>
                    )}
                    {registro.ubicacion_especifica && (
                      <div className="md:col-span-2">
                        <span className="mb-1 block text-xs text-gray-500">Ubicación Específica</span>
                        <p className="mb-2 text-sm">{registro.ubicacion_especifica}</p>
                      </div>
                    )}
                    {registro.descripcion && (
                      <div className="md:col-span-2">
                        <span className="mb-1 block text-xs text-gray-500">Descripción</span>
                        <p className="mb-2 whitespace-pre-wrap text-justify text-sm">{registro.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Documentos SEMARNAT */}
                <div className="mb-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">Documentos del Sistema SEMARNAT</h3>
                      {semarnatDataSource && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          semarnatDataSource === 'api' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {semarnatDataSource === 'api' ? 'API' : 'JSON'}
                        </span>
                      )}
                    </div>
                    {registro?.clave_proyecto && (
                      <button
                        onClick={() => {
                          const consultaUrl = `https://app.semarnat.gob.mx/consulta-tramite/#/portal-consulta?clave=${encodeURIComponent(registro.clave_proyecto)}`
                          window.open(consultaUrl, '_blank', 'noopener,noreferrer')
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Consultar en SEMARNAT
                      </button>
                    )}
                  </div>

                  {loadingSemarnat && (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FrogLoading fullScreen={false} size={80} message="Cargando documentos del sistema SEMARNAT..." className="min-h-0" />
                    </div>
                  )}

                  {errorSemarnat && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-medium">Advertencia:</span> {errorSemarnat}
                    </div>
                  )}

                  {semarnatData && !loadingSemarnat && (
                    <div>
                      {semarnatData.resumen || semarnatData.estudio || semarnatData.resolutivo ? (
                        <div className="mb-4">
                          <p className="mb-3 text-sm font-medium text-gray-500">Documentos Disponibles</p>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {semarnatData.resumen && (
                              <button
                                onClick={() => handlePdfDownload('resumen', semarnatData.resumen)}
                                disabled={loadingPdf['resumen']}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {loadingPdf['resumen'] ? <FrogLoading iconOnly size={18} /> : <ExternalLink className="h-4 w-4" />}
                                {loadingPdf['resumen'] ? 'Cargando...' : 'Resumen PDF'}
                              </button>
                            )}
                            {semarnatData.estudio && (
                              <button
                                onClick={() => handlePdfDownload('estudio', semarnatData.estudio)}
                                disabled={loadingPdf['estudio']}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {loadingPdf['estudio'] ? <FrogLoading iconOnly size={18} /> : <ExternalLink className="h-4 w-4" />}
                                {loadingPdf['estudio'] ? 'Cargando...' : 'Estudio PDF'}
                              </button>
                            )}
                            {semarnatData.resolutivo && (
                              <button
                                onClick={() => handlePdfDownload('resolutivo', semarnatData.resolutivo)}
                                disabled={loadingPdf['resolutivo']}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {loadingPdf['resolutivo'] ? <FrogLoading iconOnly size={18} /> : <ExternalLink className="h-4 w-4" />}
                                {loadingPdf['resolutivo'] ? 'Cargando...' : 'Resolutivo PDF'}
                              </button>
                            )}
                          </div>

                          {Object.keys(pdfResponseData).length > 0 && (
                            <div className="mt-4">
                              <p className="mb-2 text-sm font-medium text-gray-500">Respuestas de las Peticiones PDF</p>
                              {Object.entries(pdfResponseData).map(([tipo, data]) => (
                                <div key={tipo} className="mb-3">
                                  <span className="mb-1 block text-xs font-medium text-gray-700">
                                    {tipo === 'resumen' ? 'Resumen' : tipo === 'estudio' ? 'Estudio' : 'Resolutivo'}:
                                  </span>
                                  <div className="max-h-[200px] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <pre className="m-0 whitespace-pre-wrap break-all font-mono text-xs">
                                      {JSON.stringify(data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                          Sin documentos disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Historial del Trámite */}
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-lg font-semibold sm:text-xl">Historial del Trámite</h3>
                    {historialDataSource && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        historialDataSource === 'api' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {historialDataSource === 'api' ? 'API' : 'JSON'}
                      </span>
                    )}
                  </div>

                  {loadingHistorial && (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <FrogLoading fullScreen={false} size={80} message="Cargando historial..." className="min-h-0" />
                    </div>
                  )}

                  {errorHistorial && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-medium">Advertencia:</span> {errorHistorial}
                    </div>
                  )}

                  {((historialData?.historial && Array.isArray(historialData.historial) && historialData.historial.length > 0) || 
                    (Array.isArray(historialData) && historialData.length > 0)) ? (
                    <div className="max-h-[400px] overflow-auto border border-gray-200">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-blue-900/5">
                            <th className="w-[60px] px-3 py-2 text-left text-sm font-bold">No.</th>
                            <th className="whitespace-nowrap px-3 py-2 text-left text-sm font-bold">Fecha</th>
                            <th className="px-3 py-2 text-left text-sm font-bold">Descripción de la Situación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(historialData?.historial || (Array.isArray(historialData) ? historialData : [])).map((item: any, index: number) => (
                            <tr key={index} className="border-b border-gray-100 text-sm transition-colors hover:bg-black/[0.03]">
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="whitespace-nowrap px-3 py-2">{item.historialFechaTurn || item.fecha || item.historialFecha || 'N/A'}</td>
                              <td className="px-3 py-2">{item.descipcionSituacion || item.descripcion || item.situacion || item.descpicionSituacion || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : historialData && !errorHistorial && historialData.mensaje === 'error' && !historialData.historial ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      No hay historial disponible para este trámite.
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Palabras Clave */}
            {gaceta.palabras_clave_encontradas.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">Palabras Clave</p>
                <div className="flex flex-wrap gap-2">
                  {gaceta.palabras_clave_encontradas.map((palabra, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                      {palabra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Páginas */}
            {gaceta.paginas.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">Páginas mencionadas</p>
                <div className="flex flex-wrap gap-2">
                  {gaceta.paginas.map((pagina, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700">
                      Página {pagina}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <hr className="my-6 border-gray-200" />

            {/* Resumen */}
            <div>
              <h3 className="mb-3 text-sm font-semibold sm:text-base">Resumen</h3>
              {gaceta.resumen ? (
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-900"
                  style={{
                    lineHeight: 1.7,
                  }}
                >
                  <ReactMarkdown>{gaceta.resumen}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm italic text-gray-500">Sin resumen disponible</p>
              )}
            </div>
          </div>

          {/* Floating Button */}
          <div className="sticky bottom-0 left-0 right-0 z-20 flex justify-center border-t border-gray-200 bg-white px-4 py-3 shadow-lg">
            <button
              onClick={() => window.open(gaceta.url, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg sm:px-8 sm:py-3"
            >
              <ExternalLink className="h-4 w-4" />
              Consultar Gaceta Original
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
