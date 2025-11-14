import React, { useState } from 'react';
import type { Anime, CustomBackgroundSettings } from '../../types';
import { Play, Edit, Undo2 } from 'lucide-react';
import { isUntrackableByEpisodes } from '../../utils/animeHelpers';

interface ContinueWatchingLaneProps {
  watchingList: Anime[];
  onUpdateAnime: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => void;
  onViewDetails: (anime: Anime) => void;
  onDelete: (anime: Anime) => void;
  onOpenEditModal: (anime: Anime) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  customBackground: CustomBackgroundSettings;
  isFullWidth: boolean;
}

interface AnimeCarouselCardProps {
  anime: Anime;
  onUpdateAnime: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched'>>) => void;
  onViewDetails: (anime: Anime) => void;
  onOpenEditModal: (anime: Anime) => void;
  customBackground: CustomBackgroundSettings;
  isFullWidth: boolean;
}

const AnimeCarouselCard: React.FC<AnimeCarouselCardProps> = ({ anime, onUpdateAnime, onViewDetails, onOpenEditModal, customBackground, isFullWidth }) => {
  const [isBouncing, setIsBouncing] = useState(false);

  const untrackable = isUntrackableByEpisodes(anime);
  const progressPercentage = untrackable ? 0 : (anime.episodesWatched / anime.totalEpisodes) * 100;
  const displayTotalEpisodes = untrackable ? '?' : (anime.totalEpisodes > 0 ? anime.totalEpisodes : '?');

  const cardWidthClasses = isFullWidth
    ? "w-[85vw] sm:w-[45vw] md:w-1/3 lg:w-1/4 xl:w-1/5"
    : "w-72";

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (untrackable) return;

    const nextEpisode = anime.episodesWatched + 1;
    if (anime.totalEpisodes === 0 || anime.episodesWatched < anime.totalEpisodes) {
      onUpdateAnime(anime.id, { episodesWatched: nextEpisode });
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500);
    }
  };

  const handleUndoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (untrackable || anime.episodesWatched <= 0) return;
    onUpdateAnime(anime.id, { episodesWatched: anime.episodesWatched - 1 });
  };
  
  const cardStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-primary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };

  return (
    <div 
      className={`${cardWidthClasses} flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-border-color h-full flex flex-col`}
      style={cardStyle}
    >
        <button className="w-full block relative bg-border-color group flex-grow" onClick={() => onViewDetails(anime)}>
            <img src={anime.posterUrl} alt={anime.title} className={`absolute inset-0 w-full h-full object-cover ${isBouncing ? 'animate-watch-bounce' : ''}`} />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
        </button>
        <div className="p-3 flex-shrink-0">
            <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-base lg:text-lg text-text-primary truncate pr-4">{anime.title}</h3>
                {untrackable ? (
                    <p className="text-sm font-medium text-text-secondary flex-shrink-0">Not Yet Released</p>
                ) : (
                    <p className="text-base font-semibold text-text-primary flex-shrink-0">
                        S{anime.season} E{anime.episodesWatched}
                        <span className="text-sm font-medium text-text-secondary/70"> / {displayTotalEpisodes}</span>
                    </p>
                )}
            </div>
            <div className="mt-2">
                <p className="text-xs text-text-secondary mb-1">PROGRESS</p>
                {!untrackable && (
                    <div className="w-full bg-border-color rounded-full h-1">
                        <div className="bg-accent h-1 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                )}
            </div>
            <div className="flex gap-2 mt-3">
                <button onClick={handleUndoClick} disabled={untrackable || anime.episodesWatched <= 0} className="p-2 bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors disabled:opacity-50" title="Undo watch">
                    <Undo2 size={18} />
                </button>
                <button onClick={handleWatchClick} disabled={untrackable || (anime.totalEpisodes > 0 && anime.episodesWatched >= anime.totalEpisodes)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors disabled:bg-gray-600">
                    <Play size={16} />
                    <span>Watch Next</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onOpenEditModal(anime); }} className="p-2 bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors" title="Edit progress">
                    <Edit size={18} />
                </button>
            </div>
        </div>
    </div>
  );
};

export const ContinueWatchingLane: React.FC<ContinueWatchingLaneProps> = ({ watchingList, onUpdateAnime, onViewDetails, onOpenEditModal, scrollContainerRef, customBackground, isFullWidth, onDelete }) => {
  if (!watchingList || watchingList.length === 0) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-grow flex gap-6 overflow-x-auto -mx-6 px-6 no-scrollbar items-stretch"
    >
      {watchingList.map(anime => (
          <AnimeCarouselCard
              key={anime.id}
              anime={anime}
              onUpdateAnime={onUpdateAnime}
              onViewDetails={onViewDetails}
              onOpenEditModal={onOpenEditModal}
              customBackground={customBackground}
              isFullWidth={isFullWidth}
          />
      ))}
    </div>
  );
};