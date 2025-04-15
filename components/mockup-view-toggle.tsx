"use client"

import { useState } from "react"
import { WindowPreview } from "@/components/window-preview"
import { ERDView } from "@/components/erd-view"
import { Grid, GitBranch } from "lucide-react"
import type { WindowStructure } from "@/lib/types"

interface MockupViewToggleProps {
  structure: WindowStructure
  enableMockupLinks?: boolean
  isInModal?: boolean
  mockupId?: string | null
}

export function MockupViewToggle({
  structure,
  enableMockupLinks = false,
  isInModal = false,
  mockupId = null,
}: MockupViewToggleProps) {
  const [viewMode, setViewMode] = useState<"grid" | "erd">("grid")

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-20 bg-white rounded-md shadow-md border border-slate-300">
        <div className="flex">
          <button
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${
              viewMode === "grid" ? "bg-blue-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
            } rounded-l-md`}
            onClick={() => setViewMode("grid")}
            title="Grid View"
          >
            <Grid size={14} />
            <span>Grid</span>
          </button>
          <button
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${
              viewMode === "erd" ? "bg-blue-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
            } rounded-r-md`}
            onClick={() => setViewMode("erd")}
            title="ERD View"
          >
            <GitBranch size={14} />
            <span>ERD</span>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <WindowPreview structure={structure} enableMockupLinks={enableMockupLinks} isInModal={isInModal} />
      ) : (
        <div className="h-[600px] border border-slate-300 rounded shadow-md">
          <ERDView structure={structure} mockupId={mockupId} />
        </div>
      )}
    </div>
  )
}
