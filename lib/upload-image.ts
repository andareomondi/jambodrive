import { createClient } from "@/lib/supabase/client";

const BUCKET = "car-images";
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`);
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
  }
}

function buildPath(file: File): string {
  // Sanitise filename — strip spaces and special chars
  const sanitised = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `cars/${Date.now()}-${sanitised}`;
}

// ── Single upload ──────────────────────────────────────────────────────────────

export async function uploadCarImage(file: File): Promise<string> {
  validateFile(file);

  const supabase = createClient();
  const path = buildPath(file);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Parallel multi-upload — much faster than sequential ──────────────────────

export async function uploadCarImages(files: File[]): Promise<string[]> {
  // Validate all files before touching the network
  files.forEach(validateFile);

  const results = await Promise.allSettled(
    files.map((file) => uploadCarImage(file))
  );

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      urls.push(result.value);
    } else {
      errors.push(`${files[i].name}: ${result.reason?.message ?? "Unknown error"}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Some uploads failed:\n${errors.join("\n")}`);
  }

  return urls;
}

// ── Delete single image ────────────────────────────────────────────────────────

export async function deleteCarImage(url: string): Promise<void> {
  const supabase = createClient();
  const path = url.split(`/${BUCKET}/`)[1];
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ── Delete multiple images in one storage call ────────────────────────────────

export async function deleteCarImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  const supabase = createClient();
  const paths = urls
    .map((url) => url.split(`/${BUCKET}/`)[1])
    .filter(Boolean);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(`Bulk delete failed: ${error.message}`);
}
