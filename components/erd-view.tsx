"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import type { WindowStructure, TabItem } from "@/lib/types"
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface Entity {
  id: string
  label: string
  fields: string[]
  x: number
  y: number
  width: number
  height: number
  type: "main" | "tab" | "external"
  level: number
}

interface Relationship {
  id: string
  source: string
  target: string
  label?: string
  type: "hierarchy" | "link"
}

interface ERDViewProps {
  structure: WindowStructure
  mockupId?: string | null
}

export function ERDView({ structure, mockupId }: ERDViewProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedEntity, setDraggedEntity] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract entities and relationships from the mockup structure
  const extractEntitiesAndRelationships = useCallback(() => {
    const extractedEntities: Entity[] = []
    const extractedRelationships: Relationship[] = []
    const mockupLinkRegex = /\[mockup:([a-zA-Z0-9-_]+)\]/g

    // Add the main window as an entity
    extractedEntities.push({
      id: "main",
      label: structure.title,
      fields: ["Main Window"],
      x: 50,
      y: 50,
      width: 220,
      height: 100,
      type: "main",
      level: 0,
    })

    // Function to process tabs recursively
    const processTabs = (tabs: TabItem[], parentId: string, level = 0) => {
      tabs.forEach((tab, tabIndex) => {
        const tabId = `${parentId}-tab-${level}-${tabIndex}`
        const fields = tab.content?.headers || []
        const height = Math.max(100, 60 + fields.length * 20) // Base height + field height

        // Add tab as an entity
        extractedEntities.push({
          id: tabId,
          label: tab.title,
          fields,
          x: 50 + 300 * (level + 1),
          y: 50 + 200 * tabIndex,
          width: 200,
          height,
          type: "tab",
          level,
        })

        // Connect tab to parent
        extractedRelationships.push({
          id: `${parentId}-to-${tabId}`,
          source: parentId,
          target: tabId,
          type: "hierarchy",
        })

        // Process content for mockup links
        if (tab.content?.rows) {
          tab.content.rows.forEach((row, rowIndex) => {
            row.forEach((cell) => {
              let match
              const regex = new RegExp(mockupLinkRegex)
              while ((match = regex.exec(cell)) !== null) {
                const linkedMockupId = match[1]

                // Add linked mockup as an entity if it doesn't exist
                const linkedNodeId = `external-${linkedMockupId}`
                if (!extractedEntities.some((entity) => entity.id === linkedNodeId)) {
                  extractedEntities.push({
                    id: linkedNodeId,
                    label: `Mockup: ${linkedMockupId}`,
                    fields: ["External Mockup"],
                    x: 50 + 300 * (level + 2),
                    y: 50 + 200 * (extractedEntities.length % 3),
                    width: 180,
                    height: 80,
                    type: "external",
                    level: -1,
                  })
                }

                // Add relationship from tab to linked mockup
                extractedRelationships.push({
                  id: `${tabId}-to-${linkedNodeId}-${rowIndex}`,
                  source: tabId,
                  target: linkedNodeId,
                  label: "links to",
                  type: "link",
                })
              }
            })
          })
        }

        // Process child tabs
        if (tab.children && tab.children.length > 0) {
          processTabs(tab.children, tabId, level + 1)
        }
      })
    }

    // Process all tabs
    if (structure.tabs && structure.tabs.length > 0) {
      processTabs(structure.tabs, "main", 0)
    }

    return { entities: extractedEntities, relationships: extractedRelationships }
  }, [structure])

  // Initialize diagram when structure changes
  useEffect(() => {
    const { entities: extractedEntities, relationships: extractedRelationships } = extractEntitiesAndRelationships()
    setEntities(extractedEntities)
    setRelationships(extractedRelationships)
    // Reset zoom and pan
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [structure, extractEntitiesAndRelationships])

  // Filter entities based on search term
  const filteredEntities = searchTerm
    ? entities.map((entity) => {
        const matchesSearch =
          entity.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entity.fields.some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
        return {
          ...entity,
          opacity: matchesSearch ? 1 : 0.3,
        }
      })
    : entities.map((entity) => ({ ...entity, opacity: 1 }))

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  // Handle fit view
  const handleFitView = () => {
    if (entities.length === 0) return

    // Calculate bounds
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY

    entities.forEach((entity) => {
      minX = Math.min(minX, entity.x)
      minY = Math.min(minY, entity.y)
      maxX = Math.max(maxX, entity.x + entity.width)
      maxY = Math.max(maxY, entity.y + entity.height)
    })

    // Add padding
    minX -= 50
    minY -= 50
    maxX += 50
    maxY += 50

    // Calculate container dimensions
    const containerWidth = containerRef.current?.clientWidth || 800
    const containerHeight = containerRef.current?.clientHeight || 600

    // Calculate zoom to fit
    const zoomX = containerWidth / (maxX - minX)
    const zoomY = containerHeight / (maxY - minY)
    const newZoom = Math.min(Math.min(zoomX, zoomY), 1) // Cap at 1x zoom

    // Calculate center position
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    // Set new zoom and pan
    setZoom(newZoom)
    setPan({
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom,
    })
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent, entityId?: string) => {
    if (entityId) {
      // Dragging an entity
      setDraggedEntity(entityId)
    } else {
      // Dragging the canvas
      setIsDragging(true)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !draggedEntity) return

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    if (draggedEntity) {
      // Move the entity
      setEntities((prev) =>
        prev.map((entity) => {
          if (entity.id === draggedEntity) {
            return {
              ...entity,
              x: entity.x + dx / zoom,
              y: entity.y + dy / zoom,
            }
          }
          return entity
        }),
      )
    } else {
      // Pan the canvas
      setPan((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
    }

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    setIsDragging(false)
    setDraggedEntity(null)
  }

  // Handle mouse leave to end dragging
  const handleMouseLeave = () => {
    setIsDragging(false)
    setDraggedEntity(null)
  }

  // Handle wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    const newZoom = Math.max(0.5, Math.min(2, zoom + delta))

    // Calculate cursor position relative to SVG
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Calculate new pan to zoom toward cursor
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom)
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom)

    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  // Draw a curved path between two entities
  const drawPath = (source: Entity, target: Entity, type: "hierarchy" | "link"): string => {
    // Calculate source and target points
    const sourceX = source.x + source.width / 2
    const sourceY = source.y + source.height / 2
    const targetX = target.x + target.width / 2
    const targetY = target.y + target.height / 2

    // Calculate control points for the curve
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const controlX = sourceX + dx / 2
    const controlY = sourceY + dy / 2

    // Return SVG path
    return `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`
  }

  // Get entity by ID
  const getEntityById = (id: string): Entity | undefined => {
    return entities.find((entity) => entity.id === id)
  }

  // Get entity style based on type and level
  const getEntityStyle = (entity: Entity) => {
    switch (entity.type) {
      case "main":
        return {
          fill: "#f8fafc",
          stroke: "#1e40af",
          strokeWidth: 2,
        }
      case "external":
        return {
          fill: "#f0fdf4",
          stroke: "#16a34a",
          strokeWidth: 2,
          strokeDasharray: "5,5",
        }
      case "tab":
        return {
          fill: entity.level === 0 ? "#eff6ff" : "#f8fafc",
          stroke: "#94a3b8",
          strokeWidth: 1,
        }
      default:
        return {
          fill: "#f8fafc",
          stroke: "#94a3b8",
          strokeWidth: 1,
        }
    }
  }

  // Get relationship style based on type
  const getRelationshipStyle = (type: "hierarchy" | "link") => {
    switch (type) {
      case "hierarchy":
        return {
          stroke: "#94a3b8",
          strokeWidth: 1,
        }
      case "link":
        return {
          stroke: "#16a34a",
          strokeWidth: 1.5,
          strokeDasharray: "5,5",
        }
      default:
        return {
          stroke: "#94a3b8",
          strokeWidth: 1,
        }
    }
  }

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      {/* Search panel */}
      <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded shadow-md border border-slate-200">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entities..."
            className="text-sm border border-slate-300 rounded px-2 py-1 w-48"
          />
        </div>
      </div>

      {/* Controls panel */}
      <div className="absolute bottom-2 left-2 z-10 bg-white p-2 rounded shadow-md border border-slate-200">
        <div className="flex items-center gap-2">
          <button onClick={handleZoomIn} className="p-1 hover:bg-slate-100 rounded" title="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button onClick={handleZoomOut} className="p-1 hover:bg-slate-100 rounded" title="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button onClick={handleFitView} className="p-1 hover:bg-slate-100 rounded" title="Fit view">
            <Maximize2 size={18} />
          </button>
          <div className="text-xs text-slate-500 ml-2">{Math.round(zoom * 100)}%</div>
        </div>
      </div>

      {/* SVG diagram */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Draw relationships */}
          {relationships.map((rel) => {
            const source = getEntityById(rel.source)
            const target = getEntityById(rel.target)
            if (!source || !target) return null

            const style = getRelationshipStyle(rel.type)

            return (
              <g key={rel.id} opacity={searchTerm ? 0.3 : 1}>
                <path
                  d={drawPath(source, target, rel.type)}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                />
                {/* Arrow head */}
                <polygon
                  points="-5,-3 0,0 -5,3"
                  fill={style.stroke}
                  transform={`translate(${target.x + target.width / 2}, ${target.y + target.height / 2}) rotate(${
                    Math.atan2(target.y - source.y, target.x - source.x) * (180 / Math.PI)
                  })`}
                />
                {/* Relationship label */}
                {rel.label && (
                  <text
                    x={(source.x + target.x + source.width / 2 + target.width / 2) / 2}
                    y={(source.y + target.y + source.height / 2 + target.height / 2) / 2 - 5}
                    textAnchor="middle"
                    fill={style.stroke}
                    fontSize="10"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {rel.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Draw entities */}
          {filteredEntities.map((entity) => {
            const style = getEntityStyle(entity)

            return (
              <g
                key={entity.id}
                transform={`translate(${entity.x},${entity.y})`}
                opacity={entity.opacity || 1}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, entity.id)
                }}
                className="cursor-move"
              >
                {/* Entity rectangle */}
                <rect
                  width={entity.width}
                  height={entity.height}
                  rx={4}
                  ry={4}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeDasharray={style.strokeDasharray}
                />
                {/* Entity header */}
                <rect
                  width={entity.width}
                  height={30}
                  rx={4}
                  ry={4}
                  fill="#1e293b"
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                />
                {/* Entity title */}
                <text
                  x={entity.width / 2}
                  y={20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {entity.label}
                </text>
                {/* Entity fields */}
                {entity.fields.map((field, i) => (
                  <text key={i} x={10} y={45 + i * 20} fill="#334155" fontSize="11" className="pointer-events-none">
                    {field}
                  </text>
                ))}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
