import type { WindowStructure, TabItem, Button, DesignNote } from "./types"

export function parseWindowMarkup(markup: string): WindowStructure {
  const lines = markup.split("\n").filter((line) => line.trim() !== "")

  if (lines.length === 0) {
    throw new Error("Markup cannot be empty")
  }

  // First line should be the window title (level 0)
  const titleLine = lines[0]
  if (!titleLine.startsWith("# ")) {
    throw new Error("Markup must start with a level 0 title (# Window Title)")
  }

  // Extract title and any buttons
  const { title, buttons: globalButtons } = extractTitleAndButtons(titleLine.substring(2).trim())

  const structure: WindowStructure = {
    title,
    tabs: [],
    globalButtons,
    globalDesignNotes: [],
  }

  // Parse the rest of the markup
  const tabsByLevel: Record<number, TabItem[]> = {}
  let currentTab: TabItem | null = null
  let currentLevel = 0
  let lastFieldName: string | null = null
  let lastRowIndex = -1
  let pendingNote: { type: "note" | "tip" | "warning"; text: string } | null = null

  // Track records by ID for grid display
  const recordsByTab: Record<string, Record<string, Record<string, string>>> = {}

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]

    // Check if this is a design note
    if (line.startsWith("> [!NOTE]") || line.startsWith("> [!TIP]") || line.startsWith("> [!WARNING]")) {
      const noteType = line.includes("[!NOTE]") ? "note" : line.includes("[!TIP]") ? "tip" : "warning"
      const noteText = line.substring(line.indexOf("]") + 1).trim()

      // Store the note temporarily to associate with the next field
      pendingNote = {
        type: noteType,
        text: noteText,
      }

      // If we're not in a content context, add it to the current tab or global notes
      if (!lastFieldName) {
        const noteId = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        const designNote: DesignNote = {
          id: noteId,
          text: noteText,
          type: noteType,
        }

        // Add to current tab if exists, otherwise add to global notes
        if (currentTab) {
          currentTab.designNotes = currentTab.designNotes || []
          currentTab.designNotes.push(designNote)
        } else {
          structure.globalDesignNotes?.push(designNote)
        }
      }

      continue
    }

    // Check if this is a header line
    if (line.startsWith("#")) {
      // Reset pending note if we're moving to a new section
      pendingNote = null
      lastFieldName = null

      // Count the number of # to determine the level
      let level = 0
      while (line[level] === "#") {
        level++
      }

      // Adjust level to be 0-based (level 1 is the main tab)
      level--

      // Extract title and buttons
      const { title, buttons } = extractTitleAndButtons(line.substring(level + 1).trim())

      // Create a new tab
      const newTab: TabItem = {
        title,
        level,
        children: [],
        content: {
          headers: [],
          rows: [],
        },
        buttons,
        designNotes: [],
      }

      // Add to the appropriate level
      if (!tabsByLevel[level]) {
        tabsByLevel[level] = []
      }

      tabsByLevel[level].push(newTab)

      // If this is a level 1 tab (main tab), add it to the structure
      if (level === 1) {
        structure.tabs.push(newTab)
      } else if (level > 1) {
        // Find the parent tab at the previous level
        const parentLevel = level - 1
        const parentTabs = tabsByLevel[parentLevel]

        if (parentTabs && parentTabs.length > 0) {
          const parentTab = parentTabs[parentTabs.length - 1]
          parentTab.children = parentTab.children || []
          parentTab.children.push(newTab)
        }
      }

      currentTab = newTab
      currentLevel = level

      // Initialize record tracking for this tab
      const tabId = title.replace(/\s+/g, "_").toLowerCase()
      recordsByTab[tabId] = {}
    }
    // Check if this is a button line (no bullet point, just [Button])
    else if (line.trim().match(/^\[.+\]$/) && currentTab) {
      const buttonLabel = line.trim().slice(1, -1) // Remove [ and ]

      if (!currentTab.buttons) {
        currentTab.buttons = []
      }

      currentTab.buttons.push({
        label: buttonLabel,
        context: currentTab.title,
      })
    }
    // Check if this is a content line (bullet point)
    else if (line.startsWith("- ") && currentTab) {
      const contentLine = line.substring(2).trim()
      const parts = contentLine.split(":")

      if (parts.length >= 2) {
        const fieldName = parts[0].trim()
        const fieldValue = parts.slice(1).join(":").trim()

        // Initialize content if needed
        if (!currentTab.content) {
          currentTab.content = { headers: [], rows: [] }
        }

        // Track all field names to build headers
        if (!currentTab.content.headers?.includes(fieldName) && fieldName !== "ID") {
          currentTab.content.headers = [...(currentTab.content.headers || []), fieldName]
        }

        // Store the field in the record tracking
        const tabId = currentTab.title.replace(/\s+/g, "_").toLowerCase()

        // Use ID field to identify records, or create a default ID if none exists
        let recordId = "record_default"

        // Check if this is an ID field or if we're starting a new record
        if (fieldName === "ID") {
          recordId = `record_${fieldValue}`
          // Initialize a new record
          if (!recordsByTab[tabId][recordId]) {
            recordsByTab[tabId][recordId] = {}
          }
          lastRowIndex++
        } else {
          // Find the most recent record ID
          const recordIds = Object.keys(recordsByTab[tabId])
          recordId = recordIds.length > 0 ? recordIds[recordIds.length - 1] : "record_default"

          // Initialize if needed
          if (!recordsByTab[tabId][recordId]) {
            recordsByTab[tabId][recordId] = {}
          }
        }

        // Store the field value
        recordsByTab[tabId][recordId][fieldName] = fieldValue

        // If there's a pending note, associate it with this field
        if (pendingNote && currentTab) {
          const noteId = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`

          // Find the column index for this field
          const columnIndex = currentTab.content.headers.findIndex((header) => header === fieldName)

          if (columnIndex !== -1) {
            const designNote: DesignNote = {
              id: noteId,
              text: pendingNote.text,
              type: pendingNote.type,
              cellReference: {
                rowIndex: lastRowIndex,
                columnIndex,
                headerName: fieldName,
              },
            }

            currentTab.designNotes = currentTab.designNotes || []
            currentTab.designNotes.push(designNote)
          }

          // Reset pending note
          pendingNote = null
        }

        // Update last field name for potential future notes
        lastFieldName = fieldName
      }
    }
  }

  // Convert the record data to grid format for each tab
  for (const tab of structure.tabs) {
    processTabForGridDisplay(tab, recordsByTab)

    // Process child tabs recursively
    if (tab.children) {
      for (const childTab of tab.children) {
        processTabForGridDisplay(childTab, recordsByTab)
      }
    }
  }

  return structure
}

// Helper function to extract title and buttons from a line
function extractTitleAndButtons(text: string): { title: string; buttons?: Button[] } {
  const buttonRegex = /\[([^\]]+)\]/g
  const buttons: Button[] = []
  let match

  // Extract all button declarations
  while ((match = buttonRegex.exec(text)) !== null) {
    buttons.push({
      label: match[1],
    })
  }

  // Remove button declarations from the title
  const title = text.replace(buttonRegex, "").trim()

  return {
    title,
    buttons: buttons.length > 0 ? buttons : undefined,
  }
}

function processTabForGridDisplay(tab: TabItem, recordsByTab: Record<string, Record<string, Record<string, string>>>) {
  const tabId = tab.title.replace(/\s+/g, "_").toLowerCase()
  const records = recordsByTab[tabId]

  if (!records || Object.keys(records).length === 0) {
    return
  }

  // Ensure we have headers
  if (!tab.content) {
    tab.content = { headers: [], rows: [] }
  }

  // Add ID as the first header if it's not already there
  if (!tab.content.headers?.includes("ID")) {
    tab.content.headers = ["ID", ...(tab.content.headers || [])]
  }

  // Create rows from the records
  const rows: string[][] = []

  for (const recordId in records) {
    const record = records[recordId]
    const row: string[] = []

    // Add values for each header
    for (const header of tab.content.headers || []) {
      row.push(record[header] || "")
    }

    rows.push(row)
  }

  // Update the tab content
  tab.content.rows = rows
}
