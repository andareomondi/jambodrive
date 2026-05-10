// app/gallery/page.tsx
import { galleryData } from "@/data/gallery";
import SwipeGalleryMobile from "@/components/gallery/SwipeGalleryMobile";
import DesktopScrollGallery from "@/components/gallery/DesktopScrollGallery";
import GalleryNavbar from "@/components/gallery/GalleryNavbar";

export default function GalleryPage() {
  return (
    <main className="bg-gray-50 min-h-screen">
      <GalleryNavbar />

      {/* Mobile Experience: Tinder/TikTok style swipe */}
      <div className="block md:hidden h-[calc(100vh-64px)] pt-16">
        <SwipeGalleryMobile items={galleryData} />
      </div>

      {/* Desktop Experience: Cinematic Vertical Scroll */}
      <div className="hidden md:block">
        <DesktopScrollGallery items={galleryData} />
      </div>
    </main>
  );
}
