"use server"

import { getSupabaseServerClient } from "@/lib/supabase"

export async function saveMockup(title: string, markup: string, documentation = "") {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from("mockups")
      .insert([{ title, markup, documentation }])
      .select("id")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, id: data.id }
  } catch (error) {
    console.error("Error saving mockup:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateMockup(id: string, title: string, markup: string, documentation = "") {
  try {
    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from("mockups")
      .update({ title, markup, documentation, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, id }
  } catch (error) {
    console.error("Error updating mockup:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getMockupById(id: string) {
  try {
    const supabase = getSupabaseServerClient()

    console.log(`Server: Fetching mockup with ID: ${id}`)

    const { data, error } = await supabase.from("mockups").select("*").eq("id", id).single()

    if (error) {
      console.error(`Server: Error fetching mockup ${id}:`, error)
      throw new Error(error.message)
    }

    console.log(`Server: Successfully fetched mockup ${id}`)
    return { success: true, mockup: data }
  } catch (error) {
    console.error("Error retrieving mockup:", error)
    return { success: false, error: (error as Error).message }
  }
}

// New function to check if a mockup ID exists
export async function checkMockupExists(id: string) {
  try {
    const supabase = getSupabaseServerClient()

    const { count, error } = await supabase.from("mockups").select("*", { count: "exact", head: true }).eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, exists: count > 0 }
  } catch (error) {
    console.error("Error checking mockup existence:", error)
    return { success: false, error: (error as Error).message, exists: false }
  }
}

// Get all available mockups (for reference)
export async function getAllMockups() {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase.from("mockups").select("id, title").order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, mockups: data }
  } catch (error) {
    console.error("Error retrieving mockups:", error)
    return { success: false, error: (error as Error).message, mockups: [] }
  }
}

// New function to get linked mockups
export async function getLinkedMockups(mockupId: string) {
  try {
    const supabase = getSupabaseServerClient()

    // First get the main mockup
    const { data: mockup, error: mockupError } = await supabase.from("mockups").select("*").eq("id", mockupId).single()

    if (mockupError) {
      throw new Error(mockupError.message)
    }

    // Extract all mockup IDs referenced in the markup
    const linkRegex = /\[mockup:([a-zA-Z0-9-_]+)\]/g
    const linkedIds: string[] = []
    let match

    while ((match = linkRegex.exec(mockup.markup)) !== null) {
      if (match[1] && !linkedIds.includes(match[1])) {
        linkedIds.push(match[1])
      }
    }

    // If no linked mockups, return empty array
    if (linkedIds.length === 0) {
      return { success: true, linkedMockups: [] }
    }

    // Get all linked mockups
    const { data: linkedMockups, error: linkedError } = await supabase
      .from("mockups")
      .select("id,title")
      .in("id", linkedIds)

    if (linkedError) {
      throw new Error(linkedError.message)
    }

    return { success: true, linkedMockups }
  } catch (error) {
    console.error("Error retrieving linked mockups:", error)
    return { success: false, error: (error as Error).message, linkedMockups: [] }
  }
}
