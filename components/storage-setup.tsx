"use client"

import { useEffect, useState } from "react"
import { setupStorageBucket } from "@/app/actions/storage-setup"
import { useToast } from "@/hooks/use-toast"

export function StorageSetup() {
  const [isSetup, setIsSetup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const setup = async () => {
      try {
        const result = await setupStorageBucket()

        if (result.success) {
          setIsSetup(true)
          console.log("Storage setup complete:", result.message)
        } else {
          console.error("Storage setup failed:", result.error)
          toast({
            title: "Error en la configuración de almacenamiento",
            description: result.error || "No se pudo configurar el almacenamiento para imágenes.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Storage setup error:", error)
      }
    }

    setup()
  }, [toast])

  return null // This component doesn't render anything
}
