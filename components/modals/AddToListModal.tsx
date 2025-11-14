import React, { useState, useEffect } from 'react';
import type { Anime } from '../../types';
import { WatchStatus } from '../../types';
import { X, Plus, ChevronDown, Undo2 } from 'lucide-react';
import { ScoreSelector } from '../modals/EditProgressModal';
import { isUntrackableByEpisodes, isUnratable } from '../../utils/animeHelpers';

interface AddToListModalProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
  onSave: (anime: Anime) => void;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({ anime, isOpen, onClose, onSave }) => {
  const [currentCount, setCurrentCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(WatchStatus.PlanToWatch);
  const [currentScore, setCurrentScore] = useState(0);
  const [show, setShow] = useState(false);

  const untrackable = isUntrackableByEpisodes(anime);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset state when a new anime is selected or if untrackable
      if (untrackable) {
        setCurrentCount(0);
        setCurrentStatus(WatchStatus.PlanToWatch);
        setCurrentScore(0);
      } else {
        setCurrentCount(0); // Always start new additions at 0 episodes
        setCurrentStatus(WatchStatus.PlanToWatch);
        setCurrentScore(0);
      }
    }
  }, [anime, isOpen, untrackable]);

  // Effect for smart synchronization between status and episode count
  useEffect(() => {
    if (untrackable) {
      setCurrentCount(0);
      setCurrentStatus(WatchStatus.PlanToWatch);
      return;
    }
    if (anime.totalEpisodes <= 0) return; // For movies/unknown total that are released

    if (currentStatus === WatchStatus.Completed && currentCount !== anime.totalEpisodes) {
      setCurrentCount(anime.totalEpisodes);
    }
    if (currentCount === anime.totalEpisodes && currentStatus !== WatchStatus.Completed) {
      setCurrentStatus(WatchStatus.Completed);
    }
    if (currentCount < anime.totalEpisodes && currentStatus === WatchStatus.Completed) {
      setCurrentStatus(WatchStatus.Watching);
    }
  }, [currentCount, currentStatus, anime.totalEpisodes, untrackable]);


  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    const animeToAdd: Anime = {
      ...anime,
      episodesWatched: currentCount,
      status: currentStatus,
      score: currentScore,
      genres: anime.genres || [],
      season: anime.season || 1,
    };
    onSave(animeToAdd);
    handleClose();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const maxEpisodes = anime.totalEpisodes > 0 ? anime.totalEpisodes : Infinity;
    if (!isNaN(value)) {
        setCurrentCount(Math.max(0, Math.min(value, maxEpisodes)));
    } else if (e.target.value === '') {
        setCurrentCount(0);
    }
  };
  
  const handleIncrement = () => {
    const maxEpisodes = anime.totalEpisodes > 0 ? anime.totalEpisodes : Infinity;
    if (currentCount < maxEpisodes) {
      setCurrentCount(currentCount + 1);
    }
  };
  
  const handleDecrement = () => {
    if (currentCount > 0) {
      setCurrentCount(currentCount - 1);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as WatchStatus;
    setCurrentStatus(newStatus);
    if (newStatus === WatchStatus.PlanToWatch) {
      setCurrentScore(0);
    }
  };
  
  const episodeEditingDisabled = untrackable;
  const ratingDisabled = isUnratable(anime, currentStatus);

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
        style={{ backgroundColor: 'rgba(22, 27, 34, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="modal-title" className="text-3xl font-bold text-text-primary">Add to List</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-text-secondary mb-2 text-lg">Adding: <span className="font-semibold text-accent">{anime.title}</span></p>

        <div className="my-6 space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <label className="text-lg font-medium text-text-primary">Score:</label>
                    <div className="w-48">
                        <ScoreSelector
                            currentScore={currentScore}
                            onScoreChange={setCurrentScore}
                            disabled={ratingDisabled}
                        />
                    </div>
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="status-select" className="text-lg font-medium text-text-primary">Status:</label>
                    <div className="relative w-48">
                        <select
                            id="status-select"
                            value={currentStatus}
                            onChange={handleStatusChange}
                            className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                        >
                            {Object.values(WatchStatus).map(status => (
                                <option
                                    key={status}
                                    value={status}
                                    disabled={untrackable && status !== WatchStatus.PlanToWatch}
                                >
                                    {status}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                </div>
                 {untrackable && (
                    <p className="text-sm text-text-secondary text-right mt-1">
                        Only 'Plan to Watch' is available for unreleased shows.
                    </p>
                )}
            </div>
            <div>
                <div className="flex items-center justify-between">
                    <label htmlFor="episode-count" className="text-lg font-medium text-text-primary">Eps Seen:</label>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDecrement}
                            title="Decrement episode"
                            disabled={episodeEditingDisabled || currentCount <= 0}
                            className="p-2 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:bg-border-color/50 disabled:cursor-not-allowed"
                        >
                            <Undo2 size={16} />
                        </button>
                        <input
                            type="number"
                            id="episode-count"
                            value={currentCount}
                            onChange={handleInputChange}
                            min="0"
                            max={anime.totalEpisodes > 0 ? anime.totalEpisodes : undefined}
                            disabled={episodeEditingDisabled}
                            className="w-20 bg-primary border border-border-color text-text-primary text-center rounded-md p-2 focus:ring-accent focus:border-accent disabled:bg-border-color/50 disabled:cursor-not-allowed text-base"
                        />
                        <span className="text-text-secondary text-lg">/ {anime.totalEpisodes > 0 ? anime.totalEpisodes : '?'}</span>
                        <button 
                            onClick={handleIncrement}
                            title="Increment episode"
                            disabled={episodeEditingDisabled || (anime.totalEpisodes > 0 && currentCount >= anime.totalEpisodes)}
                            className="p-2 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:bg-border-color/50 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
                {episodeEditingDisabled && (
                    <p className="text-sm text-text-secondary text-right mt-1">
                        Episode tracking is disabled for unreleased or untrackable shows.
                    </p>
                )}
            </div>
        </div>

        <div className="flex justify-end space-x-4 mt-4">
          <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base"
          >
              Cancel
          </button>
          <button
              onClick={handleSave}
              className="px-6 py-2 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base"
          >
              Add to List
          </button>
        </div>
      </div>
    </div>
  );
};