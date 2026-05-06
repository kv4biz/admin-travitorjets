// src/lib/supabase/storage.ts
import { createClient } from "@/lib/client";

/* -------------------------------- */
/* Helper: Sanitize filename for storage */
/* -------------------------------- */
function sanitizeFilename(filename: string): string {
  // Remove special characters and replace spaces with underscores
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "_") // Replace invalid chars with underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ""); // Trim underscores from start/end
}

/* -------------------------------- */
/* Generate clean file path with original name preserved */
/* -------------------------------- */
export function generateStoragePath({ userId, field, file }: { userId: string; field: string; file: File }) {
  const originalName = file.name;
  const ext = originalName.split(".").pop();
  const baseName = originalName.slice(0, originalName.lastIndexOf(".")) || originalName;

  // Sanitize the base name
  const cleanBaseName = sanitizeFilename(baseName);

  // Add timestamp and short random suffix to ensure uniqueness while preserving original name
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const fileName = `${cleanBaseName}-${timestamp}-${randomSuffix}.${ext}`;

  return `${userId}/${field}/${fileName}`;
}

/* -------------------------------- */
/* Generate temporary file path with original name preserved */
/* -------------------------------- */
export function generateTempStoragePath({ userId, field, file }: { userId: string; field: string; file: File }) {
  const originalName = file.name;
  const ext = originalName.split(".").pop();
  const baseName = originalName.slice(0, originalName.lastIndexOf(".")) || originalName;

  // Sanitize the base name
  const cleanBaseName = sanitizeFilename(baseName);

  // Add timestamp and short random suffix for temp files too
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const fileName = `${cleanBaseName}-${timestamp}-${randomSuffix}.${ext}`;

  return `temp/${userId}/${field}/${fileName}`;
}

/* -------------------------------- */
/* Alternative: Generate path with original name only (no random suffix) */
/* -------------------------------- */
export function generateStoragePathWithOriginalName({
  userId,
  field,
  file,
  addTimestamp = true,
  addRandomSuffix = true,
}: {
  userId: string;
  field: string;
  file: File;
  addTimestamp?: boolean;
  addRandomSuffix?: boolean;
}) {
  const originalName = file.name;
  const ext = originalName.split(".").pop();
  const baseName = originalName.slice(0, originalName.lastIndexOf(".")) || originalName;

  // Sanitize the base name
  const cleanBaseName = sanitizeFilename(baseName);

  let fileName = cleanBaseName;

  if (addTimestamp && addRandomSuffix) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    fileName = `${cleanBaseName}-${timestamp}-${randomSuffix}`;
  } else if (addTimestamp) {
    const timestamp = Date.now();
    fileName = `${cleanBaseName}-${timestamp}`;
  } else if (addRandomSuffix) {
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    fileName = `${cleanBaseName}-${randomSuffix}`;
  }

  return `${userId}/${field}/${fileName}.${ext}`;
}

/* -------------------------------- */
/* Upload file to Supabase bucket */
/* -------------------------------- */
export async function uploadToBucket({ file, bucket, path }: { file: File; bucket: string; path: string }): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return urlData.publicUrl;
}

/* -------------------------------- */
/* Upload file to temp folder */
/* -------------------------------- */
export async function uploadToTempBucket({
  file,
  bucket,
  userId,
  field,
}: {
  file: File;
  bucket: string;
  userId: string;
  field: string;
}): Promise<{ url: string; tempPath: string }> {
  const tempPath = generateTempStoragePath({ userId, field, file });
  const url = await uploadToBucket({ file, bucket, path: tempPath });
  return { url, tempPath };
}

/* -------------------------------- */
/* Helper: Check if file exists in bucket */
/* -------------------------------- */
async function fileExists(bucket: string, path: string): Promise<boolean> {
  const supabase = createClient();

  try {
    // List files in the directory to check existence
    const pathParts = path.split("/");
    const fileName = pathParts.pop();
    const directory = pathParts.join("/");

    const { data, error } = await supabase.storage.from(bucket).list(directory, {
      search: fileName,
      limit: 1,
    });

    if (error) {
      console.warn(`Error checking file existence for ${path}:`, error.message);
      return false;
    }

    return data && data.length > 0;
  } catch (err) {
    console.warn(`Exception checking file existence for ${path}:`, err);
    return false;
  }
}

/* -------------------------------- */
/* Helper: Check if file exists using multiple methods */
/* -------------------------------- */
async function verifyFileExists(bucket: string, path: string): Promise<boolean> {
  // Method 1: List files
  const exists = await fileExists(bucket, path);
  if (exists) return true;

  // Method 2: Try to get signed URL as fallback
  const supabase = createClient();
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 1)
    .catch(() => ({ data: null, error: null }));

  if (!signedUrlError && signedUrlData) {
    return true;
  }

  return false;
}

