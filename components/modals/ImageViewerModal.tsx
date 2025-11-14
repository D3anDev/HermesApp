import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Article image" 
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-xl" 
        />
        <div className="absolute top-4 right-4 flex items-center gap-2">
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white bg-black/40 rounded-full p-2" aria-label="Open image in new tab">
                <ExternalLink size={24} />
            </a>
            <button onClick={handleClose} className="text-white/70 hover:text-white bg-black/40 rounded-full p-2" aria-label="Close image view">
                <X size={24} />
            </button>
        </div>
      </div>
    </div>
  );
};
