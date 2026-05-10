// types/gallery.ts
export interface GalleryItem {
  id: string;
  title: string;
  type: 'car' | 'event' | 'lifestyle';
  description: string;
  location: string;
  image: string;
  carName?: string;
  tags: string[];
}

