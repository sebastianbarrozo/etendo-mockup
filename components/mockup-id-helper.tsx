"use client"

import { useState, useEffect } from "react"
import { getAllMockups } from "@/app/actions/mockup-actions"
import { Copy, Check, RefreshCw } from "lucide-react"

interface MockupIdHelperProps {
  onSelectId?: (id: string) => void
}

export function MockupIdHelper({ onSelectId }: MockupIdHelperProps) {
  const [mockups, setMockups] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchMockups = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAllMockups()

      if (result.success && result.mockups) {
        setMockups(result.mockups)
      } else {
        setError(result.error || "Failed to load mockups")
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMockups()
  }, [])

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSelectId = (id: string) => {
    if (onSelectId) {
      onSelectId(id)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm">
      <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700">Mockups Disponibles</h3>
        <button
          onClick={fetchMockups}
          className="p-1 hover:bg-slate-200 rounded text-slate-600"
          disabled={loading}
          title="Refrescar lista"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {error ? (
          <div className="p-3 text-red-600 text-sm">{error}</div>
        ) : mockups.length === 0 ? (
          <div className="p-3 text-slate-500 text-sm italic">
            {loading ? "Cargando mockups..." : "No hay mockups disponibles"}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mockups.map((mockup) => (
              <li key={mockup.id} className="p-2 hover:bg-slate-50 flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">{mockup.title}</div>
                  <div className="text-xs text-slate-500">{mockup.id}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyId(mockup.id)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="Copiar ID"
                  >
                    {copiedId === mockup.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleSelectId(mockup.id)}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600 text-xs font-medium"
                  >
                    Usar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-slate-50 p-2 border-t border-slate-200 text-xs text-slate-500">
        Para enlazar a un mockup, usa <code className="bg-slate-100 px-1 rounded">[mockup:ID]</code>
      </div>
    </div>
  )
}
