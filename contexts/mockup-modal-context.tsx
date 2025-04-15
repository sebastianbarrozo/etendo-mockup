"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { MockupModal } from "@/components/mockup-modal"

interface MockupModalContextType {
  openModal: (mockupId: string) => void
  closeModal: () => void
}

const MockupModalContext = createContext<MockupModalContextType | undefined>(undefined)

export function useMockupModal() {
  const context = useContext(MockupModalContext)
  if (!context) {
    throw new Error("useMockupModal must be used within a MockupModalProvider")
  }
  return context
}

interface MockupModalProviderProps {
  children: ReactNode
}

export function MockupModalProvider({ children }: MockupModalProviderProps) {
  const [modalStack, setModalStack] = useState<string[]>([])

  const openModal = useCallback((mockupId: string) => {
    setModalStack((prev) => [...prev, mockupId])
  }, [])

  const closeModal = useCallback(() => {
    setModalStack((prev) => prev.slice(0, -1))
  }, [])

  return (
    <MockupModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalStack.map((mockupId, index) => (
        <MockupModal key={`${mockupId}-${index}`} mockupId={mockupId} onClose={closeModal} isNested={index > 0} />
      ))}
    </MockupModalContext.Provider>
  )
}
