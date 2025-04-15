"use client"

import { useState, useCallback } from "react"
import { MockupModal } from "@/components/mockup-modal"

interface MockupModalManagerProps {
  initialMockupId?: string
}

export function MockupModalManager({ initialMockupId }: MockupModalManagerProps) {
  const [modalStack, setModalStack] = useState<string[]>(initialMockupId ? [initialMockupId] : [])

  const openModal = useCallback((mockupId: string) => {
    setModalStack((prev) => [...prev, mockupId])
  }, [])

  const closeTopModal = useCallback(() => {
    setModalStack((prev) => prev.slice(0, -1))
  }, [])

  // This will be passed down to components that need to open modals
  const modalContext = {
    openModal,
    closeModal: closeTopModal,
  }

  if (modalStack.length === 0) {
    return null
  }

  return (
    <>
      {modalStack.map((mockupId, index) => (
        <MockupModal key={`${mockupId}-${index}`} mockupId={mockupId} onClose={closeTopModal} isNested={index > 0} />
      ))}
    </>
  )
}
