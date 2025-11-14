

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Anime, CustomBackgroundSettings, BookmarkedImage, BookmarkedItem } from '../../types';
import { WatchStatus } from '../../types';
import { fetchAnimeDetails } from '../../services/aniListService';
import { fetchAnimePictures } from '../../services/jikanService';
import { X, Star, Play, Edit, Loader2, AlertTriangle, Undo2, ExternalLink, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { isUntrackableByEpisodes, isUnratable } from '../../utils/animeHelpers';
import { SideImageViewer } from '../misc/SideImageViewer';

interface AnimeDetailModalProps {
  anime: Anime;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAnime: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => void;
  onDetailsLoaded: (animeId: number, details: Partial<Anime>) => void;
  onViewDetails: (anime: Anime) => void;
  onDelete: (anime: Anime) => void;
  isInList: boolean;
  onAddToList: (anime: Anime) => void;
  onApiError: (error: unknown) => void;
  customBackground: CustomBackgroundSettings;
  onOpenEditModal: (anime: Anime) => void;
  onOpenAddModal: (anime: Anime) => void;
  bookmarkedItems: BookmarkedItem[];
  onToggleBookmark: (item: BookmarkedItem) => void;
}

interface StarRatingSelectorProps {
  currentScore: number;
  onScoreChange: (newScore: number) => void;
  disabled?: boolean;
}

const StarRatingSelector: React.FC<StarRatingSelectorProps> = ({ currentScore, onScoreChange, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div
      className={`flex items-center gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onMouseLeave={() => setHoverRating(0)}
      title={disabled ? "You can rate this anime after you start watching it." : ""}
    >
      {[...Array(10)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            key={ratingValue}
            type="button"
            disabled={disabled}
            className="focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-sm"
            onClick={() => !disabled && onScoreChange(ratingValue)}
            onMouseEnter={() => !disabled && setHoverRating(ratingValue)}
            aria-label={`Rate ${ratingValue} stars`}
          >
            <Star
              className={`w-7 h-7 transition-colors duration-150 ${
                ratingValue <= (hoverRating || currentScore)
                  ? 'text-accent fill-accent'
                  : 'text-border-color hover:text-accent/50'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export const AnimeDetailModal: React.FC<AnimeDetailModalProps> = ({ 
  anime, isOpen, onClose, onUpdateAnime, onDetailsLoaded, 
  onViewDetails, onDelete, isInList, onAddToList, onApiError, 
  customBackground, onOpenEditModal, onOpenAddModal, bookmarkedItems, onToggleBookmark 
}) => {
  const [show, setShow] = useState(false);
  const [imageViewerState, setImageViewerState] = useState<{ images: BookmarkedImage[], currentIndex: number } | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBouncing, setIsBouncing] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollGalleryLeft, setCanScrollGalleryLeft] = useState(false);
  const [canScrollGalleryRight, setCanScrollGalleryRight] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync the 'show' state of the image viewer with its data state
  useEffect(() => {
    setShowImageViewer(!!imageViewerState);
  }, [imageViewerState]);

  const handleClose = () => {
    setShow(false);
    setShowImageViewer(false); // Ensure image viewer also animates out
    setTimeout(() => {
      onClose();
      setImageViewerState(null); // Reset internal state
    }, 500); // Match longest animation (side viewer)
  };

  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
    // Delay setting state to null to allow for closing animation
    setTimeout(() => {
        setImageViewerState(null);
    }, 500);
  };


  const onViewImageInPane = (images: BookmarkedImage[], startIndex: number) => {
    setImageViewerState({ images, currentIndex: startIndex });
  };

  const handleImageViewerNavigation = (direction: 'next' | 'prev') => {
    setImageViewerState(prevState => {
      if (!prevState) return null;
      const { images, currentIndex } = prevState;
      let nextIndex = currentIndex;
      if (direction === 'next' && currentIndex < images.length - 1) {
        nextIndex++;
      } else if (direction === 'prev' && currentIndex > 0) {
        nextIndex--;
      }
      return { ...prevState, currentIndex: nextIndex };
    });
  };

  const allImagesForPane = useMemo(() => {
    const poster: BookmarkedImage = {
        type: 'image',
        id: anime.id,
        imageUrl: anime.posterUrl,
        title: anime.title,
    };
    const gallery: BookmarkedImage[] = (anime.pictures || []).map((p, i) => ({
        type: 'image',
        id: anime.id * 1000 + i, // Create unique ID for bookmarking
        imageUrl: p.large,
        title: `${anime.title} - Gallery Image #${i + 1}`
    }));
    return [poster, ...gallery];
  }, [anime.id, anime.title, anime.posterUrl, anime.pictures]);
  
  const checkGalleryScrollability = useCallback(() => {
    const container = galleryRef.current;
    if (container) {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollGalleryLeft(scrollLeft > 1);
        setCanScrollGalleryRight(Math.ceil(scrollLeft) + clientWidth < scrollWidth - 1);
    }
  }, []);
  
  useEffect(() => {
    if (imageViewerState && galleryRef.current) {
      const { currentIndex } = imageViewerState;
      // currentIndex 0 is the poster, which is not in the galleryRef container.
      // So we only scroll for gallery items (currentIndex > 0).
      if (currentIndex > 0) {
        const itemIndexInGallery = currentIndex - 1;
        const galleryElement = galleryRef.current.children[itemIndexInGallery] as HTMLElement;
        if (galleryElement) {
          galleryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }
    }
  }, [imageViewerState]);

  useEffect(() => {
    const container = galleryRef.current;
    if (!container || !anime.pictures || anime.pictures.length === 0) return;

    checkGalleryScrollability();
    const resizeObserver = new ResizeObserver(checkGalleryScrollability);
    resizeObserver.observe(container);
    container.addEventListener('scroll', checkGalleryScrollability, { passive: true });

    return () => {
        if (container) {
            resizeObserver.disconnect();
            container.removeEventListener('scroll', checkGalleryScrollability);
        }
    };
  }, [anime.pictures, checkGalleryScrollability, isOpen]);

  const handleGalleryScroll = (direction: 'left' | 'right') => {
      const container = galleryRef.current;
      if (container && container.firstElementChild) {
          const firstItem = container.firstElementChild as HTMLElement;
          // gap-4 is 1rem (16px)
          const scrollAmount = firstItem.offsetWidth + 16;
          container.scrollTo({
              left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
              behavior: 'smooth',
          });
      }
  };


  const fetchDetails = useCallback(async () => {
    setError(null);
    try {
      const detailsPromise = fetchAnimeDetails(anime.id);
      const picturesPromise = fetchAnimePictures(anime.id); // Fetch pictures concurrently

      const [fetchedDetails, fetchedPictures] = await Promise.all([detailsPromise, picturesPromise]);
      
      const updates: Partial<Anime> = {
          ...(fetchedDetails || {}),
          pictures: fetchedPictures,
      };

      onDetailsLoaded(anime.id, updates);

      if (!fetchedDetails) {
        console.warn(`Could not find additional details for MAL ID ${anime.id}.`);
      }
    } catch (err) {
      onApiError(err);
      if (!(err instanceof Error && err.message.includes('429'))) {
        setError(err instanceof Error ? err.message : "Could not load anime details.");
      }
    }
  }, [anime.id, onDetailsLoaded, onApiError]);

  useEffect(() => {
    if (isOpen) {
      setIsBouncing(false); // Reset bounce on open
      // If key details are missing, fetch them in the background without a disruptive loader.
      if (anime.description === undefined || anime.mediaStatus === undefined || anime.pictures === undefined) {
        fetchDetails();
      } else {
        // If we already have details, ensure there's no lingering error message.
        setError(null);
      }
    }
  }, [isOpen, anime, fetchDetails]);

  if (!isOpen) return null;

  const handleWatchClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUntrackableByEpisodes(anime)) return; // Prevent for untrackable anime
    if (onUpdateAnime && (anime.totalEpisodes === 0 || anime.episodesWatched < anime.totalEpisodes)) {
      onUpdateAnime(anime.id, { episodesWatched: anime.episodesWatched + 1 });
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 500); // Animation duration
    }
  };

  const handleUndoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUntrackableByEpisodes(anime)) return; // Prevent for untrackable anime
    if (onUpdateAnime && anime.episodesWatched > 0) {
      onUpdateAnime(anime.id, { episodesWatched: anime.episodesWatched - 1 });
    }
  };
  
  const untrackable = isUntrackableByEpisodes(anime);
  const unratable = isUnratable(anime);
  const progressPercentage = untrackable ? 0 : (anime.episodesWatched / anime.totalEpisodes) * 100;
  const displayTotalEpisodes = untrackable ? '?' : (anime.totalEpisodes > 0 ? anime.totalEpisodes : '?');
  const synopsis = anime.description?.replace(/\n/g, '<br />') || 'No synopsis available.';
  
  const infoParts: React.ReactNode[] = [];
  if (anime.format) infoParts.push(<span key="format">{anime.format}</span>);
  if (anime.startDate?.year) infoParts.push(<span key="year">{anime.startDate.year}</span>);
  
  const userHasScored = anime.score > 0;
  const hasCommunityScore = anime.averageScore && anime.averageScore > 0;

  if (userHasScored) {
    infoParts.push(
      <div key="user-score" className="flex items-center gap-1" title="Your Score">
        <Star className="w-4 h-4 text-accent" fill="currentColor"/>
        <span>{anime.score}</span>
      </div>
    );
  }
  if (hasCommunityScore) {
      infoParts.push(
          <div key="community-score" className="flex items-center gap-1" title="Community Score">
             <Star className="w-4 h-4 text-yellow-400" fill="currentColor"/>
             <span>{(anime.averageScore / 10).toFixed(1)}</span>
          </div>
      );
  }
  if (anime.studio) infoParts.push(<span key="studio">{anime.studio}</span>);
  
  const currentImage = imageViewerState ? imageViewerState.images[imageViewerState.currentIndex] : null;

  return (
    <div
      className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 flex items-center justify-center p-4 ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      <div className="w-full max-h-[90vh] flex justify-center items-stretch gap-4">
        <div 
            className={`w-full max-w-4xl flex-shrink-0 transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
        >
          <div
              className="rounded-lg shadow-xl w-full h-full border border-border-color flex flex-col relative overflow-hidden"
              style={{ backgroundColor: `rgba(22, 27, 34, ${customBackground.overlayOpacity || 0.9})`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
              <button onClick={handleClose} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 z-30" aria-label="Close">
                  <X size={24} />
              </button>
              
              {error ? (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                      <h2 className="text-xl font-semibold text-red-300">Failed to Load Details</h2>
                      <p className="text-text-secondary mt-1">{error}</p>
                  </div>
              ) : (
                <>
                  <div className="absolute top-0 left-0 w-full h-80 z-0">
                      {anime.bannerUrl && <img src={anime.bannerUrl} alt="Anime Banner" className="w-full h-full object-cover opacity-40" />}
                      {/* FIX: Removed invalid 'to' property from inline style object */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary"></div>
                  </div>

                  <div className="flex-grow overflow-y-auto scrollbar-thin relative z-10 px-8 md:px-12 flex flex-col">
                      <div className="flex-grow pb-24"> 
                        <div className="flex flex-col md:flex-row md:items-start gap-8 pt-48">
                            <button 
                              onClick={() => onViewImageInPane(allImagesForPane, 0)}
                              className={`w-48 md:w-56 flex-shrink-0 -mt-24 rounded-lg shadow-2xl overflow-hidden focus:outline-none group ${isBouncing ? 'animate-watch-bounce' : ''} ${imageViewerState && imageViewerState.currentIndex === 0 ? 'ring-2 ring-accent ring-inset' : ''}`}
                              title="View full poster"
                            >
                              <img 
                                src={anime.posterUrl} 
                                alt={anime.title} 
                                className="w-full h-auto transition-transform duration-300 group-hover:scale-105" 
                              />
                            </button>
                            <div className="flex-grow pt-8">
                                <h2 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{anime.title}</h2>
                                {anime.alternativeTitles && anime.alternativeTitles.length > 0 && (
                                  <p className="text-lg text-gray-400 mt-1 italic">
                                      {anime.alternativeTitles.join(', ')}
                                  </p>
                                )}
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-lg text-gray-300">
                                   {infoParts.map((part, index) => (
                                      <React.Fragment key={index}>
                                        {part}
                                        {index < infoParts.length - 1 && <span className="text-gray-500">&bull;</span>}
                                      </React.Fragment>
                                    ))}
                                </div>
                                 {anime.genres && anime.genres.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-4">
                                      {anime.genres.map(genre => (
                                          <span key={genre} className="bg-white/10 text-text-primary text-base font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">{genre}</span>
                                      ))}
                                  </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-8"> 
                          {isInList ? (
                              <>
                                  <div className="flex justify-between items-center mb-4">
                                      <h3 className="text-3xl font-semibold text-text-primary">Your Progress</h3>
                                      <button 
                                        onClick={() => onOpenEditModal(anime)} 
                                        className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors"
                                        title="Edit Entry"
                                      >
                                          <Edit size={16} />
                                          <span>Edit Entry</span>
                                      </button>
                                  </div>
                                  <div className="bg-primary/50 border border-border-color p-4 rounded-lg flex flex-col gap-4">
                                      {untrackable ? (
                                          <div className="text-center py-4">
                                              <p className="text-xl text-text-primary font-medium">Not Yet Released</p>
                                              <p className="text-base text-text-secondary mt-1">Episode tracking is not applicable for this entry.</p>
                                          </div>
                                      ) : (
                                          <>
                                              <div className="flex items-center justify-between">
                                                  <div>
                                                      <span className="text-4xl font-bold text-text-primary tracking-tight">
                                                          S{anime.season} E{anime.episodesWatched}
                                                      </span>
                                                      <span className="text-2xl font-medium text-text-secondary/70 ml-2">
                                                          / {displayTotalEpisodes} total
                                                      </span>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                      <button onClick={handleUndoClick} disabled={anime.episodesWatched <= 0} className="p-3 bg-border-color text-text-secondary rounded-md hover:bg-border-color/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo watch (decrement episode)"><Undo2 size={18} /></button>
                                                      <button onClick={handleWatchClick} disabled={anime.totalEpisodes > 0 && anime.episodesWatched >= anime.totalEpisodes} className="p-3 bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" title="Watch next episode"><Play size={18} /></button>
                                                  </div>
                                              </div>
                                              <div className="w-full bg-border-color rounded-full h-1.5">
                                                  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                              </div>
                                          </>
                                      )}
                                      <div>
                                          <div className="flex justify-between items-center mb-2">
                                              <label className="text-lg font-medium text-text-primary">Your Score</label>
                                              <div className="flex items-baseline gap-4">
                                                {hasCommunityScore && (
                                                    <span className="text-base text-text-secondary" title="Community Score">
                                                        Community: <span className="font-bold text-yellow-400">{(anime.averageScore / 10).toFixed(1)}</span>
                                                    </span>
                                                )}
                                                {unratable ? (
                                                    <span className="text-base text-text-secondary">Rate after watching</span>
                                                ) : userHasScored ? (
                                                    <span className="text-lg font-bold text-accent">{anime.score} / 10</span>
                                                ) : (
                                                    <span className="text-lg text-text-secondary">Not Rated</span>
                                                )}
                                              </div>
                                          </div>
                                          {/* Score rating selector always present but disabled if unratable */}
                                          <StarRatingSelector
                                              currentScore={anime.score}
                                              onScoreChange={(newScore) => onUpdateAnime(anime.id, { score: newScore })}
                                              disabled={unratable}
                                          />
                                          <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary border-t border-border-color pt-3">
                                              <div className="flex items-center gap-1.5">
                                                  <Star className="w-4 h-4 text-accent fill-accent" />
                                                  <span>Your Score</span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                  <span>Community Score</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </>
                          ) : (
                              <div className="bg-primary/50 border border-border-color p-4 rounded-lg mt-3 flex items-center justify-center">
                                  <button onClick={() => onOpenAddModal(anime)} className="w-full max-w-xs flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors"><Plus size={20} /><span>Add to List</span></button>
                              </div>
                          )}
                        </div> 
                        
                        <div className="mt-8">
                            <h3 className="text-3xl font-semibold mb-2 text-text-primary">Synopsis</h3>
                            <div className="border-l-2 border-border-color pl-4">
                                <p className="text-lg text-text-secondary leading-relaxed max-h-48 overflow-y-auto scrollbar-thin pr-2" dangerouslySetInnerHTML={{ __html: synopsis }}></p>
                            </div>
                        </div>

                        {anime.pictures && anime.pictures.length > 0 && (
                          <div className="mt-8">
                            <h3 className="text-3xl font-semibold mb-3 text-text-primary">Gallery</h3>
                            <div className="relative group/gallery">
                              <div ref={galleryRef} className="flex overflow-x-auto no-scrollbar gap-4 pb-4 -mb-4 -mx-12 px-12">
                                {anime.pictures.map((pic, index) => (
                                  <button
                                    key={pic.large}
                                    onClick={() => onViewImageInPane(allImagesForPane, index + 1)}
                                    className={`flex-shrink-0 w-48 h-28 bg-border-color rounded-lg overflow-hidden group focus:outline-none ${imageViewerState && imageViewerState.currentIndex === index + 1 ? 'ring-2 ring-accent ring-inset' : ''}`}
                                  >
                                    <img 
                                      src={pic.small} 
                                      alt={`Gallery image ${index + 1}`} 
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                      loading="lazy"
                                    />
                                  </button>
                                ))}
                              </div>
                              <button
                                  onClick={() => handleGalleryScroll('left')}
                                  disabled={!canScrollGalleryLeft}
                                  aria-label="Scroll left in gallery"
                                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-secondary/80 backdrop-blur-sm rounded-full text-white hover:bg-border-color transition-all opacity-0 group-hover/gallery:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed z-10"
                              >
                                  <ChevronLeft size={24} />
                              </button>
                              <button
                                  onClick={() => handleGalleryScroll('right')}
                                  disabled={!canScrollGalleryRight}
                                  aria-label="Scroll right in gallery"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-secondary/80 backdrop-blur-sm rounded-full text-white hover:bg-border-color transition-all opacity-0 group-hover/gallery:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed z-10"
                              >
                                  <ChevronRight size={24} />
                              </button>
                            </div>
                          </div>
                        )}

                        {anime.externalLinks && anime.externalLinks.length > 0 && (
                          <div className="mt-8">
                            <h3 className="text-3xl font-semibold mb-3 text-text-primary">Resources</h3>
                            <div className="flex flex-wrap gap-3">
                              {anime.externalLinks.map((link, index) => (
                                <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-base font-medium bg-border-color text-text-secondary rounded-full hover:bg-accent/20 hover:text-accent transition-colors">
                                  <span>{link.site}</span><ExternalLink className="w-4 h-4" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {anime.relations && anime.relations.length > 0 && (
                          <div className="mt-8">
                            <h3 className="text-3xl font-semibold mb-3 text-text-primary">Related Entries</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {anime.relations.map((related) => (
                                <button
                                  key={related.id}
                                  onClick={() => {
                                    if (!related.malId) return;
                                    const partialAnime: Anime = {id: related.malId, title: related.title, posterUrl: related.posterUrl, score: 0, episodesWatched: 0, totalEpisodes: 0, status: WatchStatus.PlanToWatch, genres: [], season: 1};
                                    onViewDetails(partialAnime);
                                  }}
                                  className="flex items-center gap-4 bg-primary/50 hover:bg-border-color p-3 rounded-lg transition-colors w-full text-left"
                                >
                                  <img src={related.posterUrl} alt={related.title} className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                                  <div>
                                    <p className="text-base text-text-secondary">{related.relationType} ({related.format})</p>
                                    <p className="font-semibold text-xl text-text-primary leading-tight">{related.title}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                  </div>
                  {/* FIX: Removed invalid 'from' property from inline style object */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary to-transparent z-20 pointer-events-none"></div>
                </>
              )}
            </div>
        </div>
        <div 
            className={`transition-all duration-500 flex-shrink-0 overflow-hidden ${showImageViewer ? 'w-full max-w-4xl' : 'w-0 max-w-0'}`}
            onClick={(e) => e.stopPropagation()}
        >
            {imageViewerState && currentImage && (
                <SideImageViewer
                    show={showImageViewer}
                    images={imageViewerState.images}
                    currentIndex={imageViewerState.currentIndex}
                    isBookmarked={bookmarkedItems.some(i => i.type === 'image' && i.id === currentImage.id)}
                    onToggleBookmark={onToggleBookmark}
                    onClose={handleCloseImageViewer}
                    onNavigate={handleImageViewerNavigation}
                />
            )}
        </div>
      </div>
    </div>
  );
};
