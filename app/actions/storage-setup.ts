"use server"

import { getSupabaseServerClient } from "@/lib/supabase"

export async function setupStorageBucket() {
  try {
    const supabase = getSupabaseServerClient()

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw new Error(`Error checking buckets: ${listError.message}`)
    }

    const bucketExists = buckets.some((bucket) => bucket.name === "mockup-assets")

    if (!bucketExists) {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket("mockup-assets", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      })

      if (error) {
        throw new Error(`Error creating bucket: ${error.message}`)
      }

      return { success: true, message: "Storage bucket created successfully" }
    }

    return { success: true, message: "Storage bucket already exists" }
  } catch (error) {
    console.error("Error setting up storage:", error)
    return { success: false, error: (error as Error).message }
  }
}
