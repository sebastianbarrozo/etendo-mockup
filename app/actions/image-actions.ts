"use server"

import { getSupabaseServerClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export async function uploadImage(formData: FormData) {
  try {
    const supabase = getSupabaseServerClient()
    const file = formData.get("file") as File

    if (!file) {
      throw new Error("No file provided")
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not supported. Please upload a JPEG, PNG, GIF, or WebP image.")
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit.")
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `mockup-images/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("mockup-assets").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw new Error(`Error uploading image: ${error.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("mockup-assets").getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}
