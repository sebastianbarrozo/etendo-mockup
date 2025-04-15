"use client"

import { useState } from "react"
import { HelpCircle, AlertCircle, Info } from "lucide-react"
import type { DesignNote as DesignNoteType } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DesignNoteProps {
  note: DesignNoteType
  className?: string
}

export function DesignNote({ note, className }: DesignNoteProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine icon and color based on note type
  let Icon, bgColor, textColor, borderColor, iconColor

  switch (note.type) {
    case "warning":
      Icon = AlertCircle
      bgColor = "bg-amber-100"
      textColor = "text-amber-800"
      borderColor = "border-amber-300"
      iconColor = "text-amber-500"
      break
    case "tip":
      Icon = Info
      bgColor = "bg-blue-100"
      textColor = "text-blue-800"
      borderColor = "border-blue-300"
      iconColor = "text-blue-500"
      break
    case "note":
    default:
      Icon = HelpCircle
      bgColor = "bg-green-100"
      textColor = "text-green-800"
      borderColor = "border-green-300"
      iconColor = "text-green-500"
      break
  }

  return (
    <div
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("cursor-help rounded-full p-1 transition-all", isHovered ? "bg-slate-100" : "bg-transparent")}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>

      {isHovered && (
        <div
          className={cn(
            "absolute z-50 w-64 p-3 rounded-md shadow-lg border",
            bgColor,
            borderColor,
            "top-full left-1/2 transform -translate-x-1/2 mt-1",
          )}
        >
          <div className={cn("text-sm", textColor)}>{note.text}</div>
          <div
            className={cn(
              "absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45",
              bgColor,
              borderColor,
              "border-t border-l",
            )}
          />
        </div>
      )}
    </div>
  )
}
