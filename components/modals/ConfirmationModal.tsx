


import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { ConfirmationModalProps, CustomBackgroundSettings } from '../../types'; // Import from types.ts

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Confirm', // Default text for confirm button
  cancelText = 'Cancel',   // Default text for cancel button
  onCloseWithCustomAction, // New prop for custom action on cancel button
  isDestructive = false,   // New prop for destructive styling
  customBackground,        // New prop for background styling
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Use a timeout to allow the component to mount before starting the transition
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Match animation duration
  };

  const handleConfirmClick = () => {
    onConfirm();
    handleClose();
  };
  
  // Handle "cancel" button click, potentially with a custom action
  const handleCancelClick = () => {
    if (onCloseWithCustomAction) {
      onCloseWithCustomAction();
    }
    handleClose();
  }
  
  if (!isOpen) {
    return null;
  }

  const modalStyle: React.CSSProperties = {
      backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground?.tileOpacity || 0.85})`,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
  };

  const confirmButtonClasses = isDestructive
    ? 'px-6 py-2 rounded-md text-white bg-red-700 hover:bg-red-800 transition-colors font-semibold text-base'
    : 'px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base';

  const cancelButtonClasses = isDestructive
    ? 'px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base' // Standard cancel button for destructive
    : 'px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base';

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
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-900/20' : 'bg-accent/10'}`}>
              <AlertTriangle className={`w-6 h-6 ${isDestructive ? 'text-red-400' : 'text-accent'}`} />
            </div>
            <h2 id="modal-title" className="text-3xl font-bold text-text-primary">{title}</h2>
          </div>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="my-4 text-text-secondary text-lg">
          {message}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={handleCancelClick}
            className={cancelButtonClasses}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            className={confirmButtonClasses}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};