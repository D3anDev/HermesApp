import React from 'react';
import type { BookmarkedImage, BookmarkedItem } from '../../types';
import { X, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

interface SideImageViewerProps {
  show: boolean;
  images: BookmarkedImage[];
  currentIndex: number;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (item: BookmarkedItem) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
}

export const SideImageViewer: React.FC<SideImageViewerProps> = ({ show, images, currentIndex, onClose, isBookmarked, onToggleBookmark, onNavigate }) => {
  const currentImage = images[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < images.length - 1;

  if (!currentImage) return null;

  return (
    <div className={`bg-secondary w-full h-full rounded-lg shadow-xl border border-border-color flex flex-col relative overflow-hidden transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <img src={currentImage.imageUrl} alt={currentImage.title} className="w-full h-full object-contain" />
      
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-white drop-shadow-lg">{currentImage.title}</h3>
            {images.length > 1 && (
              <p className="text-lg text-gray-300 drop-shadow">{currentIndex + 1} / {images.length}</p>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white bg-black/40 rounded-full p-2" aria-label="Close image view">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canGoPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={!canGoNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={() => onToggleBookmark(currentImage)}
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:text-accent transition-colors"
        >
          <Bookmark className={`w-6 h-6 transition-all ${isBookmarked ? 'fill-accent text-accent' : 'fill-transparent'}`} />
        </button>
      </div>
    </div>
  );
};