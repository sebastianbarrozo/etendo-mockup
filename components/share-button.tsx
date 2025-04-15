"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
  mockupUrl: string | null
}

export function ShareButton({ mockupUrl }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyUrl = async () => {
    if (!mockupUrl) return

    try {
      await navigator.clipboard.writeText(mockupUrl)
      setIsCopied(true)

      toast({
        title: "¡URL copiada!",
        description: "La URL del mockup ha sido copiada al portapapeles.",
        variant: "success",
      })

      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar la URL al portapapeles.",
        variant: "destructive",
      })
    }
  }

  if (!mockupUrl) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyUrl}
            className="bg-blue-700 hover:bg-blue-800 text-white border-blue-600"
          >
            {isCopied ? (
              <>
                <Check size={16} className="mr-1" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1" />
                Compartir
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copiar URL para compartir</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
