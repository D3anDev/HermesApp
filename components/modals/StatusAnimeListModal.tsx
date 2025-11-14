import React, { useMemo, useState, useEffect } from 'react';
import type { Anime, CustomBackgroundSettings } from '../../types';
import { WatchStatus } from '../../types';
import { X, Tv } from 'lucide-react';

interface StatusAnimeListModalProps {
  animeList: Anime[];
  statusFilter: WatchStatus | null;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (anime: Anime) => void;
  customBackground: CustomBackgroundSettings;
}

export const StatusAnimeListModal: React.FC<StatusAnimeListModalProps> = ({
  animeList,
  statusFilter,
  isOpen,
  onClose,
  onViewDetails,
  customBackground,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const sortedAnime = useMemo(() => {
    if (!statusFilter) return [];
    return animeList
      .filter(anime => anime.status === statusFilter)
      .sort((a, b) => (b.startDate?.year || 0) - (a.startDate?.year || 0));
  }, [animeList, statusFilter]);

  if (!isOpen) {
    return null;
  }

  const title = `${statusFilter} Anime (${sortedAnime.length})`;
  
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
        className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] border border-border-color flex flex-col relative transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={modalStyle}
      >
        <div className="flex justify-between items-center p-6 pb-4 flex-shrink-0">
          <h2 id="modal-title" className="text-4xl font-bold text-text-primary">{title}</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-0 flex-grow overflow-y-auto scrollbar-thin">
          {sortedAnime.length > 0 ? (
            <div className="space-y-3">
              {sortedAnime.map(anime => (
                <button
                  key={anime.id}
                  onClick={() => {
                    onViewDetails(anime);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors bg-primary hover:bg-border-color focus:outline-none focus:ring-2 focus:ring-accent border border-border-color"
                >
                  <img
                    src={anime.posterUrl}
                    alt={anime.title}
                    className="w-14 h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg text-text-primary truncate">{anime.title}</p>
                    <p className="text-sm text-text-secondary">
                      {anime.startDate?.year ? `Released: ${anime.startDate.year}` : 'Release date unknown'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-primary rounded-lg border border-border-color h-full flex flex-col items-center justify-center">
              <Tv className="mx-auto h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-2xl font-semibold text-text-primary">No Anime Found</h3>
              <p className="text-lg text-text-secondary mt-1">
                There are no anime with a status of '{statusFilter}' in your list.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};