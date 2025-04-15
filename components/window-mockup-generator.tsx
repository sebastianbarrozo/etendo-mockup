"use client"

import { useState, useEffect, useRef } from "react"
import { Resizable } from "re-resizable"
import { Split } from "@/components/split"
import { MockupViewToggle } from "@/components/mockup-view-toggle"
import { MarkupEditor } from "@/components/markup-editor"
import { EnhancedMarkdownEditor } from "@/components/enhanced-markdown-editor"
import { parseWindowMarkup } from "@/lib/markup-parser"
import { ScreenshotButton } from "@/components/screenshot-button"
import { ShareButton } from "@/components/share-button"
import { useToast } from "@/hooks/use-toast"
import type { WindowStructure } from "@/lib/types"
import { saveMockup, updateMockup } from "@/app/actions/mockup-actions"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PlusCircle, Save, Edit, Eye, Info, ExternalLink, FileText, Code } from "lucide-react"
import { MockupIdHelper } from "@/components/mockup-id-helper"
import { StorageSetup } from "@/components/storage-setup"
import { ImageModal } from "@/components/image-modal"

const DEFAULT_MARKUP = `# PEDIDO DE VENTA - 1000360 - 11-04-2025
> [!NOTE] Esta ventana muestra los detalles de un pedido de venta

## Datos Principales [AÑADIR COBRO] [CERRAR]
- ID: 1
> [!TIP] Los datos principales incluyen información del cliente y detalles del pedido
- Organización: F&B España - Región Norte
- Nº documento: 1000360
- Documento transacción: Standard Order
- Fecha de pedido: 11-04-2025
- Tercero: Hoteles Buenas Noches, S.A.
- Dirección: Av. de las Fuentes, 55
- Importe total: 4.84
- Moneda: EUR
- Estado doc: Registrado

- ID: 2
- Organización: F&B España - Región Sur
- Nº documento: 1000361 [mockup:abc123]
> [!TIP] Este es un pedido en estado borrador. Haz clic para ver detalles.
- Documento transacción: Standard Order
- Fecha de pedido: 12-04-2025
- Tercero: Restaurante El Mirador
- Dirección: Calle Mayor, 28
- Importe total: 156.50
- Moneda: EUR
- Estado doc: Borrador

- ID: 3
- Organización: F&B España - Región Este
- Nº documento: 1000362
- Documento transacción: Standard Order
- Fecha de pedido: 13-04-2025
- Tercero: Cafetería Central
- Dirección: Plaza España, 5
- Importe total: 78.25
- Moneda: EUR
- Estado doc: Registrado

### LÍNEAS - 1000360 - 11-04-2025 [Añadir Línea] [Eliminar]
- Línea: 1
- Producto: Albahaca
- Cant. pedido: 2
> [!WARNING] Verificar disponibilidad en almacén
- Unidad: Unidad
- Precio unitario: 2.00
- Imp. línea: 4.00
- Impuesto: Entregas IVA 21%

- Línea: 2
- Producto: Tomate
- Cant. pedido: 5
- Unidad: Kg
- Precio unitario: 1.50
- Imp. línea: 7.50
> [!TIP] Precio especial por temporada
- Impuesto: Entregas IVA 10%

- Línea: 3
- Producto: Aceite de oliva [mockup:def456]
- Cant. pedido: 1
- Unidad: Litro
- Precio unitario: 8.75
- Imp. línea: 8.75
- Impuesto: Entregas IVA 10%

### DESCUENTOS [Añadir Descuento]
> [!NOTE] Los descuentos se aplican al total del pedido

### IMPUESTO [Recalcular]
> [!TIP] El sistema recalcula automáticamente los impuestos al cambiar las líneas

### PLAN DE COBRO [Generar Plan]

#### LÍNEA DE IMPUESTO [Editar]
> [!WARNING] Modificar los impuestos puede afectar a la contabilidad
- ID: 1
- Tipo: IVA
- Base: 20.25
- Porcentaje: 21%
- Importe: 4.25

#### INTRASTAT [Exportar]
- ID: 1
- País: España
- Región: Madrid
- Peso: 2.5
- Unidades: 8

#### STOCK RESERVADO [Reservar]
- ID: 1
- Almacén: Principal
- Cantidad: 8
- Estado: Pendiente
- Fecha: 15-04-2025`

const DEFAULT_DOCUMENTATION = `# Pedido de Venta

## Descripción General
Este mockup representa la ventana de **Pedido de Venta** en el sistema Etendo. Permite gestionar pedidos de clientes, incluyendo líneas de pedido, impuestos y plan de cobro.

## Funcionalidad Principal
- Visualización de datos del pedido
- Gestión de líneas de pedido
- Cálculo automático de impuestos
- Generación de plan de cobro

## Casos de Uso
1. **Creación de nuevo pedido**: El usuario puede crear un nuevo pedido seleccionando un cliente y añadiendo productos.
2. **Modificación de pedido existente**: El usuario puede modificar cantidades, precios o añadir/eliminar líneas.
3. **Consulta de pedidos**: Visualización de pedidos existentes y su estado.

## Notas Técnicas
- Los pedidos se almacenan en la tabla \`C_Order\`
- Las líneas de pedido se almacenan en la tabla \`C_OrderLine\`
- Los impuestos se calculan automáticamente según la configuración del producto y el cliente

## Campos Importantes
| Campo | Descripción |
|-------|-------------|
| Nº documento | Identificador único del pedido |
| Tercero | Cliente que realiza el pedido |
| Fecha de pedido | Fecha en que se registra el pedido |
| Estado doc | Estado actual del pedido (Borrador, Registrado, etc.) |

![Diagrama de flujo](https://example.com/diagrama-flujo.png)
`

