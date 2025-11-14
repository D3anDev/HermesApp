import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal, StopCircle } from 'lucide-react';
import { CustomBackgroundSettings } from '../../types';

interface FetchProgress {
  total: number;
  current: number;
  fetchingTitle: string;
  inProgress: boolean;
}

interface FetchLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  fetchProgress: FetchProgress;
  onStopFetching: () => void;
  customBackground: CustomBackgroundSettings;
}

export const FetchLogModal: React.FC<FetchLogModalProps> = ({ isOpen, onClose, logs, fetchProgress, onStopFetching, customBackground }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to the bottom when new logs are added
    if (isOpen && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen) {
    return null;
  }

  const progressPercentage = fetchProgress.total > 0 ? (fetchProgress.current / fetchProgress.total) * 100 : 0;

  const modalStyle: React.CSSProperties = {
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
        className={`rounded-lg shadow-xl w-full max-w-2xl h-[70vh] border border-border-color flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-accent" />
            <h2 id="modal-title" className="text-2xl font-bold text-text-primary">Background Fetch Log</h2>
          </div>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div
          ref={logContainerRef}
          className="flex-grow p-4 bg-primary overflow-y-auto scrollbar-thin font-mono text-base"
        >
          {logs.map((log, index) => (
            <p key={index} className="whitespace-pre-wrap leading-relaxed">
              <span className="text-text-secondary/80 mr-2">{log.substring(0, 10)}</span>
              <span className={`
                ${log.includes('✅ Success') ? 'text-green-400' : ''}
                ${log.includes('❌ Error') || log.includes('Rate limit hit') ? 'text-red-400' : ''}
                ${log.includes('ℹ️') ? 'text-yellow-400' : ''}
                ${log.includes('terminated') || log.includes('Stop request') ? 'text-yellow-300' : ''}
              `}>
                {log.substring(11)}
              </span>
            </p>
          ))}
        </div>

        <div className="p-4 border-t border-border-color flex-shrink-0 bg-primary/50">
          {fetchProgress.inProgress ? (
            <div className="flex items-center gap-4">
              <div className="flex-grow min-w-0">
                <div className="flex justify-between text-sm text-text-secondary mb-1">
                  <span className="truncate pr-2">Fetching: {fetchProgress.fetchingTitle || 'Initializing...'}</span>
                  <span>{fetchProgress.current}/{fetchProgress.total}</span>
                </div>
                <div className="w-full bg-primary rounded-full h-2 overflow-hidden border border-border-color">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={onStopFetching}
                className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-red-900/50 text-red-400 rounded-md hover:bg-red-900/70 transition-colors"
                aria-label="Stop background fetch"
              >
                <StopCircle size={18} />
                <span>Stop</span>
              </button>
            </div>
          ) : (
            <p className="text-center text-text-secondary text-lg">Fetching is not currently active.</p>
          )}
        </div>
      </div>
    </div>
  );
};