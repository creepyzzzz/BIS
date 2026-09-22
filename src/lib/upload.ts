import { supabase } from "@/lib/supabase";

/**
 * Uploads any file or blob directly to Supabase Storage in the 'compliance-documents' bucket.
 * Returns public access URL and storage path.
 */
export async function uploadToStorage(
  file: File | Blob,
  filename: string,
  folder: string = "certificates"
): Promise<{ fileUrl: string; key: string }> {
  const timestamp = Date.now();
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${folder}/${timestamp}-${cleanName}`;

  const { data, error } = await supabase.storage
    .from("compliance-documents")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(error.message || "Failed to upload to Supabase Storage");
  }

  const { data: publicUrlData } = supabase.storage
    .from("compliance-documents")
    .getPublicUrl(path);

  return {
    fileUrl: publicUrlData.publicUrl,
    key: path,
  };
}

// Backward compatible export
export const uploadToR2 = uploadToStorage;
