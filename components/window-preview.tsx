"use client"

import { useState, useEffect, useRef } from "react"
import type { WindowStructure, TabItem, Button, DesignNote as DesignNoteType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { X, FileText, Printer, Mail, Link2, Edit, Check, ChevronDown, ExternalLink } from "lucide-react"
import { DetailForm } from "@/components/detail-form"
import { DesignNote } from "@/components/design-note"
import { useMockupModal } from "@/contexts/mockup-modal-context"

// Regular expression to detect mockup links in cell text
// Format: [mockup:123] where 123 is the mockup ID
const MOCKUP_LINK_REGEX = /\[mockup:([a-zA-Z0-9-_]+)\]/g

interface WindowPreviewProps {
  structure: WindowStructure
  enableMockupLinks?: boolean
  isInModal?: boolean
}

export function WindowPreview({ structure, enableMockupLinks = false, isInModal = false }: WindowPreviewProps) {
  const [activeTabIndices, setActiveTabIndices] = useState<Record<number, number>>({})
  const [selectedRow, setSelectedRow] = useState<string[] | null>(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [activeContext, setActiveContext] = useState<string | null>(
    structure.tabs && structure.tabs.length > 0 ? structure.tabs[0].title : null,
  )
  const [scrollPosition, setScrollPosition] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const { openModal } = useMockupModal()

  // Track scroll position for shadow effect on fixed header
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setScrollPosition(contentRef.current.scrollTop)
      }
    }

    const contentElement = contentRef.current
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll)
      return () => contentElement.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Initialize active tab indices for all levels
  useEffect(() => {
    // Function to recursively initialize active indices for all levels
    const initializeActiveIndices = (tabs: TabItem[], currentLevel: number, indices: Record<number, number>) => {
      if (tabs.length === 0) return indices

      // Set first tab as active for this level if not already set
      if (indices[currentLevel] === undefined) {
        indices[currentLevel] = 0
      }

      // Get the active tab at this level
      const activeTab = tabs[indices[currentLevel]]

      // If this tab has children, recursively initialize the next level
      if (activeTab.children && activeTab.children.length > 0) {
        return initializeActiveIndices(activeTab.children, currentLevel + 1, indices)
      }

      return indices
    }

    if (structure.tabs && structure.tabs.length > 0) {
      const initialIndices = initializeActiveIndices(structure.tabs, 0, {})
      setActiveTabIndices(initialIndices)
    }
  }, [structure.tabs])

  // Collect all buttons from all tabs and subtabs
  const allButtons: Button[] = []

  // Function to recursively collect buttons from tabs and their children
  const collectButtons = (tab: TabItem) => {
    if (tab.buttons) {
      allButtons.push(
        ...tab.buttons.map((button) => ({
          ...button,
          context: button.context || tab.title,
        })),
      )
    }

    if (tab.children) {
      tab.children.forEach(collectButtons)
    }
  }

  // Collect buttons from all tabs
  if (structure.tabs) {
    structure.tabs.forEach(collectButtons)
  }

  // Add global buttons if they exist
  if (structure.globalButtons) {
    allButtons.push(...structure.globalButtons)
  }

  const handleTabClick = (level: number, index: number, tab: TabItem) => {
    // Update active tab for this level
    setActiveTabIndices((prev) => {
      const newIndices = { ...prev, [level]: index }

      // Reset all deeper level indices
      Object.keys(prev).forEach((key) => {
        if (Number.parseInt(key) > level) {
          delete newIndices[Number.parseInt(key)]
        }
      })

      return newIndices
    })

    setActiveContext(tab.title)
    // Reset row selection when changing tabs
    setSelectedRowIndex(null)
    // Close form when changing tabs
    setShowForm(false)
  }

  const handleRowClick = (row: string[], index: number, context: string) => {
    setSelectedRowIndex(index)
    // Update the active context based on the clicked row
    setActiveContext(context)
  }

  const handleRowDoubleClick = (row: string[], headers: string[]) => {
    setSelectedRow(row)
    setSelectedHeaders(headers)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
  }

  // Function to check if a cell contains a mockup link and extract the ID
  const extractMockupLink = (cellText: string): string | null => {
    if (!enableMockupLinks) return null

    // Reset regex state
    MOCKUP_LINK_REGEX.lastIndex = 0

    const match = MOCKUP_LINK_REGEX.exec(cellText)

    if (match && match[1]) {
      // Validate the mockup ID format (basic validation)
      const mockupId = match[1].trim()
      if (mockupId.length > 0) {
        return mockupId
      }
    }
    return null
  }

  // Function to render cell content with mockup links
  const renderCellContent = (cellText: string) => {
    if (!enableMockupLinks) return cellText

    // Reset regex state
    MOCKUP_LINK_REGEX.lastIndex = 0

    // Check if the cell contains a mockup link
    const mockupId = extractMockupLink(cellText)

    if (mockupId) {
      // Format the display text (remove the mockup link syntax)
      const displayText = cellText.replace(MOCKUP_LINK_REGEX, "").trim()

      return (
        <button
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            console.log(`Opening mockup: ${mockupId}`)
            openModal(mockupId)
          }}
          title={`Abrir mockup: ${mockupId}`}
        >
          {displayText || "Ver mockup"}
          <ExternalLink size={14} className="inline-block" />
        </button>
      )
    }

    return cellText
  }

  // Function to render buttons in the toolbar - only show relevant buttons
  const renderToolbarButtons = () => {
    // Filter buttons to only show those relevant to the current context
    const relevantButtons = allButtons.filter((button) => !button.context || button.context === activeContext)

    if (relevantButtons.length === 0) return null

    return (
      <div className="flex gap-1 overflow-x-auto hide-scrollbar">
        {relevantButtons.map((button, index) => (
          <button
            key={index}
            className="bg-yellow-500 text-black px-3 py-1 text-xs font-medium rounded whitespace-nowrap"
            title={button.context ? `Action for: ${button.context}` : undefined}
          >
            {button.label}
          </button>
        ))}
      </div>
    )
  }

  // Function to render design notes for a tab
  const renderDesignNotes = (notes?: DesignNoteType[]) => {
    if (!notes || notes.length === 0) return null

    // Filter out notes that are associated with cells
    const tabNotes = notes.filter((note) => !note.cellReference)

    if (tabNotes.length === 0) return null

    return (
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        {tabNotes.map((note) => (
          <DesignNote key={note.id} note={note} />
        ))}
      </div>
    )
  }

  // Function to check if a cell has a design note
  const getCellNote = (tab: TabItem, rowIndex: number, columnIndex: number): DesignNoteType | null => {
    if (!tab.designNotes || tab.designNotes.length === 0) return null

    return (
      tab.designNotes.find(
        (note) =>
          note.cellReference &&
          note.cellReference.rowIndex === rowIndex &&
          note.cellReference.columnIndex === columnIndex,
      ) || null
    )
  }

  // Recursive function to render tab content at any level
  const renderTabContent = (tab: TabItem, level = 0) => {
    if (!tab.content && !tab.children?.length) {
      return <div className="p-4 text-slate-500 italic text-sm">No content defined for this tab</div>
    }

    return (
      <div className="relative">
        {/* Render design notes for this tab */}
        {renderDesignNotes(tab.designNotes)}

        {tab.content && (
          <div className="p-4">
            {showForm && selectedRow ? (
              <DetailForm data={selectedRow} headers={selectedHeaders} onClose={handleCloseForm} />
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden relative">
                <div className="bg-slate-100 p-2 flex items-center justify-between border-b border-slate-200">
                  <div className="text-sm font-medium text-slate-700">
                    {tab.title} {level > 0 && <span className="text-xs text-slate-500">(Level {level})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-slate-200 rounded">
                      <Edit size={14} />
                    </button>
                    <button className="p-1 hover:bg-slate-200 rounded">
                      <Check size={14} />
                    </button>
                    <button className="p-1 hover:bg-slate-200 rounded">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-200 border-b border-slate-300">
                        <th className="w-8 p-1 border-r border-slate-300">
                          <div className="flex items-center justify-center">
                            <input type="checkbox" className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="w-16 p-1 border-r border-slate-300"></th>
                        {tab.content.headers?.map((header, i) => (
                          <th key={i} className="text-left p-1 font-medium text-slate-800 border-r border-slate-300">
                            {header} {i === 1 && <span className="ml-1">▲</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tab.content.rows?.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={cn(
                            "border-b border-slate-200 cursor-pointer",
                            selectedRowIndex === rowIndex && activeContext === tab.title
                              ? "bg-blue-100"
                              : rowIndex % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50",
                            "hover:bg-blue-50",
                          )}
                          onClick={() => handleRowClick(row, rowIndex, tab.title)}
                          onDoubleClick={() => handleRowDoubleClick(row, tab.content?.headers || [])}
                        >
                          <td className="p-1 border-r border-slate-200">
                            <div className="flex items-center justify-center">
                              <input type="checkbox" className="h-3 w-3" />
                            </div>
                          </td>
                          <td className="p-1 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <button className="text-slate-500 hover:text-slate-700">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                                  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
                                </svg>
                              </button>
                              <button className="text-slate-500 hover:text-slate-700">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          {row.map((cell, cellIndex) => {
                            const cellNote = getCellNote(tab, rowIndex, cellIndex)

                            return (
                              <td key={cellIndex} className="p-1 text-slate-700 relative border-r border-slate-200">
                                <div className="flex items-center gap-2">
                                  <span>{renderCellContent(cell)}</span>
                                  {cellNote && (
                                    <span className="inline-flex">
                                      <DesignNote note={cellNote} />
                                    </span>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-slate-100 p-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                  <span>Click a row to select it and update context</span>
                  <span>Double-click a row to view details</span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab.children && tab.children.length > 0 && !showForm && (
          <div className="mt-0">
            <div className="border-t border-slate-300 bg-slate-100">
              <div className="flex overflow-x-auto hide-scrollbar">
                {tab.children.map((childTab, index) => (
                  <button
                    key={index}
                    className={cn(
                      "px-4 py-2 text-sm font-medium border-r border-slate-300 whitespace-nowrap",
                      activeTabIndices[level + 1] === index
                        ? "bg-blue-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                    )}
                    onClick={() => handleTabClick(level + 1, index, childTab)}
                  >
                    {childTab.title}
                  </button>
                ))}
              </div>
            </div>
            {/* Ensure we have an active index for this level */}
            {tab.children[activeTabIndices[level + 1] !== undefined ? activeTabIndices[level + 1] : 0] && (
              <div>
                {renderTabContent(
                  tab.children[activeTabIndices[level + 1] !== undefined ? activeTabIndices[level + 1] : 0],
                  level + 1,
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-white border border-slate-300 rounded shadow-md w-full flex flex-col",
        isInModal ? "max-h-[70vh]" : "",
      )}
    >
      {/* Fixed header section */}
      <div className="sticky top-0 z-10">
        {/* Window header */}
        <div className="flex justify-between items-center bg-slate-700 text-white p-1 relative">
          <div className="text-xs font-medium px-2 py-1 bg-slate-600 rounded-sm mr-2">ESPACIO DE TRABAJO</div>
          <div className="flex-1 flex items-center bg-blue-900 px-2 py-1 text-sm font-medium">
            {structure.title}
            <button className="ml-auto text-slate-300 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Global design notes */}
          {renderDesignNotes(structure.globalDesignNotes)}
        </div>

        {/* Toolbar */}
        <div
          className={cn(
            "flex items-center bg-slate-600 text-white p-1 gap-1 overflow-x-auto hide-scrollbar transition-shadow duration-200",
            scrollPosition > 10 ? "shadow-md" : "",
          )}
        >
          <div className="flex gap-1">
            {[FileText, Link2, Printer, Mail, Link2, FileText].map((Icon, i) => (
              <button key={i} className="p-1 hover:bg-slate-500 rounded">
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">{renderToolbarButtons()}</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto" ref={contentRef}>
        {/* Main content */}
        <div>
          {structure.tabs && structure.tabs.length > 0 && (
            <div>{renderTabContent(structure.tabs[activeTabIndices[0] !== undefined ? activeTabIndices[0] : 0])}</div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-slate-100 border-t border-slate-300 p-1 px-2 text-xs text-slate-500 flex justify-between items-center">
        <div>Active context: {activeContext}</div>
        <div className="flex items-center gap-2">
          <span>|||</span>
        </div>
      </div>
    </div>
  )
}
