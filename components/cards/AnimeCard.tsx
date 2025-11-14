


import React, { useState } from 'react';
import type { Anime, CustomBackgroundSettings } from '../../types';
import { Star, Play, Edit, Check } from 'lucide-react';
import { WatchStatus } from '../../types';
import { isUntrackableByEpisodes } from '../../utils/animeHelpers';

interface AnimeCardProps {
  anime: Anime;
  showControls?: boolean;
  onUpdateAnime?: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => void;
  onViewDetails: (anime: Anime) => void;
  onDelete?: (anime: Anime) => void;
  onOpenEditModal: (anime: Anime) => void; // New prop for centralized edit modal
  customBackground: CustomBackgroundSettings;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, showControls = false, onUpdateAnime, onViewDetails, onDelete, onOpenEditModal, customBackground }) => {
  const [isBouncing, setIsBouncing] = useState(false);
  
  const untrackable = isUntrackableByEpisodes(anime);
  const progressPercentage = untrackable ? 0 : (anime.episodesWatched / anime.totalEpisodes) * 100;
  const displayTotalEpisodes = untrackable ? '?' : (anime.totalEpisodes > 0 ? anime.totalEpisodes : '?');
  
  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (untrackable) return; // Prevent action for untrackable anime

    if (onUpdateAnime && (anime.totalEpisodes === 0 || anime.episodesWatched < anime.totalEpisodes)) {
      onUpdateAnime(anime.id, { episodesWatched: anime.episodesWatched + 1 });
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500); // Animation duration
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenEditModal(anime); // Use centralized handler
  };
  
  const userHasScored = anime.score > 0;
  const hasCommunityScore = anime.averageScore && anime.averageScore > 0;

  const cardStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-primary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };

  return (
    <>
      <button onClick={() => onViewDetails(anime)} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-accent rounded-lg">
        <div 
          className="rounded-lg overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 group h-full flex flex-col border border-border-color"
          style={cardStyle}
        >
          <div className="relative">
            <img src={anime.posterUrl} alt={anime.title} className={`w-full h-60 object-cover ${isBouncing ? 'animate-watch-bounce' : ''}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            {(userHasScored || hasCommunityScore) && (
              <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white text-sm font-bold px-2 py-1 rounded-full">
                {userHasScored && (
                  <div className="flex items-center" title={`Your score: ${anime.score}/10`}>
                    <Star className="w-3 h-3 mr-1 text-accent" fill="currentColor" />
                    <span>{anime.score}</span>
                  </div>
                )}
                {hasCommunityScore && (
                  <div className="flex items-center" title={`Community score: ${(anime.averageScore / 10).toFixed(1)}/10`}>
                    <Star className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" />
                    <span>{(anime.averageScore / 10).toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors duration-200">{anime.title}</h3>
            
            {showControls ? (
                 <div className="mt-2 space-y-3 flex-grow flex flex-col justify-end">
                    {untrackable ? (
                        <p className="text-base text-text-secondary">Not Yet Released</p>
                    ) : (
                        <p className="text-base text-text-secondary">
                            S{anime.season} E{anime.episodesWatched} <span className="text-text-secondary/60">/ {displayTotalEpisodes} total</span>
                        </p>
                    )}
                    
                    {!untrackable && (
                        <div className="w-full bg-border-color rounded-full h-1.5">
                            <div className="bg-accent h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    )}
                    <div className="flex gap-2 pt-1">
                        {anime.status === WatchStatus.Completed ? (
                            <button 
                                disabled
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-base font-semibold bg-green-700 text-white rounded-md cursor-default"
                            >
                                <Check size={16} />
                                <span>Completed</span>
                            </button>
                        ) : (
                            <button 
                                onClick={handleWatchClick}
                                disabled={untrackable || (anime.totalEpisodes > 0 && anime.episodesWatched >= anime.totalEpisodes)}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-base font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-blue-400"
                            >
                                <Play size={16} />
                                <span>Watch Next</span>
                            </button>
                        )}
                        <button
                            onClick={handleEditClick} 
                            className="px-3 py-2 bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent"
                        >
                            <Edit size={16} />
                        </button>
                    </div>
                 </div>
            ) : (
                <div className="flex-grow flex flex-col justify-end">
                    <p className="text-base text-text-secondary mt-1">{anime.status}</p>
                    <div className="mt-3">
                      {untrackable ? (
                            <p className="text-sm text-text-secondary mb-1">Status: Not Yet Released</p>
                      ) : (
                        <>
                            <div className="flex justify-between items-center text-sm text-text-secondary mb-1">
                                <span className="font-medium">Progress</span>
                                <span>{anime.episodesWatched} / {displayTotalEpisodes}</span>
                            </div>
                            <div className="w-full bg-border-color rounded-full h-1.5">
                                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </>
                      )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </button>
    </>
  );
};