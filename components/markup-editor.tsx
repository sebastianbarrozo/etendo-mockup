"use client"

import { useRef } from "react"
import { Editor } from "@monaco-editor/react"

interface MarkupEditorProps {
  value: string
  onChange: (value: string) => void
}

export function MarkupEditor({ value, onChange }: MarkupEditorProps) {
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  return (
    <div className="h-full w-full border-r border-slate-200">
      <Editor
        height="100%"
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
        }}
        theme="vs-light"
      />
    </div>
  )
}
