import React, { useState, useEffect } from 'react';
import type { Anime } from '../../types';
import { WatchStatus } from '../../types';
import { X, Plus, ChevronDown, Trash2, Undo2 } from 'lucide-react';
import { isUntrackableByEpisodes, isUnratable } from '../../utils/animeHelpers';

// Reusable Score Selector Component
interface ScoreSelectorProps {
  currentScore: number;
  onScoreChange: (newScore: number) => void;
  disabled?: boolean;
}

export const scoreMap: Record<number, string> = {
  10: '(10) Masterpiece',
  9: '(9) Great',
  8: '(8) Very Good',
  7: '(7) Good',
  6: '(6) Fine',
  5: '(5) Average',
  4: '(4) Bad',
  3: '(3) Very Bad',
  2: '(2) Horrible',
  1: '(1) Appalling',
  0: 'Select score',
};

export const ScoreSelector: React.FC<ScoreSelectorProps> = ({ currentScore, onScoreChange, disabled = false }) => {
  return (
    <div className="relative">
      <select
        value={currentScore}
        onChange={(e) => onScoreChange(parseInt(e.target.value, 10))}
        disabled={disabled}
        className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2.5 px-4 text-text-primary text-base disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Select score"
      >
        {[0, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => (
          <option key={score} value={score}>
            {scoreMap[score]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
    </div>
  );
};


interface EditProgressModalProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
  onSave: (animeId: number, updates: { episodesWatched: number; status: WatchStatus; score: number }) => void;
  onDelete: (anime: Anime) => void; // `onDelete` is still a prop because `requestDeleteAnime` is called from App.
}

export const EditProgressModal: React.FC<EditProgressModalProps> = ({ anime, isOpen, onClose, onSave, onDelete }) => {
  const [currentCount, setCurrentCount] = useState(anime.episodesWatched);
  const [currentStatus, setCurrentStatus] = useState(anime.status);
  const [currentScore, setCurrentScore] = useState(anime.score);
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
      if (untrackable) {
        setCurrentCount(0);
        setCurrentStatus(WatchStatus.PlanToWatch);
        setCurrentScore(0);
      } else {
        setCurrentCount(anime.episodesWatched);
        setCurrentStatus(anime.status);
        setCurrentScore(anime.score);
      }
    }
  }, [anime, isOpen, untrackable]);
  
  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const handleSave = () => {
    onSave(anime.id, { episodesWatched: currentCount, status: currentStatus, score: currentScore });
    handleClose();
  };

  const updateCountAndStatus = (newCount: number) => {
    const maxEpisodes = anime.totalEpisodes > 0 ? anime.totalEpisodes : Infinity;
    const clampedCount = Math.max(0, Math.min(newCount, maxEpisodes));
    
    setCurrentCount(clampedCount);

    if (anime.totalEpisodes > 0) {
        if (clampedCount === anime.totalEpisodes && currentStatus !== WatchStatus.Completed) {
            setCurrentStatus(WatchStatus.Completed);
        } else if (clampedCount < anime.totalEpisodes && currentStatus === WatchStatus.Completed) {
            setCurrentStatus(WatchStatus.Watching);
        }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
        updateCountAndStatus(value);
    } else if (e.target.value === '') {
        updateCountAndStatus(0);
    }
  };
  
  const handleIncrement = () => {
    updateCountAndStatus(currentCount + 1);
  };

  const handleDecrement = () => {
    updateCountAndStatus(currentCount - 1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as WatchStatus;
    setCurrentStatus(newStatus);

    if (newStatus === WatchStatus.PlanToWatch) {
      setCurrentCount(0);
      setCurrentScore(0);
    } else if (newStatus === WatchStatus.Completed && anime.totalEpisodes > 0) {
      setCurrentCount(anime.totalEpisodes);
    }
  };
  
  const handleDelete = () => {
    onDelete(anime);
    handleClose();
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
        className={`rounded-lg shadow-xl p-8 w-full max-w-md border border-border-color transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'rgba(22, 27, 34, 0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-4xl font-bold text-text-primary">Edit Progress</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-text-secondary mb-6 text-xl">
            Editing for: <span className="font-bold text-accent">{anime.title}</span> 
            {anime.season > 0 && <span className="text-text-secondary/80 ml-2">Season {anime.season}</span>}
        </p>

        <div className="my-6 space-y-6">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="status-select" className="text-xl font-medium text-text-primary">Score:</label>
                    <div className="w-64">
                        <ScoreSelector
                            currentScore={currentScore}
                            onScoreChange={setCurrentScore}
                            disabled={ratingDisabled}
                        />
                    </div>
                </div>
                {ratingDisabled && <p className="text-base text-text-secondary text-right mt-1">Score can be set after starting.</p>}
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="status-select" className="text-xl font-medium text-text-primary">Status:</label>
                    <div className="relative w-64">
                        <select
                            id="status-select"
                            value={currentStatus}
                            onChange={handleStatusChange}
                            className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2.5 px-4 text-text-primary text-base"
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
                    <p className="text-base text-text-secondary text-right mt-1">
                        Only 'Plan to Watch' is available for unreleased shows.
                    </p>
                )}
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label htmlFor="episode-count" className="text-xl font-medium text-text-primary">Eps Seen:</label>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleDecrement}
                            title="Decrement episode"
                            disabled={episodeEditingDisabled || currentCount <= 0}
                            className="p-2.5 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:bg-border-color/50 disabled:cursor-not-allowed"
                        >
                            <Undo2 size={20} />
                        </button>
                        <input
                            type="number"
                            id="episode-count"
                            value={currentCount}
                            onChange={handleInputChange}
                            min="0"
                            max={anime.totalEpisodes > 0 ? anime.totalEpisodes : undefined}
                            disabled={episodeEditingDisabled}
                            className="w-24 bg-primary border border-border-color text-text-primary text-center rounded-md py-2.5 px-3 focus:ring-accent focus:border-accent disabled:bg-border-color/50 disabled:cursor-not-allowed text-lg"
                        />
                        <span className="text-text-secondary text-lg font-medium">/ {anime.totalEpisodes > 0 ? anime.totalEpisodes : '?'}</span>
                        <button 
                            onClick={handleIncrement}
                            title="Increment episode"
                            disabled={episodeEditingDisabled || (anime.totalEpisodes > 0 && currentCount >= anime.totalEpisodes)}
                            className="p-2.5 bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors disabled:bg-border-color/50 disabled:cursor-not-allowed"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
                {episodeEditingDisabled && (
                    <p className="text-base text-text-secondary text-right mt-1">
                        Episode tracking is disabled for unreleased or untrackable shows.
                    </p>
                )}
            </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border-color">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md text-red-400 bg-red-900/10 border border-red-700 hover:bg-red-900/20 transition-colors text-base font-semibold"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
          <div className="flex space-x-3">
            <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-md text-text-primary bg-border-color hover:bg-border-color/70 transition-colors text-base"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="px-7 py-2.5 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base"
            >
                Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};