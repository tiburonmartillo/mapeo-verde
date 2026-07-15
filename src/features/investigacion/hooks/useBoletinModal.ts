'use client'

import { useState } from 'react'
import { Boletin } from '../lib/types'

export function useBoletinModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedBoletin, setSelectedBoletin] = useState<Boletin | null>(null)

  const openModal = (boletin: Boletin) => {
    setSelectedBoletin(boletin)
    setIsOpen(true)
    // Actualizar la URL para incluir el parámetro del boletín
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('boletin', boletin.id.toString())
      window.history.pushState({}, '', url.toString())
    }
  }

  const closeModal = () => {
    setIsOpen(false)
    setSelectedBoletin(null)
    // Remover el parámetro de boletín de la URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('boletin')
      window.history.pushState({}, '', url.toString())
    }
  }

  return {
    isOpen,
    selectedBoletin,
    openModal,
    closeModal
  }
}
