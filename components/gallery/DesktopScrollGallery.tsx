"use client";

import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { GalleryItem } from "@/types/gallery";

interface Props {
  items: GalleryItem[];
}

export default function DesktopScrollGallery({ items }: Props) {
  return (
    <div className="h-screen w-full snap-y snap-mandatory overflow-y-auto scroll-smooth bg-white">
      {items.map((item, index) => (
        <section
          key={item.id}
          className="h-screen w-full snap-start relative flex items-center justify-center pt-16"
        >
          <div className="max-w-7xl w-full mx-auto px-8 h-[85vh] flex gap-12 items-center">
            {/* Left side: Cinematic Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, margin: "-100px" }}
              className="w-[60%] h-full relative rounded-[2rem] overflow-hidden shadow-2xl group"
            >
              <motion.div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>

            {/* Right side: Floating Details Panel */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="w-[40%] flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-orange-600 font-semibold uppercase tracking-widest text-sm">
                  {item.type}
                </span>
                <div className="h-px w-12 bg-orange-200" />
                <div className="flex items-center text-sm text-gray-500 font-medium">
                  <MapPin className="w-4 h-4 mr-1" />
                  {item.location}
                </div>
              </div>

              <h2 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
                {item.title}
              </h2>

              {item.carName && (
                <h3 className="text-2xl text-gray-700 font-medium mb-6">
                  {item.carName}
                </h3>
              )}

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors flex items-center group">
                  Book This Experience
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator (Hide on last item) */}
          {index !== items.length - 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
              <span className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                Scroll
              </span>
              <div className="w-[1px] h-8 bg-gray-300" />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
