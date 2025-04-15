"use client"

import { useState } from "react"
import { ImageIcon, Info } from "lucide-react"

export function ImageUploadHelp() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-3 text-left">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-blue-600" />
          <h3 className="font-medium text-blue-800">Cómo usar imágenes en la documentación</h3>
        </div>
        <span className="text-blue-600">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-blue-200">
          <div className="mb-3">
            <h4 className="font-medium text-slate-700 mb-1">Insertar imágenes</h4>
            <p className="text-sm text-slate-600">Puedes insertar imágenes en tu documentación de dos formas:</p>
            <ul className="list-disc pl-5 mt-1 text-sm text-slate-600">
              <li>
                <strong>Imágenes normales:</strong> Usa la sintaxis{" "}
                <code className="bg-slate-100 px-1 rounded">![Texto alternativo](URL de la imagen)</code>
              </li>
              <li>
                <strong>Imágenes en modal:</strong> Usa la sintaxis{" "}
                <code className="bg-slate-100 px-1 rounded">![Texto alternativo](URL de la imagen){"{modal}"}</code>
              </li>
            </ul>
          </div>

          <div className="mb-3">
            <h4 className="font-medium text-slate-700 mb-1">Subir imágenes</h4>
            <p className="text-sm text-slate-600">
              Para subir una imagen, haz clic en el botón <ImageIcon size={14} className="inline" /> en la barra de
              herramientas del editor de documentación.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 mb-1">Ejemplo</h4>
            <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
              # Documentación con imágenes Aquí hay una imagen normal: ![Logo de la
              empresa](https://ejemplo.com/logo.png) Y aquí hay una imagen que se abre en modal al hacer clic:
              ![Diagrama de flujo](https://ejemplo.com/diagrama.png){"{modal}"}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
