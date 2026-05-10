"use client";

import { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { MapPin, ChevronRight, X } from "lucide-react";
import { GalleryItem } from "@/types/gallery";

interface Props {
  items: GalleryItem[];
}

export default function SwipeGalleryMobile({ items }: Props) {
  const [cards, setCards] = useState<GalleryItem[]>(items);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      // Swiped far enough, remove top card
      setCards((prev) => prev.slice(1));
    }
  };

  const handleAction = (direction: "left" | "right") => {
    setCards((prev) => prev.slice(1));
  };

  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You're caught up
        </h3>
        <p className="text-gray-500 mb-6">
          Check back later for more premium experiences.
        </p>
        <button
          onClick={() => setCards(items)}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-medium"
        >
          View Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center bg-gray-900">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isTop = index === 0;
          return (
            <motion.div
              key={card.id}
              className="absolute w-[92%] h-[85%] bg-white rounded-3xl shadow-xl overflow-hidden will-change-transform"
              style={{
                zIndex: cards.length - index,
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                opacity: isTop ? opacity : 1 - index * 0.15,
                scale: 1 - index * 0.05,
                top: `${index * 12}px`,
              }}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              onDragEnd={isTop ? handleDragEnd : undefined}
              initial={false}
              animate={{ scale: 1 - index * 0.05, top: `${index * 12}px` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {/* Image Background */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${card.image})` }}
              />
              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white pb-24">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-orange-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {card.type}
                  </span>
                  <div className="flex items-center text-sm text-gray-200">
                    <MapPin className="w-4 h-4 mr-1" />
                    {card.location}
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-1">{card.title}</h2>
                {card.carName && (
                  <p className="text-xl font-medium text-orange-400 mb-2">
                    {card.carName}
                  </p>
                )}
                <p className="text-sm text-gray-300 line-clamp-2">
                  {card.description}
                </p>

                <div className="flex gap-2 mt-4">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Floating Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-50">
        <button
          onClick={() => handleAction("left")}
          className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleAction("right")}
          className="w-14 h-14 bg-orange-600 shadow-lg shadow-orange-600/30 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
