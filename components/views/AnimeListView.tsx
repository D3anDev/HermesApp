import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Anime, CustomBackgroundSettings } from '../../types';
import { WatchStatus } from '../../types';
import { AnimeCard } from '../cards/AnimeCard';
import { Filter, ChevronDown, Search, Plus, Loader2, AlertTriangle, X, ChevronsUpDown, Send, List, History, Share2 } from 'lucide-react';
import { searchAnime } from '../../services/aniListService';
import { ResolveMatchModal } from '../modals/ResolveMatchModal';
import { Tile } from '../cards/Tile';

interface AnimeListViewProps {
  animeList: Anime[];
  isLoading: boolean;
  onViewDetails: (anime: Anime) => void;
  onUpdateAnime: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => void;
  onDelete: (anime: Anime) => void;
  onAddToList: (anime: Anime) => void;
  onApiError: (error: unknown) => void;
  isRateLimited: boolean;
  onOpenEditModal: (anime: Anime) => void; 
  onOpenAddModal: (anime: Anime) => void;  
  unresolvedAnimeIds: Set<number>;
  onResolveMatch: (originalMalId: number, matchedAnime: Anime) => void;
  customBackground: CustomBackgroundSettings;
  username: string;
  triggerSearchPulse: boolean;
  onSearchPulseConsumed: () => void;
}

const SkeletonCard: React.FC = () => (
  <div className="bg-secondary rounded-lg overflow-hidden animate-pulse">
    <div className="w-full h-72 bg-border-color"></div>
    <div className="p-4">
      <div className="h-4 bg-border-color rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-border-color rounded w-1/2 mb-4"></div>
      <div className="h-1.5 bg-border-color rounded-full"></div>
    </div>
  </div>
);

const SearchResultCard: React.FC<{
    anime: Anime;
    onAddClick: (e: React.MouseEvent) => void;
    onCardClick: () => void;
    customBackground: CustomBackgroundSettings;
}> = ({ anime, onAddClick, onCardClick, customBackground }) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-primary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };

  return (
    <button onClick={onCardClick} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-accent rounded-lg">
      <div 
        className="rounded-lg overflow-hidden shadow-lg group h-full flex flex-col border border-border-color"
        style={cardStyle}
      >
        <div className="relative">
          <img src={anime.posterUrl} alt={anime.title} className="w-full h-72 object-cover" />
        </div>
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary truncate group-hover:text-accent transition-colors duration-200">{anime.title}</h3>
            <p className="text-base text-text-secondary mt-1">{anime.format} &bull; {anime.startDate?.year || 'N/A'}</p>
          </div>
          <button
            onClick={onAddClick}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-base font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-blue-400"
          >
            <Plus size={16} />
            <span>Add to List</span>
          </button>
        </div>
      </div>
    </button>
  );
};

