"use client"

import type React from "react"

import { useState } from "react"
import { X, Save, Trash, ArrowLeft } from "lucide-react"

interface DetailFormProps {
  data: string[]
  headers: string[]
  onClose: () => void
}

export function DetailForm({ data, headers, onClose }: DetailFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    headers.forEach((header, index) => {
      initialData[header] = data[index] || ""
    })
    return initialData
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the data here
    console.log("Form submitted:", formData)
    onClose()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-md">
      <div className="bg-blue-900 text-white p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded">
            <ArrowLeft size={16} />
          </button>
          <h3 className="text-sm font-medium">Edit Record</h3>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-blue-800 rounded text-red-300 hover:text-red-100">
            <Trash size={16} />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-blue-800 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {headers.map((header, index) => (
            <div key={index} className="space-y-1">
              <label htmlFor={`field-${index}`} className="block text-sm font-medium text-slate-700">
                {header}
              </label>
              <input
                type="text"
                id={`field-${index}`}
                value={formData[header] || ""}
                onChange={(e) => handleChange(header, e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800 flex items-center gap-1"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
