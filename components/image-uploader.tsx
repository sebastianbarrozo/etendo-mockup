"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage } from "@/app/actions/image-actions"
import { useToast } from "@/hooks/use-toast"

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string, fileName: string) => void
  buttonText?: string
  className?: string
}

export function ImageUploader({ onImageUploaded, buttonText = "Subir imagen", className = "" }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload the file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadImage(formData)

      if (result.success && result.url) {
        toast({
          title: "Imagen subida correctamente",
          description: `${file.name} se ha subido correctamente.`,
          variant: "success",
        })
        onImageUploaded(result.url, file.name)
      } else {
        toast({
          title: "Error al subir la imagen",
          description: result.error || "Ha ocurrido un error al subir la imagen.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error al subir la imagen",
        description: (error as Error).message || "Ha ocurrido un error al subir la imagen.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCancelPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        disabled={isUploading}
      />

      {previewUrl && !isUploading ? (
        <div className="relative mb-3">
          <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-40 max-w-full rounded-md" />
          <button
            onClick={handleCancelPreview}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {isUploading ? "Subiendo..." : buttonText}
      </Button>
    </div>
  )
}
