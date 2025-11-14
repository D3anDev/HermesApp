import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

const CROP_AREA_SIZE = 300;
const OUTPUT_SIZE = 256; // Final profile pic resolution

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onClose, onSave }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const handleLoad = () => {
      const { naturalWidth, naturalHeight } = img;
      const newScale = Math.max(CROP_AREA_SIZE / naturalWidth, CROP_AREA_SIZE / naturalHeight);
      setScale(newScale);

      const initialX = (naturalWidth * newScale - CROP_AREA_SIZE) / -2;
      const initialY = (naturalHeight * newScale - CROP_AREA_SIZE) / -2;
      setPosition({ x: initialX, y: initialY });
    };

    if (img.complete) {
        handleLoad();
    } else {
        img.addEventListener('load', handleLoad);
    }
    
    return () => {
        img.removeEventListener('load', handleLoad)
    };
  }, [imageSrc]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    
    const img = imageRef.current;
    if (!img) return;
    
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;
    const minX = CROP_AREA_SIZE - scaledWidth;
    const minY = CROP_AREA_SIZE - scaledHeight;
    const clampedX = Math.max(minX, Math.min(0, x));
    const clampedY = Math.max(minY, Math.min(0, y));

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    const img = imageRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const sourceX = -position.x / scale;
    const sourceY = -position.y / scale;
    const sourceSize = CROP_AREA_SIZE / scale;
    
    ctx.drawImage(
      img,
      sourceX, sourceY,
      sourceSize, sourceSize,
      0, 0,
      OUTPUT_SIZE, OUTPUT_SIZE
    );
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    onSave(dataUrl);
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`rounded-lg shadow-xl p-6 w-full max-w-sm border border-border-color transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'rgba(22, 27, 34, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Crop Profile Picture</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <p className="text-text-secondary mb-4 text-base">Drag the image to position it inside the square.</p>
        <div
          className="relative rounded-lg overflow-hidden bg-primary"
          style={{ width: CROP_AREA_SIZE, height: CROP_AREA_SIZE }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            onMouseDown={handleMouseDown}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? 'grabbing' : 'grab',
              transformOrigin: 'top left',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
            alt="Image to crop"
            draggable="false"
          />
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};