import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// FIX: 'HomeTileEnum' was imported as a type but used as a value. Moved it from the 'import type' statement to a value import.
import type { Anime, TimeSettings, ColonAnimation, CustomBackgroundSettings, DashboardSettings, DashboardLayout } from '../../types';
import { WatchStatus, HomeTile as HomeTileEnum } from '../../types';
import { AnimeStats } from '../stats/AnimeStats';
import { ContinueWatchingLane } from '../misc/ContinueWatchingLane';
import { Tv, BarChart3, CalendarDays, ChevronLeft, ChevronRight, Plus, History, Share2, Lock, Unlock, ChevronDown, Upload, PieChart } from 'lucide-react';
import { getGreetingPhrase } from '../../utils/greetings';
import { UpcomingCalendar } from '../misc/UpcomingCalendar';
import { Tile } from '../cards/Tile';
import { CUSTOM_LAYOUT_ID } from '../../utils/layouts';
import { GenreDistribution } from '../stats/GenreDistribution';

interface HomeViewProps {
  username: string;
  animeList: Anime[];
  isLoading: boolean;
  onUpdateAnime: (animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => void;
  onViewDetails: (anime: Anime) => void;
  onDelete: (anime: Anime) => void;
  timeSettings: TimeSettings;
  onViewListByStatus: (status: WatchStatus) => void;
  onOpenEditModal: (anime: Anime) => void;
  customBackground: CustomBackgroundSettings;
  isLayoutLocked: boolean;
  onToggleLock: () => void;
  dashboardSettings: DashboardSettings | null;
  onUpdateLayout: (layout: DashboardLayout) => void;
  onSetActiveLayout: (layoutId: string) => void;
  onNavigateToMyListWithPulse: () => void;
  onNavigateToSettingsWithPulse: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ username, animeList, isLoading, onUpdateAnime, onViewDetails, onDelete, timeSettings, onViewListByStatus, onOpenEditModal, customBackground, isLayoutLocked, onToggleLock, dashboardSettings, onUpdateLayout, onSetActiveLayout, onNavigateToMyListWithPulse, onNavigateToSettingsWithPulse }) => {
  // All hooks must be called at the top level, before any conditional returns.
  const [displayedSubGreeting, setDisplayedSubGreeting] = useState('');
  const [currentFullSubGreeting, setCurrentFullSubGreeting] = useState('');
  const animationTimeoutRef = useRef<number | null>(null);
  const currentCharacterIndexRef = useRef(0);
  const isDeletingRef = useRef(false);

  const [draggedTileId, setDraggedTileId] = useState<HomeTileEnum | null>(null);
  const [dropTargetId, setDropTargetId] = useState<HomeTileEnum | null>(null);
  const [isLg, setIsLg] = useState(window.matchMedia('(min-width: 1024px)').matches);

  const statsTileRef = useRef<HTMLDivElement>(null);
  const [forceStatsCarousel, setForceStatsCarousel] = useState(false);
  const [upcomingScrollProgress, setUpcomingScrollProgress] = useState(0);


  useEffect(() => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      const handler = () => setIsLg(mediaQuery.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
  }, []);


  const { timezone, format, showSeconds, colonAnimation, showDate, showYear } = timeSettings;
  const [timeParts, setTimeParts] = useState({ hour: '', minute: '', second: '', period: '' });
  const [dateString, setDateString] = useState('');
  const [statsTileView, setStatsTileView] = useState<'stats' | 'genres'>('stats');

  const continueWatchingScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollContinueWatchingLeft, setCanScrollContinueWatchingLeft] = useState(false);
  const [canScrollContinueWatchingRight, setCanScrollContinueWatchingRight] = useState(false);

  const typingSpeed = 70;
  const backspaceSpeed = 40;
  const waitAfterType = 10000;

  const animateSubGreeting = useCallback(() => {
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    const currentTarget = currentFullSubGreeting;
    let currentIndex = currentCharacterIndexRef.current;
    let isDeleting = isDeletingRef.current;

    if (!isDeleting) {
      if (currentIndex < currentTarget.length) {
        setDisplayedSubGreeting(currentTarget.substring(0, currentIndex + 1));
        currentCharacterIndexRef.current++;
        animationTimeoutRef.current = window.setTimeout(animateSubGreeting, typingSpeed);
      } else {
        isDeletingRef.current = true;
        animationTimeoutRef.current = window.setTimeout(animateSubGreeting, waitAfterType);
      }
    } else {
      if (currentIndex > 0) {
        setDisplayedSubGreeting(currentTarget.substring(0, currentIndex - 1));
        currentCharacterIndexRef.current--;
        animationTimeoutRef.current = window.setTimeout(animateSubGreeting, backspaceSpeed);
      } else {
        isDeletingRef.current = false;
        const newPhrase = getGreetingPhrase();
        setCurrentFullSubGreeting(newPhrase);
        currentCharacterIndexRef.current = 0;
        animationTimeoutRef.current = window.setTimeout(animateSubGreeting, typingSpeed);
      }
    }
  }, [currentFullSubGreeting]);

  useEffect(() => {
    if (!currentFullSubGreeting) {
      const initialGreeting = getGreetingPhrase();
      setCurrentFullSubGreeting(initialGreeting);
    } else {
      animateSubGreeting();
    }
    return () => { if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current); };
  }, [currentFullSubGreeting, animateSubGreeting]);


  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const timeOptions: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          hour12: format === '12h',
          hour: '2-digit',
          minute: '2-digit',
          ...(showSeconds && { second: '2-digit' }),
        };
        const timeFormatter = new Intl.DateTimeFormat('en-US', timeOptions);
        const parts = timeFormatter.formatToParts(now);

        setTimeParts({
            hour: parts.find(p => p.type === 'hour')?.value || '00',
            minute: parts.find(p => p.type === 'minute')?.value || '00',
            second: parts.find(p => p.type === 'second')?.value || '',
            period: parts.find(p => p.type === 'dayPeriod')?.value || '',
        });

        if (showDate) {
            const dateOptions: Intl.DateTimeFormatOptions = {
                timeZone: timezone,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                ...(showYear && { year: 'numeric' }),
            };
            setDateString(new Intl.DateTimeFormat('en-US', dateOptions).format(now));
        }

      } catch (e) {
        console.error("Invalid timezone for clock:", timezone);
        setTimeParts({ hour: 'XX', minute: 'XX', second: '', period: '' });
        setDateString('Invalid Date');
      }
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [timezone, format, showSeconds, showDate, showYear]);

  const watchingList = useMemo(() => animeList.filter(a => a.status === 'Watching'), [animeList]);

  const upcomingList = useMemo(() => {
    const currentlyAiring = animeList
      .filter(a => a.status === WatchStatus.Watching && a.mediaStatus === 'RELEASING')
      .sort((a, b) => (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10));
    const planToWatchFuture = animeList
      .filter(a => 
        a.status === WatchStatus.PlanToWatch && 
        (a.mediaStatus === 'NOT_YET_RELEASED' || (!a.mediaStatus && a.totalEpisodes === 0))
      )
      .sort((a, b) => {
        const yearA = a.startDate?.year || 9999;
        const yearB = b.startDate?.year || 9999;
        if (yearA !== yearB) return yearA - yearB;
        return (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10);
      });
    return [...currentlyAiring, ...planToWatchFuture];
  }, [animeList]);

  const checkScrollability = useCallback((
    container: HTMLDivElement | null, 
    setCanScrollLeft: React.Dispatch<React.SetStateAction<boolean>>,
    setCanScrollRight: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(Math.ceil(scrollLeft) + clientWidth < scrollWidth - 1);
    }
  }, []);

  useEffect(() => {
    const container = continueWatchingScrollRef.current;
    if (!container) return;
    const check = () => checkScrollability(container, setCanScrollContinueWatchingLeft, setCanScrollContinueWatchingRight);
    check();
    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(container);
    container.addEventListener('scroll', check, { passive: true });
    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', check);
    };
  }, [watchingList, checkScrollability]);

  const activeLayout = useMemo(() => {
    if (!dashboardSettings) return null;
    return dashboardSettings.layouts.find(l => l.id === dashboardSettings.activeLayoutId);
  }, [dashboardSettings]);

  const continueWatchingTileConfig = useMemo(() => activeLayout?.layout.find(t => t.id === HomeTileEnum.ContinueWatching), [activeLayout]);
  const isContinueWatchingFullWidth = useMemo(() => !!(continueWatchingTileConfig && continueWatchingTileConfig.w >= 2), [continueWatchingTileConfig]);

  const statsTileConfig = useMemo(() => activeLayout?.layout.find(t => t.id === HomeTileEnum.Stats), [activeLayout]);
  const isStatsTileTall = useMemo(() => statsTileConfig && statsTileConfig.h > 1, [statsTileConfig]);
  
  useEffect(() => {
    const tileEl = statsTileRef.current;
    if (!tileEl || !isStatsTileTall) {
        if (forceStatsCarousel) setForceStatsCarousel(false);
        return;
    }

    const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry) {
            const MIN_STACK_HEIGHT = 550; // Threshold for vertical stacking
            const shouldForceCarousel = entry.contentRect.height < MIN_STACK_HEIGHT;
            if (shouldForceCarousel !== forceStatsCarousel) {
                setForceStatsCarousel(shouldForceCarousel);
            }
        }
    });

    observer.observe(tileEl);
    return () => observer.disconnect();
  }, [isStatsTileTall, forceStatsCarousel]);


  
  // Non-hook logic and JSX can be defined after hooks.
  const animatedAnims: ColonAnimation[] = ['blink', 'fade', 'pulse'];
  const colonAnimationClass = animatedAnims.includes(colonAnimation) ? `animate-${colonAnimation}-colon` : '';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 18) return 'Good Afternoon';
    if (hour >= 18 && hour < 22) return 'Good Night';
    return 'Good Night';
  };

  const handleScroll = (direction: 'left' | 'right', containerRef: React.RefObject<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.9;
      container.scrollTo({
        left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
        behavior: 'smooth',
      });
    }
  };

  const continueWatchingCarouselControls = (
    <div className="flex items-center gap-3">
      <button onClick={() => handleScroll('left', continueWatchingScrollRef)} aria-label="Scroll left" disabled={!canScrollContinueWatchingLeft} className="p-2 bg-secondary border border-border-color text-text-secondary rounded-md hover:bg-border-color hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronLeft size={24} />
      </button>
      <button onClick={() => handleScroll('right', continueWatchingScrollRef)} aria-label="Scroll right" disabled={!canScrollContinueWatchingRight} className="p-2 bg-secondary border border-border-color text-text-secondary rounded-md hover:bg-border-color hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronRight size={24} />
      </button>
    </div>
  );

  const handleLayoutChange = (newLayoutId: string) => {
    onSetActiveLayout(newLayoutId);
  };

  const handleDrop = (dragId: HomeTileEnum, dropId: HomeTileEnum) => {
    if (!dragId || dragId === dropId || !dashboardSettings) return;

    let currentLayout = dashboardSettings.layouts.find(l => l.id === dashboardSettings.activeLayoutId);
    let targetLayoutId = dashboardSettings.activeLayoutId;
    
    if (currentLayout && !currentLayout.isEditable) {
        const customLayout = dashboardSettings.layouts.find(l => l.id === CUSTOM_LAYOUT_ID);
        const newCustomLayout = { ...customLayout!, layout: [...currentLayout.layout], name: "Custom" };
        onUpdateLayout(newCustomLayout);
        onSetActiveLayout(CUSTOM_LAYOUT_ID);
        currentLayout = newCustomLayout;
        targetLayoutId = CUSTOM_LAYOUT_ID;
    }
    
    if (!currentLayout) return;

    // Helper for the original generic swap logic
    const performSimpleSwap = () => {
        const draggedItem = currentLayout!.layout.find(t => t.id === dragId);
        const dropItem = currentLayout!.layout.find(t => t.id === dropId);
        if (!draggedItem || !dropItem) return;

        const { x: x1, y: y1, w: w1, h: h1 } = draggedItem;
        const { x: x2, y: y2, w: w2, h: h2 } = dropItem;

        const newLayoutConfig = currentLayout!.layout.map(tile => {
            if (tile.id === dragId) return { ...tile, x: x2, y: y2, w: w2, h: h2 };
            if (tile.id === dropId) return { ...tile, x: x1, y: y1, w: w1, h: h1 };
            return tile;
        });
        onUpdateLayout({ ...currentLayout!, id: targetLayoutId, layout: newLayoutConfig });
    };

    // --- NEW LOGIC for Stats Focused Layout ---
    const tallItem = currentLayout.layout.find(t => t.h === 2);
    const shortItems = currentLayout.layout.filter(t => t.h === 1);
    const isStatsFocusedLayout = tallItem && shortItems.length === 2 && tallItem.id === HomeTileEnum.Stats;

    if (isStatsFocusedLayout) {
        const draggedItem = currentLayout.layout.find(t => t.id === dragId)!;
        const dropItem = currentLayout.layout.find(t => t.id === dropId)!;

        // Check if dragging 'upcoming' on 'continue-watching' or vice-versa.
        const areBothShort = shortItems.some(si => si.id === dragId) && shortItems.some(si => si.id === dropId);
        // Check if dragging tall tile on short tile or vice-versa.
        const isTallShortSwap = draggedItem.h !== dropItem.h;

        if (areBothShort) {
            // Case B: Swapping two short items. `performSimpleSwap` works perfectly here.
            performSimpleSwap();
        } else if (isTallShortSwap) {
            // Case A: Swapping tall column with short column.
            const newLayoutConfig = currentLayout.layout.map(tile => {
                if (tile.id === tallItem.id) {
                    return { ...tile, x: shortItems[0].x }; // Move tall to short's column
                }
                // Check if the current tile is one of the short items
                if (shortItems.some(si => si.id === tile.id)) {
                    return { ...tile, x: tallItem.x }; // Move short items to tall's column
                }
                return tile;
            });
            onUpdateLayout({ ...currentLayout, id: targetLayoutId, layout: newLayoutConfig });
        }
        // Case C: Any other drag is invalid, so we just return.
        return;
    }

    // Fallback to original logic for all other layouts
    performSimpleSwap();
  };

  const handleDragStart = (e: React.DragEvent, id: HomeTileEnum) => {
    if (isLayoutLocked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("tileId", id);
    setDraggedTileId(id);
  };

  const handleDragEnd = () => {
    setDraggedTileId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (id: HomeTileEnum) => {
    if (draggedTileId && draggedTileId !== id) {
      setDropTargetId(id);
    }
  };

  const handleDropEvent = (e: React.DragEvent, dropId: HomeTileEnum) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("tileId") as HomeTileEnum;
    handleDrop(draggedId, dropId);
    setDraggedTileId(null);
    setDropTargetId(null);
  };
  
  const isStatsTileFullWidthTop = useMemo(() => statsTileConfig && statsTileConfig.w >= 2 && statsTileConfig.y === 0, [statsTileConfig]);
  const useStackedLayout = useMemo(() => (isStatsTileFullWidthTop || isStatsTileTall) && !forceStatsCarousel, [isStatsTileFullWidthTop, isStatsTileTall, forceStatsCarousel]);


  const statsCarouselControls = (
    <div className="flex items-center gap-3">
      <button onClick={() => setStatsTileView('stats')} aria-label="Show stats" disabled={statsTileView === 'stats'} className="p-2 bg-secondary border border-border-color text-text-secondary rounded-md hover:bg-border-color hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronLeft size={24} />
      </button>
      <button onClick={() => setStatsTileView('genres')} aria-label="Show genres" disabled={statsTileView === 'genres'} className="p-2 bg-secondary border border-border-color text-text-secondary rounded-md hover:bg-border-color hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <ChevronRight size={24} />
      </button>
    </div>
  );

  const tileRenderMap: Record<HomeTileEnum, React.ReactNode> = {
    'continue-watching': (
        <Tile
            title={watchingList.length > 0 ? "Continue Watching" : "Nothing to watch right now"}
            icon={Tv}
            headerExtra={watchingList.length > 0 ? continueWatchingCarouselControls : undefined}
            className="h-full"
            customBackground={customBackground}
            headerClassName={!isLayoutLocked && isLg ? 'cursor-grab' : ''}
        >
            <ContinueWatchingLane 
                scrollContainerRef={continueWatchingScrollRef} 
                watchingList={watchingList} 
                onUpdateAnime={onUpdateAnime} 
                onViewDetails={onViewDetails} 
                onDelete={onDelete} 
                onOpenEditModal={onOpenEditModal} 
                customBackground={customBackground} 
                isFullWidth={isContinueWatchingFullWidth}
            />
        </Tile>
    ),
    'stats': (
        <Tile 
            ref={statsTileRef}
            title={useStackedLayout ? "Statistics Overview" : (statsTileView === 'stats' ? "Your Anime Stats" : "Genre Distribution")}
            icon={useStackedLayout ? BarChart3 : (statsTileView === 'stats' ? BarChart3 : PieChart)} 
            className="h-full" 
            customBackground={customBackground} 
            headerClassName={!isLayoutLocked && isLg ? 'cursor-grab' : ''}
            headerExtra={!useStackedLayout && animeList.length > 0 ? statsCarouselControls : undefined}
        >
            {animeList.length > 0 ? (
              useStackedLayout ? (
                isStatsTileFullWidthTop ? (
                  <div className="flex flex-col md:flex-row h-full gap-6">
                      <div className="flex flex-col flex-1 min-h-0">
                          <h4 className="text-xl font-semibold text-text-primary mb-4 flex-shrink-0">Overall Stats</h4>
                          <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin">
                              <AnimeStats animeList={animeList} onViewListByStatus={onViewListByStatus} />
                          </div>
                      </div>
                      <div className="w-full h-px bg-border-color md:w-px md:h-full" />
                      <div className="flex flex-col flex-1 min-h-0">
                          <h4 className="text-xl font-semibold text-text-primary mb-4 flex-shrink-0">Genre Distribution</h4>
                          <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin">
                              <GenreDistribution animeList={animeList} />
                          </div>
                      </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full gap-6 overflow-y-auto scrollbar-thin">
                      <div className="flex flex-col">
                          <h4 className="text-xl font-semibold text-text-primary mb-4 flex-shrink-0">Overall Stats</h4>
                          <AnimeStats animeList={animeList} onViewListByStatus={onViewListByStatus} />
                      </div>
                      <div className="w-full h-px bg-border-color" />
                      <div className="flex flex-col">
                          <h4 className="text-xl font-semibold text-text-primary mb-4 flex-shrink-0">Genre Distribution</h4>
                          <GenreDistribution animeList={animeList} />
                      </div>
                  </div>
                )
              ) : (
                <div className="relative w-full h-full overflow-hidden">
                    <div 
                        className="absolute inset-0 flex transition-transform duration-300 ease-in-out" 
                        style={{ transform: statsTileView === 'genres' ? 'translateX(-100%)' : 'translateX(0%)' }}
                    >
                        <div className="w-full h-full flex-shrink-0 overflow-y-auto scrollbar-thin">
                            <AnimeStats animeList={animeList} onViewListByStatus={onViewListByStatus} useAbbreviations={true} />
                        </div>
                        <div className="w-full h-full flex-shrink-0 overflow-y-auto scrollbar-thin">
                            <GenreDistribution animeList={animeList} />
                        </div>
                    </div>
                </div>
              )
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <BarChart3 className="w-16 h-16 text-text-secondary mb-4" />
                    <p className="text-xl text-text-primary font-medium">Your Stats Await</p>
                    <p className="text-base text-text-secondary/70 mt-1">Import your list in Settings to see your stats.</p>
                </div>
            )}
        </Tile>
    ),
    'upcoming': (
        <Tile 
            title="Upcoming" 
            icon={CalendarDays} 
            className="h-full" 
            customBackground={customBackground} 
            headerClassName={!isLayoutLocked && isLg ? 'cursor-grab' : ''}
            scrollProgress={upcomingScrollProgress}
        >
            <UpcomingCalendar 
                animeList={animeList} 
                onViewDetails={onViewDetails}
                onScrollUpdate={setUpcomingScrollProgress}
            />
        </Tile>
    ),
  };

  // Conditional rendering logic is now after all hooks.
  if (animeList.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-4xl lg:text-5xl font-bold text-text-primary">Welcome to Project Hermes</h1>
        <p className="mt-4 text-xl text-text-secondary max-w-2xl">Your personal, private, and powerful anime companion. Get started by adding your first anime or importing your existing list.</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <button onClick={onNavigateToMyListWithPulse} className="group p-8 rounded-lg border border-border-color bg-secondary hover:border-accent/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center focus:outline-none">
            <div className="p-4 bg-primary rounded-full border-2 border-border-color group-hover:border-accent/50 transition-colors">
                <Plus size={48} className="text-accent"/>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">Start Building Your List</h2>
                <p className="mt-2 text-lg text-text-secondary max-w-sm">Search for anime and add them manually to begin tracking your progress.</p>
            </div>
          </button>
          <button onClick={onNavigateToSettingsWithPulse} className="group p-8 rounded-lg border border-border-color bg-secondary hover:border-accent/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center focus:outline-none">
            <div className="p-4 bg-primary rounded-full border-2 border-border-color group-hover:border-accent/50 transition-colors">
                <Upload size={48} className="text-accent"/>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">Import from MyAnimeList</h2>
                <p className="mt-2 text-lg text-text-secondary max-w-sm">Bring your existing list from MAL by importing an XML file.</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-y-2 lg:gap-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">{getGreeting()}, {username}!</h1>
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
                <button onClick={onToggleLock} className="p-2 text-text-secondary hover:text-text-primary hover:bg-secondary rounded-full transition-colors" title={isLayoutLocked ? "Unlock Layout" : "Lock Layout"}>
                  {isLayoutLocked ? <Lock size={22} /> : <Unlock size={22} />}
                </button>
                {!isLayoutLocked && dashboardSettings && (
                  <div className="relative">
                    <select
                      value={dashboardSettings.activeLayoutId}
                      onChange={(e) => handleLayoutChange(e.target.value)}
                      className="h-10 appearance-none bg-secondary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 pl-4 pr-8 text-text-primary text-base"
                    >
                      {dashboardSettings.layouts.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                  </div>
                )}
                <div className="flex items-baseline text-text-primary ml-2 sm:ml-4">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{timeParts.hour}</span>
                  {colonAnimation !== 'none' && <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${colonAnimationClass}`}>:</span>}
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{timeParts.minute}</span>
                  {showSeconds && timeParts.second && (
                      <>
                          {colonAnimation !== 'none' && <span className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${colonAnimationClass}`}>:</span>}
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{timeParts.second}</span>
                      </>
                  )}
                  {timeParts.period && (
                      <p className="text-base sm:text-lg lg:text-xl font-medium text-text-secondary/80 ml-2 sm:ml-4 self-end pb-1 lg:pb-2">{timeParts.period}</p>
                  )}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-1">
              <p className="text-lg md:text-xl text-text-secondary typing-cursor">{displayedSubGreeting}</p>
              {showDate && (
                  <p className="text-lg lg:text-xl text-text-secondary tracking-wide">{dateString}</p>
              )}
          </div>
      </div>
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow`} style={{ gridAutoRows: 'minmax(0, 1fr)'}}>
        {isLoading ? (
          <>
            <div className="col-span-2 rounded-lg animate-pulse bg-secondary"></div>
            <div className="rounded-lg animate-pulse bg-secondary"></div>
            <div className="rounded-lg animate-pulse bg-secondary"></div>
          </>
        ) : (
          activeLayout?.layout.sort((a, b) => a.y - b.y || a.x - b.x).map(tileConfig => {
            const isBeingDragged = draggedTileId === tileConfig.id;
            const isDropTarget = dropTargetId === tileConfig.id;
            
            return (
              <div
                key={tileConfig.id}
                style={{
                  gridColumn: isLg ? `span ${tileConfig.w}` : 'span 1',
                  gridRow: isLg ? `span ${tileConfig.h}` : 'span 1',
                }}
                className={`
                  transition-all duration-300
                  ${isBeingDragged && isLg ? 'opacity-30' : ''}
                  ${isDropTarget && isLg ? 'ring-2 ring-accent ring-inset rounded-lg' : ''}
                `}
                draggable={!isLayoutLocked && isLg}
                onDragStart={(e) => handleDragStart(e, tileConfig.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropEvent(e, tileConfig.id)}
                onDragEnter={() => handleDragEnter(tileConfig.id)}
                onDragLeave={() => setDropTargetId(null)}
              >
                {tileRenderMap[tileConfig.id]}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};