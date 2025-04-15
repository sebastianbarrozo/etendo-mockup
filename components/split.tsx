"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SplitProps {
  children: ReactNode
  className?: string
}

export function Split({ children, className }: SplitProps) {
  return <div className={cn("flex flex-row", className)}>{children}</div>
}