/* -------------------------------- */
/* 🔥 CORRECTED: Move file from temp to final using copy + delete (most reliable) */
/* -------------------------------- */
export async function moveTempToFinal({
  bucket,
  tempPath,
  finalPath,
  quiet = false,
}: {
  bucket: string;
  tempPath: string;
  finalPath: string;
  quiet?: boolean;
}): Promise<string> {
  const supabase = createClient();

  const getPublicUrl = () => supabase.storage.from(bucket).getPublicUrl(finalPath).data.publicUrl;

  if (!quiet) {
    console.log(`Moving file: ${tempPath} -> ${finalPath}`);
  }

  // 1. Check if final file already exists (idempotency)
  const finalExists = await verifyFileExists(bucket, finalPath);

  if (finalExists) {
    if (!quiet) {
      console.log("Final file already exists, cleaning up temp file.");
    }
    // Clean up temp file if it exists
    try {
      await supabase.storage.from(bucket).remove([tempPath]);
    } catch (err) {
      // Ignore cleanup errors
      if (!quiet) console.warn("Temp file cleanup failed (non-critical):", err);
    }
    return getPublicUrl();
  }

  // 2. Check if temp file exists before attempting move
  const tempExists = await verifyFileExists(bucket, tempPath);

  if (!tempExists) {
    if (!quiet) {
      console.warn(`Temp file not found: ${tempPath}`);
    }
    // If temp doesn't exist but final doesn't either, something's wrong
    throw new Error(`Cannot move: temp file ${tempPath} does not exist`);
  }

  // 3. Use copy + delete approach (more reliable than move)
  if (!quiet) {
    console.log("Copying file to final location...");
  }

  const { error: copyError } = await supabase.storage.from(bucket).copy(tempPath, finalPath);

  if (copyError) {
    // Check if copy failed but file somehow exists at destination
    const finalExistsAfterCopy = await verifyFileExists(bucket, finalPath);
    if (finalExistsAfterCopy) {
      if (!quiet) {
        console.log("Copy reported error but final file exists. Assuming success.");
      }
      await cleanupTempFile(bucket, tempPath, quiet);
      return getPublicUrl();
    }

    // Genuine copy failure
    console.error("Copy failed:", copyError);
    throw new Error(`Failed to copy file: ${copyError.message}`);
  }

  // 4. Copy succeeded, now delete temp file
  if (!quiet) {
    console.log("Copy successful, deleting temp file...");
  }

  await cleanupTempFile(bucket, tempPath, quiet);

  if (!quiet) {
    console.log("File moved successfully via copy + delete.");
  }

  return getPublicUrl();
}

/* -------------------------------- */
/* Helper: Clean up temp file with retries */
/* -------------------------------- */
async function cleanupTempFile(bucket: string, tempPath: string, quiet: boolean = false): Promise<void> {
  const supabase = createClient();
  let retries = 3;

  while (retries > 0) {
    try {
      const { error: deleteError } = await supabase.storage.from(bucket).remove([tempPath]);

      if (!deleteError) {
        if (!quiet) console.log("Temp file deleted successfully.");
        return;
      }

      // File not found is fine (already cleaned)
      if (deleteError.message?.includes("not found")) {
        if (!quiet) console.log("Temp file already gone.");
        return;
      }

      // Other error, retry
      retries--;
      if (retries > 0) {
        if (!quiet) console.log(`Temp deletion failed, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else {
        if (!quiet) console.warn("Temp file deletion failed after retries (non-critical):", deleteError);
      }
    } catch (err) {
      retries--;
      if (retries === 0) {
        if (!quiet) console.warn("Temp file cleanup error (non-critical):", err);
      }
    }
  }
}

/* -------------------------------- */
/* Alternative: Original move with better error handling (kept for backward compatibility) */
/* -------------------------------- */
export async function moveTempToFinalLegacy({
  bucket,
  tempPath,
  finalPath,
  quiet = false,
}: {
  bucket: string;
  tempPath: string;
  finalPath: string;
  quiet?: boolean;
}): Promise<string> {
  const supabase = createClient();
  const getPublicUrl = () => supabase.storage.from(bucket).getPublicUrl(finalPath).data.publicUrl;

  // First check if final already exists
  const finalExists = await verifyFileExists(bucket, finalPath);
  if (finalExists) {
    if (!quiet) console.log("Final file exists, skipping move.");
    await cleanupTempFile(bucket, tempPath, quiet);
    return getPublicUrl();
  }

  // Try the move operation
  const { error: moveError } = await supabase.storage.from(bucket).move(tempPath, finalPath);

  if (moveError) {
    // Move failed, but check if final file appeared anyway
    const finalExistsAfterMove = await verifyFileExists(bucket, finalPath);

    if (finalExistsAfterMove) {
      if (!quiet) {
        console.log("Move reported error but file exists at destination. Operation likely succeeded.");
      }
      await cleanupTempFile(bucket, tempPath, quiet);
      return getPublicUrl();
    }

    // Check if temp file still exists
    const tempStillExists = await verifyFileExists(bucket, tempPath);

    if (tempStillExists) {
      // Move failed and temp still exists, try copy + delete as fallback
      if (!quiet) console.log("Move failed, trying copy + delete fallback...");

      const { error: copyError } = await supabase.storage.from(bucket).copy(tempPath, finalPath);

      if (!copyError) {
        await cleanupTempFile(bucket, tempPath, quiet);
        if (!quiet) console.log("Copy + delete fallback succeeded.");
        return getPublicUrl();
      }

      throw new Error(`Failed to move file: ${moveError.message}`);
    } else {
      // Temp is gone but final doesn't exist - this is bad
      if (!quiet) console.error("Move failed and both files missing:", moveError);
      throw new Error(`File lost during move operation: ${moveError.message}`);
    }
  }

  if (!quiet) console.log("Move successful.");
  return getPublicUrl();
}

/* -------------------------------- */
/* Extract path from URL */
/* -------------------------------- */
export function getPathFromUrl(url: string, bucket: string) {
  const parts = url.split(`/storage/v1/object/public/${bucket}/`);
  return parts[1];
}

/* -------------------------------- */
/* Delete from bucket */
/* -------------------------------- */
export async function deleteFromBucket({ bucket, paths }: { bucket: string; paths: string[] }) {
  const supabase = createClient();
  if (!paths.length) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    console.error("Storage delete error:", error);
    throw error;
  }
}
