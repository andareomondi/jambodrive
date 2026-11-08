import Image, { type ImageProps } from "next/image";

function isSupabaseStorageImage(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;

  try {
    const url = new URL(src);
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

export function AppImage({
  loading,
  priority,
  unoptimized,
  ...props
}: ImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt}
      priority={priority}
      loading={loading ?? (priority ? undefined : "lazy")}
      unoptimized={unoptimized || isSupabaseStorageImage(props.src)}
    />
  );
}
