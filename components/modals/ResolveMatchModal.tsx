
import React, { useState, useEffect, useCallback } from 'react';
import type { Anime } from '../../types';
import { searchAnime } from '../../services/aniListService';
import { X, Loader2, AlertTriangle, Check, Search } from 'lucide-react';

interface ResolveMatchModalProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (originalMalId: number, matchedAnime: Anime) => void;
  onApiError: (error: unknown) => void;
}

export const ResolveMatchModal: React.FC<ResolveMatchModalProps> = ({ anime, isOpen, onClose, onResolve, onApiError }) => {
  const [show, setShow] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async () => {
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchAnime(anime.title);
      setSearchResults(results);
    } catch (err) {
      onApiError(err);
      if (!(err instanceof Error && err.message.includes('429'))) {
        setError("Failed to search. Please try again later.");
      }
    } finally {
      setIsSearching(false);
    }
  }, [anime.title, onApiError]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShow(true);
        performSearch();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen, performSearch]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
        onClose();
        setError(null);
        setSearchResults([]);
    }, 300);
  };

  const handleSelect = (selectedAnime: Anime) => {
    onResolve(anime.id, selectedAnime);
    handleClose();
  };
  
  if (!isOpen) {
    return null;
  }

  const renderContent = () => {
    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-64">
          <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
          <p className="text-xl text-text-secondary">Searching for matches...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-64">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
          <h3 className="text-2xl font-semibold text-red-300">Search Failed</h3>
          <p className="text-lg text-text-secondary mt-1">{error}</p>
        </div>
      );
    }
    if (searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 h-64">
          <Search className="w-10 h-10 text-text-secondary mb-4" />
          <h3 className="text-2xl font-semibold text-text-primary">No Matches Found</h3>
          <p className="text-lg text-text-secondary mt-1">The search returned no results for "{anime.title}".</p>
        </div>
      );
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
            {searchResults.map(result => (
                <div key={result.id} className="relative group">
                    <img src={result.posterUrl} alt={result.title} className="w-full aspect-[2/3] object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-2 rounded-md">
                        <p className="text-white text-base font-semibold">{result.title}</p>
                        <p className="text-gray-300 text-sm">{result.format} &bull; {result.startDate?.year}</p>
                        <button
                            onClick={() => handleSelect(result)}
                            className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors"
                        >
                            <Check size={14} />
                            <span>Select</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] border border-border-color flex flex-col transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'rgba(22, 27, 34, 0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-3xl font-bold text-text-primary">Resolve Match</h2>
            <p className="text-lg text-text-secondary">For: <strong className="text-accent">{anime.title}</strong> (MAL ID: {anime.id})</p>
          </div>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto scrollbar-thin p-4">
            {renderContent()}
        </div>

        <div className="p-4 border-t border-border-color flex-shrink-0 text-center">
            <p className="text-base text-text-secondary">Select the correct entry to merge your progress with its data.</p>
        </div>
      </div>
    </div>
  );
};
