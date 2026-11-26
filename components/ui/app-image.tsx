import Image, { type ImageProps } from "next/image";

export function AppImage({ loading, priority, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      alt={props.alt}
      priority={priority}
      loading={loading ?? (priority ? undefined : "lazy")}
    />
  );
}
