
import { useEffect } from 'react'
import { Button } from './ui/button'
import { BoletinSummary } from './boletin-summary'
import { Boletin } from '../lib/types'
import { formatearFechaCorta } from '../lib/boletin-utils'

interface BoletinModalProps {
  boletin: Boletin | null
  isOpen: boolean
  onClose: () => void
}

export function BoletinModal({ boletin, isOpen, onClose }: BoletinModalProps) {

  // Manejar escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!boletin) return null

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black opacity-75"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0 bg-white z-10">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  Resumen Boletín #{boletin.id}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  {boletin.fecha_publicacion ? 
                    formatearFechaCorta(boletin.fecha_publicacion) : 'Fecha no disponible'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="p-3 sm:p-4 md:p-6 pb-20 sm:pb-24">
                <BoletinSummary
                  boletin={boletin}
                  showPrintButton={false}
                  showDownloadButton={false}
                  staticMode={false}
                />
              </div>
              
              {/* Floating Button - Always Visible */}
              {boletin.url && (
                <div className="sticky bottom-4 left-0 right-0 flex justify-center z-20 px-4 pointer-events-none">
                  <Button
                    variant="default"
                    onClick={() => window.open(boletin.url, '_blank', 'noopener,noreferrer')}
                    className="bg-[var(--color-section-accent)] hover:bg-[var(--color-section-accent-hover)] text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all pointer-events-auto"
                  >
                    📄 Consultar Boletín Original
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
