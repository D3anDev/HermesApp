import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { CustomBackgroundSettings } from '../../types';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
  title: string;
  customBackground?: CustomBackgroundSettings;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({ isOpen, onClose, onSave, initialName = '', title, customBackground }) => {
  const [name, setName] = useState(initialName);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialName]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      handleClose();
    }
  };

  if (!isOpen) return null;
  
  const modalStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground?.tileOpacity || 0.85})`,
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
        className={`rounded-lg shadow-xl p-6 w-full max-w-sm border border-border-color transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="my-4">
            <label htmlFor="preset-name" className="block text-lg font-medium text-text-secondary mb-1">Preset Name</label>
            <input
                type="text"
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
                className="w-full bg-primary border border-border-color text-text-primary rounded-md p-2 focus:ring-accent focus:border-accent text-base"
            />
        </div>

        <div className="flex justify-end items-center gap-4 mt-6">
            <button
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex items-center gap-2 px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                <Save size={16} />
                <span>Save</span>
            </button>
        </div>
      </div>
    </div>
  );
};