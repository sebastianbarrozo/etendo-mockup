"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ImageModalProps {
  imageUrl: string
  alt?: string
  onClose: () => void
}

export function ImageModal({ imageUrl, alt = "Image", onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => setLoading(false)
    img.onerror = () => {
      setLoading(false)
      setError("Failed to load image")
    }
  }, [imageUrl])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="bg-blue-900 text-white p-2 flex items-center justify-between">
          <h2 className="text-lg font-medium truncate">{alt || "Image"}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-blue-800 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-blue-800 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleRotate}
              className="p-1.5 rounded hover:bg-blue-800 text-slate-300 hover:text-white"
              title="Rotate"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-blue-800 text-slate-300 hover:text-white"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="overflow-auto w-full h-full flex items-center justify-center">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={alt}
                className="max-w-full max-h-full object-contain transition-all duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
