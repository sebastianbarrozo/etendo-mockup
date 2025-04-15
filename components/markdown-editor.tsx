"use client"

import { useState, useEffect } from "react"
import { Editor } from "@monaco-editor/react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReactMarkdown from "react-markdown"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function MarkdownEditor({ value, onChange, readOnly = false }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write")

  // Switch to preview mode when readOnly is true
  useEffect(() => {
    if (readOnly) {
      setActiveTab("preview")
    }
  }, [readOnly])

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
      {/* Tabs for write/preview, hidden in readOnly mode */}
      {!readOnly && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
          <div className="bg-slate-100 border-b border-slate-200 px-2">
            <TabsList className="bg-transparent h-10">
              <TabsTrigger value="write" className="data-[state=active]:bg-white">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-white">
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      )}

      {/* Preview mode: shown when readOnly or preview tab is active */}
      {(readOnly || activeTab === "preview") && (
        <div className="prose prose-slate max-w-none p-4 prose-headings:mt-2 prose-headings:mb-2">
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">No documentation yet.</p>
          )}
        </div>
      )}

      {/* Editor: shown only in write mode when not readOnly */}
      {!readOnly && activeTab === "write" && (
        <Editor
          height="300px"
          defaultLanguage="markdown"
          value={value}
          onChange={(newValue) => onChange(newValue ?? "")}
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "same",
            automaticLayout: true,
            readOnly,
          }}
          theme="vs-light"
        />
      )}

      {/* Footer: shown only when not readOnly */}
      {!readOnly && (
        <div className="bg-slate-100 border-t border-slate-200 p-2 text-xs text-slate-500">
          <p>
            Use Markdown to format your documentation. Supports <strong>bold</strong>, <em>italic</em>, lists, links,
            and more.
          </p>
        </div>
      )}
    </div>
  )
}
