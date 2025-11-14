import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Save } from 'lucide-react';

interface BackgroundAdjustModalProps {
  imageUrl: string;
  initialSettings: {
    zoom: number;
    positionX: number;
    positionY: number;
  };
  onClose: () => void;
  onSave: (newSettings: { zoom: number; positionX: number; positionY: number }) => void;
}

export const BackgroundAdjustModal: React.FC<BackgroundAdjustModalProps> = ({ imageUrl, initialSettings, onClose, onSave }) => {
  const [zoom, setZoom] = useState(initialSettings.zoom);
  const [position, setPosition] = useState({ x: initialSettings.positionX, y: initialSettings.positionY });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const rect = containerRef.current.getBoundingClientRect();
    const percentDx = (dx / rect.width) * 100 * (100 / zoom);
    const percentDy = (dy / rect.height) * 100 * (100 / zoom);

    setPosition(prev => ({
        x: Math.max(0, Math.min(100, prev.x - percentDx)),
        y: Math.max(0, Math.min(100, prev.y - percentDy)),
    }));

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };
  
  const handleSave = () => {
    onSave({ zoom, positionX: position.x, positionY: position.y });
  };

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${zoom}%`,
          backgroundPosition: `${position.x}% ${position.y}%`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={handleClose} className="text-white/80 hover:text-white bg-black/50 backdrop-blur-sm rounded-full p-3" aria-label="Close">
            <X size={24} />
        </button>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div className="bg-secondary/90 backdrop-blur-md border border-border-color p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-grow">
                <ZoomOut size={20} className="text-text-secondary" />
                <input
                    type="range"
                    min="100"
                    max="300"
                    step="1"
                    value={zoom}
                    onChange={(e) => setZoom(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-border-color rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <ZoomIn size={20} className="text-text-secondary" />
                <span className="text-text-primary font-mono w-16 text-center">{zoom}%</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base"
                >
                    <Save size={16} />
                    <span>Save Position</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};