// components/gallery/GalleryNavbar.tsx
import Link from "next/link";

export default function GalleryNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 flex items-center px-6 md:px-12 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          C
        </div>
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Cosmara
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <Link href="/fleet" className="hover:text-orange-600 transition-colors">
          Fleet
        </Link>
        <Link href="/gallery" className="text-orange-600">
          Gallery
        </Link>
        <Link
          href="/contact"
          className="hover:text-orange-600 transition-colors"
        >
          Contact Us
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden md:block text-sm font-medium text-gray-900 hover:text-orange-600">
          Sign In
        </button>
        <button className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
          Sign Up
        </button>
      </div>
    </nav>
  );
}
