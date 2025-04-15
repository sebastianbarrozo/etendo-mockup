export interface TabContent {
  headers?: string[]
  rows?: string[][]
}

export interface Button {
  label: string
  context?: string // The context/section where this button should appear
}

export interface DesignNote {
  id: string
  text: string
  type: "note" | "tip" | "warning"
  position?: {
    x: number
    y: number
  }
  // Para notas a nivel de celda
  cellReference?: {
    rowIndex: number
    columnIndex: number
    headerName: string
  }
}

export interface TabItem {
  title: string
  level: number
  children?: TabItem[]
  content?: TabContent
  buttons?: Button[] // Buttons associated with this tab
  designNotes?: DesignNote[] // Design notes for this tab
}

export interface WindowStructure {
  title: string
  tabs: TabItem[]
  globalButtons?: Button[] // Buttons that should appear globally
  globalDesignNotes?: DesignNote[] // Design notes that apply globally
}
