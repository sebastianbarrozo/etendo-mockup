"use client"

import { useState, useEffect, useRef } from "react"
import { Editor } from "@monaco-editor/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"
import { ImageUploader } from "@/components/image-uploader"
import { ImageModal } from "@/components/image-modal"
import { ImageUploadHelp } from "@/components/image-upload-help"
import { Bold, Italic, List, ListOrdered, Link, ImageIcon, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EnhancedMarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function EnhancedMarkdownEditor({ value, onChange, readOnly = false }: EnhancedMarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write")
  const [editorHeight, setEditorHeight] = useState("300px")
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImage, setCurrentImage] = useState<{ url: string; alt: string } | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const editorRef = useRef<any>(null)

  // Switch to preview mode when in readOnly
  useEffect(() => {
    if (readOnly) {
      setActiveTab("preview")
    }
  }, [readOnly])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const insertTextAtCursor = (textToInsert: string) => {
    if (!editorRef.current) return

    const selection = editorRef.current.getSelection()
    const id = { major: 1, minor: 1 }
    const op = { identifier: id, range: selection, text: textToInsert, forceMoveMarkers: true }
    editorRef.current.executeEdits("my-source", [op])
    editorRef.current.focus()
  }

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        insertTextAtCursor("**texto en negrita**")
        break
      case "italic":
        insertTextAtCursor("*texto en cursiva*")
        break
      case "list":
        insertTextAtCursor("\n- Elemento 1\n- Elemento 2\n- Elemento 3")
        break
      case "ordered-list":
        insertTextAtCursor("\n1. Primer elemento\n2. Segundo elemento\n3. Tercer elemento")
        break
      case "link":
        insertTextAtCursor("[texto del enlace](https://ejemplo.com)")
        break
      case "image":
        setShowImageUploader(true)
        break
      case "help":
        setShowHelp(!showHelp)
        break
      default:
        break
    }
  }

  const handleImageUploaded = (imageUrl: string, fileName: string) => {
    setShowImageUploader(false)
    const imageMarkdown = `![${fileName}](${imageUrl})`
    insertTextAtCursor(imageMarkdown)
  }

  // Custom renderer for images to support modal view
  const customRenderers = {
    img: ({ node, ...props }: any) => {
      // Check if the next sibling is a text node with {modal}
      const nextSibling = node.next
      const isModal = nextSibling && nextSibling.type === "text" && nextSibling.value.trim() === "{modal}"

      if (isModal) {
        return (
          <div className="inline-block cursor-pointer">
            <img
              {...props}
              className="max-w-full border border-slate-200 rounded hover:border-blue-400 transition-colors"
              onClick={() => {
                setCurrentImage({ url: props.src, alt: props.alt || "Image" })
                setShowImageModal(true)
              }}
              style={{ maxHeight: "300px" }}
            />
            <div className="text-xs text-center text-blue-600 mt-1">Click para ampliar</div>
          </div>
        )
      }

      return <img {...props} className="max-w-full rounded" />
    },
  }

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
      {!readOnly && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
          <div className="bg-slate-100 border-b border-slate-200 px-2">
            <div className="flex justify-between items-center">
              <TabsList className="bg-transparent h-10">
                <TabsTrigger value="write" className="data-[state=active]:bg-white">
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-white">
                  Preview
                </TabsTrigger>
              </TabsList>

              {activeTab === "write" && (
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("bold")}
                          className="h-8 w-8 p-0"
                        >
                          <Bold size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Negrita</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("italic")}
                          className="h-8 w-8 p-0"
                        >
                          <Italic size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cursiva</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("list")}
                          className="h-8 w-8 p-0"
                        >
                          <List size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lista</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("ordered-list")}
                          className="h-8 w-8 p-0"
                        >
                          <ListOrdered size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lista numerada</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("link")}
                          className="h-8 w-8 p-0"
                        >
                          <Link size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enlace</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("image")}
                          className="h-8 w-8 p-0"
                        >
                          <ImageIcon size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Subir imagen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToolbarAction("help")}
                          className={`h-8 w-8 p-0 ${showHelp ? "bg-slate-200" : ""}`}
                        >
                          <HelpCircle size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ayuda</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </Tabs>
      )}

      {showHelp && <ImageUploadHelp />}

      {showImageUploader && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Subir imagen</h3>
          <ImageUploader onImageUploaded={handleImageUploaded} />
          <div className="flex justify-end mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowImageUploader(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div
        className={readOnly ? "" : "hidden"}
        style={{ display: readOnly || activeTab === "preview" ? "block" : "none" }}
      >
        <div className="prose prose-slate max-w-none p-4 prose-headings:mt-2 prose-headings:mb-2">
          {value ? (
            <ReactMarkdown components={customRenderers}>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">No documentation yet.</p>
          )}
        </div>
      </div>

      {!readOnly && (
        <div style={{ display: activeTab === "write" ? "block" : "none" }}>
          <Editor
            height={editorHeight}
            defaultLanguage="markdown"
            value={value}
            onChange={(value) => onChange(value || "")}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: "on",
              fontSize: 14,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              wrappingIndent: "same",
              automaticLayout: true,
              readOnly: readOnly,
            }}
            theme="vs-light"
          />
        </div>
      )}

      {!readOnly && (
        <div className="bg-slate-100 border-t border-slate-200 p-2 text-xs text-slate-500">
          <p>
            Use Markdown to format your documentation. Supports <strong>bold</strong>, <em>italic</em>, lists, links,
            and more.
          </p>
        </div>
      )}

      {showImageModal && currentImage && (
        <ImageModal imageUrl={currentImage.url} alt={currentImage.alt} onClose={() => setShowImageModal(false)} />
      )}
    </div>
  )
}
