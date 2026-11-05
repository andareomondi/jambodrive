"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const total = images.length;

  const prev = useCallback(
    () => onIndexChange((index - 1 + total) % total),
    [index, total, onIndexChange],
  );
  const next = useCallback(
    () => onIndexChange((index + 1) % total),
    [index, total, onIndexChange],
  );

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, prev, next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-medium tracking-wider text-white/60">
        {index + 1} / {total}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous image"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next image"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <div
        className="relative w-full h-full max-w-6xl max-h-[85vh] mx-auto touch-pan-y select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[index]}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
          priority
          draggable={false}
        />
      </div>

      {total > 1 && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-white/50 md:hidden">
          Swipe to browse
        </p>
      )}
    </div>
  );
}
