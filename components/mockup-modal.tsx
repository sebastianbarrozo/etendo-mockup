"use client"

import { useState, useEffect } from "react"
import { X, Edit, ExternalLink, FileText } from "lucide-react"
import { MockupViewToggle } from "@/components/mockup-view-toggle"
import { getMockupById } from "@/app/actions/mockup-actions"
import { parseWindowMarkup } from "@/lib/markup-parser"
import { MarkdownEditor } from "@/components/markdown-editor"
import { ImageModal } from "@/components/image-modal"
import type { WindowStructure } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface MockupModalProps {
  mockupId: string
  onClose: () => void
  isNested?: boolean
}

export function MockupModal({ mockupId, onClose, isNested = false }: MockupModalProps) {
  const [mockup, setMockup] = useState<{
    id: string
    title: string
    markup: string
    documentation: string
    structure: WindowStructure | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"mockup" | "documentation">("mockup")
  const [modalImage, setModalImage] = useState<{ url: string; alt: string } | null>(null)

  const fetchMockup = async () => {
    try {
      setLoading(true)
      console.log(`Fetching mockup with ID: ${mockupId}`)
      const result = await getMockupById(mockupId)

      console.log("Fetch result:", result)

      if (result.success && result.mockup) {
        try {
          const structure = parseWindowMarkup(result.mockup.markup)
          setMockup({
            id: result.mockup.id,
            title: result.mockup.title,
            markup: result.mockup.markup,
            documentation: result.mockup.documentation || "",
            structure,
          })
          setError(null)
        } catch (parseError) {
          console.error("Parse error:", parseError)
          setError(`Error parsing mockup: ${(parseError as Error).message}`)
        }
      } else {
        console.error("Mockup not found or error:", result.error)
        setError(`Mockup not found: ${result.error || "Unknown error"}`)
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError(`Error loading mockup: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMockup()
  }, [mockupId])

  const handleEdit = () => {
    // Open the edit page in a new browser window/tab
    window.open(`/mockup/${mockupId}`, "_blank")
    // Don't close the modal, so the user can continue viewing the current mockup
  }

  const retryFetch = () => {
    setLoading(true)
    setError(null)
    fetchMockup()
  }

  // Handle image modal links from documentation
  const handleImageClick = (url: string, alt: string) => {
    setModalImage({ url, alt })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col ${
          isNested ? "border-4 border-blue-500" : ""
        }`}
      >
        <div className="bg-blue-900 text-white p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isNested && <span className="bg-blue-700 text-white px-2 py-0.5 rounded text-xs">Sub-Mockup</span>}
            <h2 className="text-lg font-medium">{loading ? "Loading..." : mockup?.title || "Mockup"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 p-1.5 rounded hover:bg-blue-800 text-slate-300 hover:text-white"
              title="Edit this mockup in a new window"
            >
              <Edit size={16} />
              <ExternalLink size={14} />
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

        {loading ? (
          <div className="flex items-center justify-center h-64 bg-slate-50 flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 m-4 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <p className="text-sm mt-2">Mockup ID: {mockupId}</p>
            <p className="text-sm">Make sure this mockup ID exists in your database.</p>
            <button
              onClick={retryFetch}
              className="mt-3 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        ) : mockup?.structure ? (
          <div className="flex-1 overflow-auto">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "mockup" | "documentation")}
              className="w-full"
            >
              <div className="bg-slate-100 border-b border-slate-200 px-4">
                <TabsList className="bg-transparent h-10">
                  <TabsTrigger value="mockup" className="data-[state=active]:bg-white">
                    Mockup
                  </TabsTrigger>
                  <TabsTrigger value="documentation" className="data-[state=active]:bg-white">
                    <FileText size={14} className="mr-1" />
                    Documentación
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="mockup" className="p-4 bg-slate-50">
                <MockupViewToggle
                  structure={mockup.structure}
                  enableMockupLinks={true}
                  isInModal={true}
                  mockupId={mockup.id}
                />
              </TabsContent>

              <TabsContent value="documentation" className="p-4 bg-white">
                {mockup.documentation ? (
                  <div className="bg-white rounded-lg">
                    <MarkdownEditor value={mockup.documentation} onChange={() => {}} readOnly={true} />
                  </div>
                ) : (
                  <div className="text-center text-slate-500 p-8 bg-slate-50 rounded-lg border border-slate-200">
                    <FileText size={32} className="mx-auto mb-2 text-slate-400" />
                    <p>No hay documentación disponible para este mockup.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center text-slate-500 p-8">No mockup data available</div>
        )}
      </div>

      {modalImage && <ImageModal imageUrl={modalImage.url} alt={modalImage.alt} onClose={() => setModalImage(null)} />}
    </div>
  )
}