interface WindowMockupGeneratorProps {
  initialMarkup?: string
  initialTitle?: string
  initialDocumentation?: string
  mockupId?: string
  readOnly?: boolean
}

export function WindowMockupGenerator({
  initialMarkup = DEFAULT_MARKUP,
  initialTitle = "Mi Mockup",
  initialDocumentation = DEFAULT_DOCUMENTATION,
  mockupId = null,
  readOnly = false,
}: WindowMockupGeneratorProps) {
  const [markup, setMarkup] = useState(initialMarkup)
  const [documentation, setDocumentation] = useState(initialDocumentation)
  const [windowStructure, setWindowStructure] = useState<WindowStructure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mockupTitle, setMockupTitle] = useState(initialTitle)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(!readOnly)
  const [showLinkHelp, setShowLinkHelp] = useState(false)
  const [showIdHelper, setShowIdHelper] = useState(false)
  const [activeTab, setActiveTab] = useState<"markup" | "documentation">("markup")
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImage, setCurrentImage] = useState<{ url: string; alt: string } | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Initialize storage bucket
  useEffect(() => {
    // This component doesn't render anything but sets up the storage bucket
  }, [])

  useEffect(() => {
    try {
      const parsed = parseWindowMarkup(markup)
      setWindowStructure(parsed)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [markup])

  const handleSaveMockup = async () => {
    if (isSaving) return

    try {
      setIsSaving(true)

      let result

      if (mockupId) {
        // Update existing mockup
        result = await updateMockup(mockupId, mockupTitle, markup, documentation)
      } else {
        // Create new mockup
        result = await saveMockup(mockupTitle, markup, documentation)
      }

      if (result.success) {
        toast({
          title: mockupId ? "¡Mockup actualizado!" : "¡Mockup guardado!",
          description: mockupId
            ? "Tu mockup ha sido actualizado correctamente."
            : "Tu mockup ha sido guardado correctamente.",
          variant: "success",
        })

        // If this was a new mockup, redirect to the edit page
        if (!mockupId && result.id) {
          router.push(`/mockup/${result.id}`)
        }
      } else {
        toast({
          title: "Error al guardar",
          description: result.error || "Hubo un error al guardar el mockup.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: (error as Error).message || "Hubo un error al guardar el mockup.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewMockup = () => {
    router.push("/")
  }

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  const handleViewMode = () => {
    if (mockupId) {
      router.push(`/mockup/${mockupId}/view`)
    }
  }

  const handleEditMode = () => {
    if (mockupId) {
      router.push(`/mockup/${mockupId}`)
    }
  }

  const openInNewWindow = () => {
    if (mockupId) {
      window.open(`/mockup/${mockupId}`, "_blank")
    }
  }

  const getMockupUrl = () => {
    if (!mockupId) return null
    return `${window.location.origin}/mockup/${mockupId}/view`
  }

  const insertMockupId = (id: string) => {
    // Insert [mockup:id] at the cursor position or append to the end
    const mockupLink = `[mockup:${id}]`
    setMarkup((prev) => prev + " " + mockupLink)
    setShowIdHelper(false)
  }

  // Function to handle image clicks in documentation
  const handleImageClick = (imageUrl: string, alt: string) => {
    setCurrentImage({ url: imageUrl, alt })
    setShowImageModal(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
      {/* Initialize storage */}
      <StorageSetup />

      <div className="bg-blue-900 text-white p-2 text-sm font-medium flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div>Generador de Mockups</div>
          {isEditing ? (
            <input
              type="text"
              value={mockupTitle}
              onChange={(e) => setMockupTitle(e.target.value)}
              className="px-2 py-1 text-sm bg-blue-800 border border-blue-700 rounded text-white"
              placeholder="Título del mockup"
            />
          ) : (
            <div className="px-2 py-1 text-sm bg-blue-800 border border-blue-700 rounded text-white">{mockupTitle}</div>
          )}

          {isEditing && (
            <button
              className="flex items-center gap-1 text-xs bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded"
              onClick={() => setShowLinkHelp(!showLinkHelp)}
            >
              <Info size={14} />
              Enlaces
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-slate-300 text-xs">
            {error ? (
              <span className="text-red-400">Error: {error}</span>
            ) : (
              <span className="text-green-400">Markup válido</span>
            )}
          </div>

          <ScreenshotButton targetRef={previewRef} filename="openbravo-mockup-completo.png" />

          {/* Open in New Window Button */}
          {mockupId && (
            <Button
              variant="outline"
              size="sm"
              onClick={openInNewWindow}
              className="bg-blue-700 hover:bg-blue-800 text-white border-blue-600"
            >
              <ExternalLink size={16} className="mr-1" />
              Abrir en nueva ventana
            </Button>
          )}

          {/* View/Edit Toggle Buttons */}
          {mockupId && (
            <div className="flex gap-2">
              {isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewMode}
                  className="bg-blue-700 hover:bg-blue-800 text-white border-blue-600"
                >
                  <Eye size={16} className="mr-1" />
                  Ver
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditMode}
                  className="bg-blue-700 hover:bg-blue-800 text-white border-blue-600"
                >
                  <Edit size={16} className="mr-1" />
                  Editar
                </Button>
              )}
            </div>
          )}

          {/* Save Button */}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveMockup}
              disabled={isSaving}
              className="bg-green-700 hover:bg-green-800 text-white border-green-600"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-1">⏳</span>
                  {mockupId ? "Actualizando..." : "Guardando..."}
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1" />
                  {mockupId ? "Actualizar" : "Guardar"}
                </>
              )}
            </Button>
          )}

          {/* New Mockup Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewMockup}
            className="bg-blue-700 hover:bg-blue-800 text-white border-blue-600"
          >
            <PlusCircle size={16} className="mr-1" />
            Nuevo Mockup
          </Button>

          {/* Share Button */}
          {mockupId && <ShareButton mockupUrl={getMockupUrl()} />}
        </div>
      </div>

      {showLinkHelp && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm">
          <h3 className="font-medium text-blue-800 mb-1">Cómo crear enlaces entre mockups:</h3>
          <p className="text-blue-700 mb-2">
            Para enlazar a otro mockup, añade <code className="bg-blue-100 px-1 rounded">[mockup:ID]</code> en el texto
            de una celda, donde "ID" es el identificador único del mockup destino.
          </p>
          <div className="bg-white p-2 rounded border border-blue-200">
            <p className="text-slate-700">Ejemplo:</p>
            <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto">
              - Nº documento: 1000361 [mockup:abc123]
            </pre>
            <p className="text-red-600 mt-2 text-xs">
              <strong>Importante:</strong> El ID debe ser un ID válido de un mockup existente en la base de datos.
              {mockupId && (
                <span className="block mt-1">
                  Tu ID actual es: <code className="bg-slate-100 px-1 rounded">{mockupId}</code> - Puedes usar este ID
                  para pruebas.
                </span>
              )}
            </p>
            <div className="mt-3 flex justify-between items-center">
              <button
                onClick={() => setShowIdHelper(!showIdHelper)}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                {showIdHelper ? "Ocultar lista de mockups" : "Mostrar lista de mockups disponibles"}
              </button>
            </div>
            {showIdHelper && (
              <div className="mt-2">
                <MockupIdHelper onSelectId={insertMockupId} />
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
          <div className="bg-slate-100 border-b border-slate-200">
            <div className="flex">
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "markup"
                    ? "bg-white border-b-2 border-blue-500 text-blue-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setActiveTab("markup")}
              >
                <Code size={16} />
                Markup
              </button>
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                  activeTab === "documentation"
                    ? "bg-white border-b-2 border-blue-500 text-blue-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => setActiveTab("documentation")}
              >
                <FileText size={16} />
                Documentación
              </button>
            </div>
          </div>

          <Split className="flex-1">
            <Resizable
              defaultSize={{ width: "40%", height: "100%" }}
              minWidth="30%"
              maxWidth="70%"
              enable={{ right: true }}
              className="h-full"
            >
              {activeTab === "markup" ? (
                <MarkupEditor value={markup} onChange={setMarkup} />
              ) : (
                <EnhancedMarkdownEditor value={documentation} onChange={setDocumentation} />
              )}
            </Resizable>
            <div className="flex-1 overflow-auto bg-slate-50 p-4" ref={previewRef}>
              {activeTab === "markup" && windowStructure && (
                <MockupViewToggle structure={windowStructure} enableMockupLinks={true} mockupId={mockupId} />
              )}
              {activeTab === "documentation" && (
                <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                  <EnhancedMarkdownEditor value={documentation} onChange={() => {}} readOnly={true} />
                </div>
              )}
            </div>
          </Split>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="bg-slate-50 p-4" ref={previewRef}>
            {windowStructure && (
              <MockupViewToggle structure={windowStructure} enableMockupLinks={true} mockupId={mockupId} />
            )}
          </div>

          {documentation && (
            <div className="border-t border-slate-200 p-4 bg-white">
              <h2 className="text-lg font-medium text-slate-800 mb-4 flex items-center">
                <FileText size={18} className="mr-2 text-blue-600" />
                Documentación
              </h2>
              <div className="bg-white rounded-lg">
                <EnhancedMarkdownEditor value={documentation} onChange={() => {}} readOnly={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && currentImage && (
        <ImageModal imageUrl={currentImage.url} alt={currentImage.alt} onClose={() => setShowImageModal(false)} />
      )}
    </div>
  )
}