const UnresolvedSection: React.FC<{
  animeList: Anime[];
  unresolvedAnimeIds: Set<number>;
  onResolveMatch: (originalMalId: number, matchedAnime: Anime) => void;
  onApiError: (error: unknown) => void;
  customBackground: CustomBackgroundSettings;
}> = ({ animeList, unresolvedAnimeIds, onResolveMatch, onApiError, customBackground }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [animeToResolve, setAnimeToResolve] = useState<Anime | null>(null);

  const unresolvedList = useMemo(() => {
    return animeList.filter(a => unresolvedAnimeIds.has(a.id));
  }, [animeList, unresolvedAnimeIds]);

  if (unresolvedList.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex justify-between items-center text-left"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-bold text-yellow-300">Action Required: {unresolvedList.length} Unresolved Entries</h3>
              <p className="text-lg text-yellow-400/80">These entries could not be automatically matched. Please resolve them manually.</p>
            </div>
          </div>
          <ChevronsUpDown className={`w-6 h-6 text-yellow-400/80 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded && (
          <div className="mt-4 border-t border-yellow-700/50 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unresolvedList.map(anime => (
              <div key={anime.id} className="bg-primary p-3 rounded-md flex flex-col justify-between">
                <div>
                  <p className="font-bold text-text-primary truncate" title={anime.title}>{anime.title}</p>
                  <p className="text-sm text-text-secondary">MAL ID: {anime.id}</p>
                </div>
                <button
                  onClick={() => setAnimeToResolve(anime)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-base font-semibold bg-accent text-primary rounded-md hover:bg-blue-400 transition-colors"
                >
                  <Send size={16} />
                  <span>Resolve</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {animeToResolve && (
        <ResolveMatchModal
          anime={animeToResolve}
          isOpen={!!animeToResolve}
          onClose={() => setAnimeToResolve(null)}
          onResolve={onResolveMatch}
          onApiError={onApiError}
          customBackground={customBackground}
        />
      )}
    </>
  );
};

export const AnimeListView: React.FC<AnimeListViewProps> = ({ animeList, isLoading, onViewDetails, onUpdateAnime, onDelete, onAddToList, onApiError, isRateLimited, onOpenEditModal, onOpenAddModal, unresolvedAnimeIds, onResolveMatch, customBackground, username, triggerSearchPulse, onSearchPulseConsumed }) => {
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<WatchStatus>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<Anime[]>([]);
  const [isApiSearching, setIsApiSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (triggerSearchPulse) {
      setIsPulsing(true);
      onSearchPulseConsumed(); // Consume the trigger
    }
  }, [triggerSearchPulse, onSearchPulseConsumed]);

  const handleSearchInteraction = () => {
    if (isPulsing) {
      setIsPulsing(false);
    }
  };


  const allGenres = useMemo(() => {
    if (isLoading) return [];
    const genres = new Set<string>();
    animeList.forEach(anime => anime.genres?.forEach(genre => genres.add(genre)));
    return Array.from(genres).sort();
  }, [animeList, isLoading]);

  const handleStatusToggle = (status: WatchStatus) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };
  
  const resetFilters = () => {
    setSortOrder('date-desc');
    setSelectedStatuses(new Set());
    setSelectedGenres(new Set());
  };
  
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchInteraction();
    const trimmedSearch = searchTerm.trim();
    if (!trimmedSearch || isRateLimited) return;

    setIsApiSearching(true);
    setSearchError(null);
    setApiSearchResults([]);
    try {
      const results = await searchAnime(trimmedSearch);
      setApiSearchResults(results);
    } catch (error) {
      onApiError(error);
      if (!(error instanceof Error && error.message.includes('429'))) {
        setSearchError("Failed to search for new anime. Please try again later.");
      }
      console.error("Search failed:", error);
    } finally {
      setIsApiSearching(false);
    }
  };

  const filteredAndSortedList = useMemo(() => {
    let processedList = [...animeList].filter(a => !unresolvedAnimeIds.has(a.id));
    
    // Fuzzy search on local list
    if (searchTerm.trim()) {
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        processedList = processedList.filter(anime =>
            anime.title.toLowerCase().includes(lowercasedSearchTerm)
        );
    }

    if (selectedStatuses.size > 0) {
        processedList = processedList.filter(anime => selectedStatuses.has(anime.status));
    }

    if (selectedGenres.size > 0) {
      processedList = processedList.filter(anime =>
        anime.genres?.some(genre => selectedGenres.has(genre))
      );
    }

    processedList.sort((a, b) => {
      switch (sortOrder) {
        case 'date-desc': {
          const yearA = a.startDate?.year;
          const yearB = b.startDate?.year;
          if (yearA && yearB) return yearB - yearA;
          if (yearB) return -1;
          if (yearA) return 1;
          return 0;
        }
        case 'date-asc': {
          const yearA = a.startDate?.year;
          const yearB = b.startDate?.year;
          if (yearA && yearB) return yearA - yearB;
          if (yearA) return -1;
          if (yearB) return 1;
          return 0;
        }
        case 'score-desc': return (b.score || 0) - (a.score || 0);
        case 'score-asc': return (a.score || 0) - (b.score || 0);
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        default: return 0;
      }
    });

    return processedList;
  }, [animeList, searchTerm, sortOrder, selectedStatuses, selectedGenres, unresolvedAnimeIds]);
  
  const hasActiveFilters = selectedStatuses.size > 0 || selectedGenres.size > 0;
  
  const searchResultsInList = useMemo(() => {
    return apiSearchResults.filter(result => animeList.some(item => item.id === result.id));
  }, [apiSearchResults, animeList]);

  const searchResultsNotInList = useMemo(() => {
    return apiSearchResults.filter(result => !animeList.some(item => item.id === result.id));
  }, [apiSearchResults, animeList]);

  const emptyStateStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <List className="w-8 h-8 text-accent flex-shrink-0" />
            <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">{username}'s Anime List</h2>
                <p className="text-xl text-text-secondary">Your complete collection of tracked anime.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="Add New">
              <Plus size={22} />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="History">
              <History size={22} />
            </button>
            <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title="Share">
              <Share2 size={22} />
            </button>
          </div>
        </div>
        
        <UnresolvedSection 
          animeList={animeList}
          unresolvedAnimeIds={unresolvedAnimeIds}
          onResolveMatch={onResolveMatch}
          onApiError={onApiError}
          customBackground={customBackground}
        />

        <Tile 
          title="Search & Filter" 
          icon={Filter} 
          className={`transition-opacity ${isRateLimited ? 'opacity-50 pointer-events-none' : ''} ${isPulsing ? 'animate-pulse-glow' : ''}`}
          customBackground={customBackground}
        >
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit}>
                <label htmlFor="anime-search" className="block text-lg font-medium text-text-secondary mb-2">Search your list or discover new anime</label>
                <div className="relative flex">
                  <input
                      type="search"
                      id="anime-search"
                      placeholder="Type to filter your list, press Enter to find new anime..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); handleSearchInteraction(); }}
                      onFocus={handleSearchInteraction}
                      className="w-full bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-l-md py-2 px-3 text-text-primary pr-10 text-base"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(''); setApiSearchResults([]); }}
                      className="absolute right-[88px] sm:right-[100px] top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary"
                      aria-label="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button 
                      type="submit"
                      className="px-4 py-2 bg-accent text-primary rounded-r-md hover:bg-blue-400 transition-colors flex items-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed text-base"
                      disabled={isApiSearching || isRateLimited}
                  >
                      {isApiSearching ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
                      <span className="hidden sm:inline">Search</span>
                  </button>
                </div>
                <p className="text-base text-text-secondary mt-1">Live filtering your list as you type.</p>
            </form>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                >
                  <option value="date-desc">Sort by Release Date: Latest</option>
                  <option value="date-asc">Sort by Release Date: Oldest</option>
                  <option value="title-asc">Sort by Title: A-Z</option>
                  <option value="title-desc">Sort by Title: Z-A</option>
                  <option value="score-desc">Sort by Your Score: High to Low</option>
                  <option value="score-asc">Sort by Your Score: Low to High</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              </div>
            </div>
            
            <div className="border-t border-border-color pt-4">
                <label className="block text-lg font-medium text-text-secondary mb-2">Filter by Status</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(WatchStatus).map(status => (
                        <button
                            key={status}
                            onClick={() => handleStatusToggle(status)}
                            className={`px-4 py-2 text-base font-medium rounded-full transition-colors ${
                            selectedStatuses.has(status)
                                ? 'bg-accent text-primary'
                                : 'bg-border-color text-text-secondary hover:bg-accent/20'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {allGenres.length > 0 && (
              <div className="border-t border-border-color pt-4">
                  <label className="block text-lg font-medium text-text-secondary mb-2">Filter by Genre</label>
                  <div className="flex flex-wrap gap-2">
                      {allGenres.map(genre => (
                          <button
                              key={genre}
                              onClick={() => handleGenreToggle(genre)}
                              className={`px-4 py-2 text-base font-medium rounded-full transition-colors ${
                              selectedGenres.has(genre)
                                  ? 'bg-accent text-primary'
                                  : 'bg-border-color text-text-secondary hover:bg-accent/20'
                              }`}
                          >
                              {genre}
                          </button>
                      ))}
                      {hasActiveFilters && (
                          <button onClick={resetFilters} className="px-4 py-2 text-base font-medium rounded-full text-accent hover:bg-accent/10">Clear Filters</button>
                      )}
                  </div>
              </div>
            )}
          </div>
        </Tile>
        
        {isApiSearching && (
          <div className="text-center py-10">
              <Loader2 className="mx-auto h-10 w-10 text-accent animate-spin" />
              <p className="mt-2 text-lg text-text-secondary">Searching for new anime...</p>
          </div>
        )}
        {searchError && (
            <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5" /> {searchError}
            </div>
        )}
        {!isApiSearching && apiSearchResults.length > 0 && (
          <div className={`space-y-6 transition-opacity ${isRateLimited ? 'opacity-50 pointer-events-none' : ''}`}>
              {searchResultsInList.length > 0 && (
                <Tile title="In Your List" icon={List} customBackground={customBackground}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                    {searchResultsInList.map(anime => {
                        const fullAnime = animeList.find(a => a.id === anime.id) || anime;
                        return <AnimeCard key={anime.id} anime={fullAnime} onViewDetails={onViewDetails} showControls={true} onUpdateAnime={onUpdateAnime} onDelete={onDelete} onOpenEditModal={onOpenEditModal} customBackground={customBackground} />
                    })}
                  </div>
                </Tile>
              )}
              
              {searchResultsNotInList.length > 0 && (
                <Tile title="Search Results" icon={Search} customBackground={customBackground}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                      {searchResultsNotInList.map(anime => (
                          <SearchResultCard 
                              key={anime.id} 
                              anime={anime}
                              onCardClick={() => onViewDetails(anime)}
                              onAddClick={(e) => {
                                  e.stopPropagation();
                                  onOpenAddModal(anime); // Use centralized handler
                              }}
                              customBackground={customBackground}
                          />
                      ))}
                  </div>
                </Tile>
              )}
          </div>
        )}

        {!isApiSearching && apiSearchResults.length === 0 && (
          <Tile title="Your Collection" icon={List} customBackground={customBackground}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {isLoading
                ? Array.from({ length: 12 }).map((_, index) => <SkeletonCard key={index} />)
                : filteredAndSortedList.length > 0
                  ? filteredAndSortedList.map((anime) => <AnimeCard key={anime.id} anime={anime} onViewDetails={onViewDetails} showControls={true} onUpdateAnime={onUpdateAnime} onDelete={onDelete} onOpenEditModal={onOpenEditModal} customBackground={customBackground} />)
                  : (
                      <div 
                        className="col-span-full text-center py-16 rounded-lg border border-border-color"
                        style={emptyStateStyle}
                      >
                          <h3 className="text-2xl font-semibold text-text-primary">Your Collection is Empty</h3>
                          <p className="text-lg text-text-secondary mt-1">
                              {searchTerm || hasActiveFilters ? 'No anime match your current filters.' : 'Import your list from Settings to get started!'}
                          </p>
                      </div>
                  )}
            </div>
          </Tile>
        )}
      </div>
    </div>
  );
};