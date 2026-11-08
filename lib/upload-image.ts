import { createClient } from "@/lib/supabase/client";

const BUCKET = "car-images";
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`,
    );
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`);
  }
}

function buildPath(file: File, folder: "cars" | "events"): string {
  const sanitised = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${folder}/${Date.now()}-${sanitised}`;
}

async function optimizeImage(file: File): Promise<File> {
  if (
    file.type === "image/gif" ||
    file.size < 350 * 1024 ||
    typeof createImageBitmap === "undefined"
  ) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === "image/webp") return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare the image for upload.");

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob) throw new Error("Could not encode the image for upload.");
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${name}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

// ── Single upload ──────────────────────────────────────────────────────────────

export async function uploadCarImage(file: File): Promise<string> {
  validateFile(file);

  const optimizedFile = await optimizeImage(file);
  const supabase = createClient();
  const path = buildPath(optimizedFile, "cars");

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimizedFile, {
      upsert: false,
      cacheControl: "31536000",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Parallel multi-upload — much faster than sequential ──────────────────────

export async function uploadCarImages(files: File[]): Promise<string[]> {
  // Validate all files before touching the network
  files.forEach(validateFile);

  const results: PromiseSettledResult<string>[] = [];
  for (let i = 0; i < files.length; i += 2) {
    results.push(
      ...(await Promise.allSettled(
        files.slice(i, i + 2).map((file) => uploadCarImage(file)),
      )),
    );
  }

  const urls: string[] = [];
  const errors: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      urls.push(result.value);
    } else {
      errors.push(
        `${files[i].name}: ${result.reason?.message ?? "Unknown error"}`,
      );
    }
  });

  if (errors.length > 0) {
    throw new Error(`Some uploads failed:\n${errors.join("\n")}`);
  }

  return urls;
}

// ── Event image upload — uses events/ subfolder ───────────────────────────────
// Kept separate from car images so storage policies can be scoped per folder
// if needed, and so car-images/events/* is visually distinct in the bucket.

export async function uploadEventImage(file: File): Promise<string> {
  validateFile(file);

  const optimizedFile = await optimizeImage(file);
  const supabase = createClient();
  const path = buildPath(optimizedFile, "events");

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimizedFile, {
      upsert: false,
      cacheControl: "31536000",
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

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
  const paths = urls.map((url) => url.split(`/${BUCKET}/`)[1]).filter(Boolean);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(`Bulk delete failed: ${error.message}`);
}
