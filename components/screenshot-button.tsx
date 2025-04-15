"use client"

import type React from "react"

import { useState } from "react"
import { Camera } from "lucide-react"
import html2canvas from "html2canvas"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ScreenshotButtonProps {
  targetRef: React.RefObject<HTMLElement>
  filename?: string
  quality?: number
}

export function ScreenshotButton({
  targetRef,
  filename = "screenshot.png",
  quality = 2, // Higher value = better quality but larger file size
}: ScreenshotButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const { toast } = useToast()

  const captureScreenshot = async () => {
    if (!targetRef.current || isCapturing) return

    try {
      setIsCapturing(true)

      // Show toast for starting capture
      toast({
        title: "Capturando pantalla completa...",
        description: "Por favor espere mientras generamos la imagen.",
      })

      // Store original scroll position and styles
      const originalScrollTop = targetRef.current.scrollTop
      const originalScrollLeft = targetRef.current.scrollLeft
      const originalOverflow = targetRef.current.style.overflow
      const originalHeight = targetRef.current.style.height
      const originalMaxHeight = targetRef.current.style.maxHeight

      // Temporarily modify the element to capture everything
      targetRef.current.style.overflow = "visible"
      targetRef.current.style.height = "auto"
      targetRef.current.style.maxHeight = "none"

      // Force a small delay to ensure styles are applied
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Capture the target element with full content
      const canvas = await html2canvas(targetRef.current, {
        scale: quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#f8fafc", // Tailwind slate-50
        logging: false,
        windowHeight: targetRef.current.scrollHeight,
        windowWidth: targetRef.current.scrollWidth,
        height: targetRef.current.scrollHeight,
        width: targetRef.current.scrollWidth,
        x: 0,
        y: 0,
        onclone: (document, element) => {
          // Add a class to the cloned element to ensure proper styling during capture
          element.classList.add("screenshot-capture")
          element.style.overflow = "visible"
          element.style.height = "auto"
          element.style.maxHeight = "none"
        },
      })

      // Restore original styles
      targetRef.current.style.overflow = originalOverflow
      targetRef.current.style.height = originalHeight
      targetRef.current.style.maxHeight = originalMaxHeight
      targetRef.current.scrollTop = originalScrollTop
      targetRef.current.scrollLeft = originalScrollLeft

      // Convert to image and download
      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = filename
      link.click()

      // Show success toast
      toast({
        title: "¡Captura completada!",
        description: `Guardado como ${filename}`,
        variant: "success",
      })
    } catch (error) {
      console.error("Error capturing screenshot:", error)
      toast({
        title: "Error en la captura",
        description: "Hubo un error al capturar la pantalla completa.",
        variant: "destructive",
      })
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={captureScreenshot}
            disabled={isCapturing}
            className={`bg-blue-700 hover:bg-blue-800 text-white border-blue-600 ${
              isCapturing ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Camera size={16} className="mr-1" />
            {isCapturing ? "Capturando..." : "Capturar Todo"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Capturar una imagen completa del mockup (incluye contenido no visible)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
