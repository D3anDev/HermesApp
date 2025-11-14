import React, { useState, useEffect, useRef } from 'react';
import type { RssArticle, CustomBackgroundSettings } from '../../types';
import { X, ExternalLink, Bookmark } from 'lucide-react';

interface ArticleDetailModalProps {
  article: RssArticle | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: RssArticle) => void;
  onViewImage: (url: string) => void;
  customBackground: CustomBackgroundSettings;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, isOpen, onClose, isBookmarked, onToggleBookmark, onViewImage, customBackground }) => {
  const [show, setShow] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement || !onViewImage) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        // If the image is wrapped in a link, prevent default navigation
        if (target.parentElement?.tagName === 'A') {
          event.preventDefault();
        }
        const imageUrl = target.getAttribute('src');
        if (imageUrl) {
          onViewImage(imageUrl);
        }
      }
    };

    contentElement.addEventListener('click', handleClick);

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('click', handleClick);
      }
    };
  }, [article, onViewImage]);


  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen || !article) return null;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(article);
  };

  const modalStyle = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.tileOpacity})`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] border border-border-color flex flex-col overflow-hidden transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="relative">
          {article.imageUrl && (
            <>
              <img src={article.imageUrl} alt={article.title} className="w-full h-64 object-cover" />
              {/* FIX: Removed invalid 'from' property from inline style object */}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent"></div>
            </>
          )}
          <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 rounded-full p-2 z-20" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto scrollbar-thin">
            <p className="text-base text-accent font-semibold mb-1">{article.source} &bull; {new Date(article.date).toLocaleDateString()}</p>
            <h2 className="text-4xl font-bold text-text-primary mb-4">{article.title}</h2>
            <div 
              ref={contentRef}
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            ></div>
        </div>
        <div className="p-6 border-t border-border-color bg-primary flex justify-between items-center">
            <button
                onClick={handleBookmarkClick}
                title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors"
            >
                <Bookmark className={`w-4 h-4 transition-all ${isBookmarked ? 'fill-accent text-accent' : 'text-text-secondary'}`} />
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            <a
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base"
            >
                <span>Read More</span>
                <ExternalLink size={16} />
            </a>
        </div>
      </div>
    </div>
  );
};