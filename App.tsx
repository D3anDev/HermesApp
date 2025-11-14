import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { AnimeListView } from './components/views/AnimeListView';
import { HomeView } from './components/views/HomeView';
import { SettingsView } from './components/views/SettingsView';
import { AnimeDetailModal } from './components/modals/AnimeDetailModal';
import { Anime, ViewType, RssArticle, TimeSettings, CustomBackgroundSettings, ExportDataType, LiveEffectSettings, LiveEffectType, BookmarkedItem, BookmarkedImage, MalAuthData, AppearancePreset, DashboardSettings, DashboardLayout } from './types';
import { WatchStatus } from './types';
import { DiscoverView } from './components/views/DiscoverView';
import { SavedView } from './components/views/SavedView';
import { AboutView } from './components/views/AboutView';
import { ArticleDetailModal } from './components/modals/ArticleDetailModal';
import { loadAnimeListFromCache, saveAnimeListToCache, loadDetailsCache, saveDetailsCache, DetailsCache, loadRssFeedsFromCache, saveRssFeedsToCache, loadTimeSettingsFromCache, saveTimeSettingsToCache, loadCustomBackgroundSettings, saveCustomBackgroundSettings, loadLiveEffectSettings, saveLiveEffectSettings, loadUnresolvedIdsFromCache, saveUnresolvedIdsToCache, ANIME_LIST_KEY, ANIME_DETAILS_CACHE_KEY, RSS_FEEDS_KEY, TIME_SETTINGS_KEY, CUSTOM_BACKGROUND_KEY, LIVE_EFFECT_KEY, UNRESOLVED_ANIME_IDS_KEY, loadBookmarkedItemsFromCache, saveBookmarkedItemsToCache, BOOKMARKED_ITEMS_KEY, saveMalTokens, loadMalTokens, clearMalTokens, loadMalClientId, saveMalClientId, MAL_CLIENT_ID_KEY, saveAppearancePresetsToCache, loadAppearancePresetsFromCache, saveActivePresetIdToCache, loadActivePresetIdFromCache, APPEARANCE_PRESETS_KEY, ACTIVE_PRESET_ID_KEY, saveDashboardSettingsToCache, loadDashboardSettingsFromCache } from './utils/cache';
import { ConfirmationModal } from './components/modals/ConfirmationModal';
import { ProfileView } from './components/views/ProfileView';
import { fetchAnimeDetails, RateLimitError } from './services/aniListService';
import { getTokens, getUserInfo } from './services/malService';
import { StatusAnimeListModal } from './components/modals/StatusAnimeListModal';
import { FetchLogModal } from './components/modals/FetchLogModal';
import { generateMalXml } from './utils/xmlGenerator';
import { downloadFile } from './utils/fileDownloader';
import { EditProgressModal } from './components/modals/EditProgressModal';
import { AddToListModal } from './components/modals/AddToListModal';
import LiveEffectOverlay from './components/misc/LiveEffectOverlay';
import { PREDEFINED_FEEDS } from './utils/predefinedFeeds';
import { ManageFeedsModal } from './components/modals/ManageFeedsModal';
import { ImageViewerModal } from './components/modals/ImageViewerModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { SavePresetModal } from './components/modals/SavePresetModal';
import { PREDEFINED_LAYOUTS, CUSTOM_LAYOUT_ID } from './utils/layouts';
import { PREDEFINED_PRESETS, DEFAULT_PRESET } from './utils/presets';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [detailsCache, setDetailsCache] = useState<DetailsCache>({});
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkedItem[]>([]);
  const [rssFeeds, setRssFeeds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<RssArticle | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userProfile, setUserProfile] = useState({
    username: 'User',
    profilePic: 'https://picsum.photos/40/40?grayscale',
  });
  const [confirmationRequest, setConfirmationRequest] = useState<{
    anime: Anime;
    onConfirm: () => void;
  } | null>(null);
  const [completionRequest, setCompletionRequest] = useState<Anime | null>(null);
  const [deleteRequest, setDeleteRequest] = useState<Anime | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [isFetchingProfileData, setIsFetchingProfileData] = useState(false);
  const [timeSettings, setTimeSettings] = useState<TimeSettings>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    format: '12h',
    showSeconds: false,
    colonAnimation: 'blink',
    showDate: true,
    dateFormat: 'month-day',
    showYear: false,
    numericDateStyle: 'md',
  });
  const [isStatusListModalOpen, setIsStatusListModalOpen] = useState(false);
  const [selectedStatusForListModal, setSelectedStatusForListModal] = useState<WatchStatus | null>(null);
  const [customBackground, setCustomBackground] = useState<CustomBackgroundSettings>({
    imageUrl: null,
    opacity: 1,
    blur: 8,
    brightness: 1,
    contrast: 1,
    grayscale: false,
    positionX: 50,
    positionY: 50,
    zoom: 100,
    tileOpacity: 0.9,
    backgroundOverlayOpacity: 0.85,
    accentColor: null,
    componentColor: null,
    overlayColor: null,
    primaryTextColor: null,
    secondaryTextColor: null,
  });
  const [liveEffectSettings, setLiveEffectSettings] = useState<LiveEffectSettings>({
    type: LiveEffectType.None,
    count: 50,
    size: 15,
    speed: 1,
    windIntensity: 0.2,
    color: '#F0F8FF', // AliceBlue
  });
  const [appearancePresets, setAppearancePresets] = useState<AppearancePreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [appearanceHistory, setAppearanceHistory] = useState<{ background: CustomBackgroundSettings, effects: LiveEffectSettings }[]>([]);


  // New state for centralized preset modals
  const [presetModalState, setPresetModalState] = useState<{ mode: 'new' | 'rename' | 'duplicate'; presetId?: string; initialName?: string } | null>(null);
  const [presetConfirmState, setPresetConfirmState] = useState<{ mode: 'overwrite' | 'delete'; presetId: string; presetName: string } | null>(null);

  // New state for dashboard customization
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | null>(null);
  const [isLayoutLocked, setIsLayoutLocked] = useState(true);
  
  // New state for onboarding/guidance
  const [triggerSearchPulse, setTriggerSearchPulse] = useState(false);
  const [triggerImportPulse, setTriggerImportPulse] = useState(false);



  // Centralized state for EditProgressModal and AddToListModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [animeToEdit, setAnimeToEdit] = useState<Anime | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [animeToAddToList, setAnimeToAddToList] = useState<Anime | null>(null);
  const [malAuthData, setMalAuthData] = useState<MalAuthData | null>(null);
  const [malClientId, setMalClientId] = useState<string | null>(null);
  const [isManageFeedsModalOpen, setIsManageFeedsModalOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);


  // States for Delete All Data functionality
  const [isDeleteAllPromptOpen, setIsDeleteAllPromptOpen] = useState(false);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);


  // Refs and state for background fetching logic
  const fetchQueueRef = useRef<number[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false); // True if `processSingleAnimeDetails` is currently running for an item.
  const hasPopulatedInitialQueue = useRef<boolean>(false);
  const queueTimeoutRef = useRef<number | null>(null); // Timer ID for scheduling the next item.
  const [fetchProgress, setFetchProgress] = useState({ total: 0, current: 0, fetchingTitle: '', inProgress: false });
  const [fetchLogs, setFetchLogs] = useState<string[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [retryDelay, setRetryDelay] = useState(2000); // Slower delay of 2 seconds for fetches
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [networkErrorCountdown, setNetworkErrorCountdown] = useState({ current: 0, initial: 0 });


  const [unresolvedAnimeIds, setUnresolvedAnimeIds] = useState<Set<number>>(new Set<number>());

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setFetchLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // New Effect to update CSS variables for dynamic theming
  useEffect(() => {
    const root = document.documentElement;

    const hexToRgb = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
            : '';
    };

    const accent = customBackground.accentColor || '#58A6FF';
    const primary = customBackground.overlayColor || '#0D1117';
    const secondary = customBackground.componentColor || '#161B22';
    const textPrimary = customBackground.primaryTextColor || '#C9D1D9';
    const textSecondary = customBackground.secondaryTextColor || '#8B949E';

    root.style.setProperty('--color-primary-rgb', hexToRgb(primary));
    root.style.setProperty('--color-secondary-rgb', hexToRgb(secondary));
    root.style.setProperty('--color-accent-rgb', hexToRgb(accent));
    root.style.setProperty('--color-text-primary-rgb', hexToRgb(textPrimary));
    root.style.setProperty('--color-text-secondary-rgb', hexToRgb(textSecondary));
  }, [customBackground]);


  useEffect(() => {
    // This effect is solely for managing the rate limit countdown.
    if (!isRateLimited) {
      return; // Do nothing if not rate-limited.
    }

    // If rate-limited, but the timer has run out, lift the restriction.
    if (rateLimitSeconds <= 0) {
      setIsRateLimited(false);
      addLog("Rate limit lifted. Resuming queue.");
      // The orchestrator `useEffect` will now take over and reset the delay on the next successful fetch.
      return;
    }

    // Otherwise, we are rate-limited and the timer is still running, so decrement it.
    const timerId = setTimeout(() => {
      setRateLimitSeconds(s => s - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [isRateLimited, rateLimitSeconds, addLog]);

  useEffect(() => {
    // This effect is for the network error retry countdown display
    if (!isNetworkError || isRateLimited) {
        return; // Do nothing if not in a network error state or if rate limited
    }

    if (networkErrorCountdown.current <= 0) {
        // The main queue will reset `isNetworkError` on the next success. This timer is just for display.
        return;
    }

    const timerId = setTimeout(() => {
        setNetworkErrorCountdown(prev => ({ ...prev, current: Math.max(0, prev.current - 1) }));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [isNetworkError, isRateLimited, networkErrorCountdown.current]);


  // Effect to handle MAL OAuth callback and load initial data
  useEffect(() => {
    const handleAuthentication = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');

        if (authCode) {
            // Clear params from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            try {
                const tokens = await getTokens(authCode);
                saveMalTokens(tokens);
                const user = await getUserInfo(tokens.access_token);
                setMalAuthData({ tokens, user });
            } catch (error) {
                console.error("MAL Authentication failed:", error);
                alert("Failed to connect to MyAnimeList. Please try again.");
            }
        } else {
            const cachedTokens = loadMalTokens();
            if (cachedTokens) {
                // TODO: Add token refresh logic here if token is expired
                try {
                    const user = await getUserInfo(cachedTokens.access_token);
                    setMalAuthData({ tokens: cachedTokens, user });
                } catch (error) {
                    console.error("Failed to validate existing MAL session:", error);
                    clearMalTokens(); // Clear invalid tokens
                }
            }
        }
    };
    
    handleAuthentication();

    setIsLoading(true);
    const cachedList = loadAnimeListFromCache();
    const cachedDetails = loadDetailsCache();
    const cachedFeeds = loadRssFeedsFromCache();
    const cachedTimeSettings = loadTimeSettingsFromCache();
    const cachedUnresolvedIds = loadUnresolvedIdsFromCache();
    const cachedBookmarks = loadBookmarkedItemsFromCache();
    const cachedMalClientId = loadMalClientId();
    const cachedDashboardSettings = loadDashboardSettingsFromCache();
    
    // Appearance settings with presets
    const cachedPresets = loadAppearancePresetsFromCache();
    const cachedActivePresetId = loadActivePresetIdFromCache();
    setAppearancePresets(cachedPresets);

    const allAvailablePresets = [...PREDEFINED_PRESETS, ...cachedPresets];
    
    if (cachedActivePresetId) {
        const activePreset = allAvailablePresets.find(p => p.id === cachedActivePresetId);
        if (activePreset) {
            setCustomBackground(activePreset.background);
            setLiveEffectSettings(activePreset.effects);
            setActivePresetId(cachedActivePresetId);
        } else {
            // Fallback if active preset was deleted but ID remains in cache
            setCustomBackground(loadCustomBackgroundSettings() || customBackground);
            setLiveEffectSettings(loadLiveEffectSettings() || liveEffectSettings);
            setActivePresetId(null);
        }
    } else {
        // Default loading if no preset is active
        setCustomBackground(loadCustomBackgroundSettings() || customBackground);
        setLiveEffectSettings(loadLiveEffectSettings() || liveEffectSettings);
    }
    
    if (cachedList) {
        const mergedList = cachedList.map(anime => ({
            ...anime,
            ...(cachedDetails?.[anime.id] || {})
        }));
        setAnimeList(mergedList);
    }
    if (cachedDetails) {
        setDetailsCache(cachedDetails);
    }
    setRssFeeds(cachedFeeds);
    if (cachedTimeSettings) {
        setTimeSettings(cachedTimeSettings);
    }
    if (cachedUnresolvedIds) {
      setUnresolvedAnimeIds(cachedUnresolvedIds);
    }
    if (cachedBookmarks) {
      setBookmarkedItems(cachedBookmarks);
    }
    if (cachedMalClientId) {
      setMalClientId(cachedMalClientId);
    }
    if (cachedDashboardSettings) {
      const customLayouts = cachedDashboardSettings.layouts.filter(l => l.isEditable);
      setDashboardSettings({
        ...cachedDashboardSettings,
        layouts: [...PREDEFINED_LAYOUTS, ...customLayouts]
      });
    } else {
      setDashboardSettings({
        layouts: [...PREDEFINED_LAYOUTS, {
          id: CUSTOM_LAYOUT_ID,
          name: 'Custom',
          isEditable: true,
          layout: PREDEFINED_LAYOUTS.find(p => p.id === 'default')?.layout || []
        }],
        activeLayoutId: 'default'
      });
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    saveBookmarkedItemsToCache(bookmarkedItems);
  }, [bookmarkedItems]);

  useEffect(() => {
    if (dashboardSettings) {
      saveDashboardSettingsToCache(dashboardSettings);
    }
  }, [dashboardSettings]);

  const handleUpdateAnimeDetails = useCallback((animeId: number, details: Partial<Anime>) => {
    // If we successfully get details for an anime, it's no longer unresolved.
    setUnresolvedAnimeIds(prev => {
        if (prev.has(animeId)) {
            // FIX: Explicitly type Set to Set<number> to prevent type inference issues.
            const newSet = new Set<number>(prev);
            newSet.delete(animeId);
            saveUnresolvedIdsToCache(newSet);
            return newSet;
        }
        return prev;
    });

    setAnimeList(prevList => {
      const newList = prevList.map(anime =>
        anime.id === animeId ? { ...anime, ...details } : anime
      );
      saveAnimeListToCache(newList);
      return newList;
    });
    setDetailsCache(prevCache => {
      const newCache = { ...prevCache, [animeId]: { ...(prevCache[animeId] || {}), ...details } };
      saveDetailsCache(newCache);
      return newCache;
    });
    setSelectedAnime(prev => {
        if (prev && prev.id === animeId) {
            return { ...prev, ...details };
        }
        return prev;
    });
    setAnimeToEdit(prev => { // Update animeToEdit if it's the one being edited
      if (prev && prev.id === animeId) {
        return { ...prev, ...details };
      }
      return prev;
    });
  }, []);
  
  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof RateLimitError) {
      if (!isRateLimited) { // Only set if not already rate limited to avoid resetting countdown
        const seconds = error.retryAfter > 0 ? error.retryAfter : 60;
        setIsRateLimited(true);
        setRateLimitSeconds(seconds);
        addLog(`Rate limit hit. Pausing queue for ${seconds} seconds.`);
      }
    } else if (error instanceof Error && error.message.includes('429')) { // Fallback for other 429s
      if (!isRateLimited) { 
        setIsRateLimited(true);
        setRateLimitSeconds(60);
        addLog('Rate limit hit. Pausing queue for 60 seconds.');
      }
    } else {
      // For any other API error, we don't set a global rate limit, but allow backoff
      addLog(`API Error: ${error instanceof Error ? error.message : String(error)}. Retrying with delay.`);
    }
  }, [isRateLimited, addLog]);

  // New helper function: processes details for a single anime ID
  const processSingleAnimeDetails = useCallback(async (animeId: number): Promise<boolean> => {
    const animeInState = animeList.find(a => a.id === animeId);
    const title = animeInState?.title || `Anime ID ${animeId}`;

    setFetchProgress(prev => ({
      ...prev,
      fetchingTitle: title,
    }));
    addLog(`Fetching details for "${title}"...`);

    // Check if details already exist and are sufficiently complete
    if (animeInState && animeInState.description && animeInState.mediaStatus !== undefined) { 
        addLog(`ℹ️ Details already exist for "${title}". Skipping.`);
        return true; // Indicate success (skipped)
    }

    try {
      const details = await fetchAnimeDetails(animeId);
      if (details) {
        handleUpdateAnimeDetails(animeId, details);
        addLog(`✅ Success: Fetched details for "${details.title || title}".`);
        return true;
      } else {
        // AniList returns null for 404, indicating no details found by MAL ID
        setUnresolvedAnimeIds(prev => {
            // FIX: Explicitly type Set to Set<number> to prevent type inference issues.
            const newSet = new Set<number>(prev);
            newSet.add(animeId);
            saveUnresolvedIdsToCache(newSet);
            return newSet;
        });
        addLog(`🟡 Resolution needed: No AniList entry found for "${title}" (MAL ID: ${animeId}).`);
        return true; // Mark as "processed" for the queue's sake, but move to unresolved.
      }
    } catch (error) {
      console.error(`Background fetch failed for anime ID ${animeId}:`, error);
      handleApiError(error); // This will set isRateLimited for 429s, or just log for others.
      return false; // Indicate failure
    }
  }, [animeList, handleUpdateAnimeDetails, handleApiError, addLog, setFetchProgress]);
  
  // Effect for initial queue population
  useEffect(() => {
    if (isLoading) return;
    
    if (!hasPopulatedInitialQueue.current) {
      const allItemsWithoutDetails = animeList
        .filter(a => !a.description || a.mediaStatus === undefined) // Include items without mediaStatus to ensure full detail fetch
        .map(a => a.id);
      
      if (allItemsWithoutDetails.length > 0) {
        fetchQueueRef.current = allItemsWithoutDetails;
        addLog(`Initial queue populated with ${allItemsWithoutDetails.length} items.`)
      }
      hasPopulatedInitialQueue.current = true;
    }
  }, [animeList, isLoading, addLog]);


  // Effect for controlling queue processing based on state (orchestrator)
  useEffect(() => {
    // Clear any existing timeout to avoid multiple concurrent timers
    if (queueTimeoutRef.current) {
        clearTimeout(queueTimeoutRef.current);
        queueTimeoutRef.current = null;
    }

    // --- Hard Stops / Pauses ---
    if (isRateLimited) {
        if (fetchProgress.inProgress) { // If overall queue was running, mark it as paused
            setFetchProgress(prev => ({ ...prev, inProgress: false }));
        }
        isProcessingQueueRef.current = false; // Ensure explicit reset
        // If we hit a rate limit, we pause and wait for the countdown
        addLog(`Queue processing paused due to rate limit. Resuming in ${rateLimitSeconds} seconds.`);
        return; 
    }

    if (fetchQueueRef.current.length === 0) {
        if (fetchProgress.inProgress) { // If overall queue was running, it's now complete
            setFetchProgress({ total: 0, current: 0, fetchingTitle: '', inProgress: false });
            addLog("Fetch queue is empty, processing finished.");
        }
        isProcessingQueueRef.current = false; // Ensure explicit reset
        if (retryDelay !== 2000) { // Reset delay if queue becomes empty
          setRetryDelay(2000);
        }
        return;
    }

    if (isProcessingQueueRef.current) { // An item is currently being processed, wait for it to finish.
        return;
    }

    // If we reach here, there are items in the queue, we're not rate-limited, and no item is being processed.
    // So, schedule the next item with current retryDelay.

    // Ensure overall progress is marked as inProgress if this is the start of a batch
    if (!fetchProgress.inProgress) {
        setFetchProgress({
            total: fetchQueueRef.current.length, // Initial total
            current: 0,
            fetchingTitle: '',
            inProgress: true,
        });
        addLog(`Starting background fetch for ${fetchQueueRef.current.length} item(s).`);
    } else if (retryDelay > 2000) {
        addLog(`Rescheduling next queue item with increased delay (${retryDelay / 1000} seconds).`);
    } else {
        addLog("Scheduling next queue item processing (delaying 2 seconds)...");
    }

    queueTimeoutRef.current = window.setTimeout(async () => {
        // Re-check critical conditions before execution to handle race conditions
        if (!isRateLimited && fetchQueueRef.current.length > 0 && !isProcessingQueueRef.current) {
            isProcessingQueueRef.current = true; // Mark that a single item is now being processed
            const animeIdToProcess = fetchQueueRef.current.shift()!; // Get the next item
            
            let success = false;
            try {
                success = await processSingleAnimeDetails(animeIdToProcess);
            } catch (e) {
                console.error("Uncaught error during processSingleAnimeDetails:", e);
                // This case should ideally be handled within processSingleAnimeDetails catch block.
                // If it happens, we treat it as a generic failure.
            } finally {
                isProcessingQueueRef.current = false; // The single item processing is complete (success or failure)

                if (!success && !isRateLimited) { // Failed due to generic error (not rate-limit)
                    fetchQueueRef.current.unshift(animeIdToProcess); // Put it back at the front
                    let newDelay;
                    if (retryDelay === 2000) { // First failure in a sequence
                        newDelay = 30000; // Pause for 30 seconds
                    } else { // Subsequent failures
                        newDelay = 10000; // Pause for 10 seconds
                    }
                    setRetryDelay(newDelay);
                    setIsNetworkError(true);
                    setNetworkErrorCountdown({ current: newDelay / 1000, initial: newDelay / 1000 });
                    addLog(`Re-queued "${animeList.find(a => a.id === animeIdToProcess)?.title || `ID ${animeIdToProcess}`}" due to error. Increasing retry delay to ${newDelay / 1000} seconds.`);
                } else { // Successfully processed/skipped OR hit a rate limit
                    setIsNetworkError(false); // Reset on success or if rate-limited
                    if (retryDelay !== 2000) { // Reset delay if it was increased
                        setRetryDelay(2000);
                        if (!isRateLimited) addLog("Successful fetch. Resetting fetch delay.");
                    }
                    if (success) { 
                        setFetchProgress(prev => ({ ...prev, current: prev.current + 1 }));
                    }
                    // If it was a rate-limit error, success is false, isRateLimited is true.
                    // The useEffect will then re-evaluate due to `isRateLimited` change and pause.
                }
            }
        } else {
            addLog("Skipping scheduled processing due to changed conditions after delay.");
        }
        queueTimeoutRef.current = null; // Clear the timeout reference when execution is done
    }, retryDelay); 
    
    // Cleanup function for the effect
    return () => {
        if (queueTimeoutRef.current) {
            clearTimeout(queueTimeoutRef.current);
            queueTimeoutRef.current = null;
        }
    };
  }, [isRateLimited, fetchQueueRef.current.length, isProcessingQueueRef.current, processSingleAnimeDetails, addLog, setFetchProgress, fetchProgress.inProgress, fetchProgress.current, fetchProgress.total, animeList, retryDelay, rateLimitSeconds]);

  const handleImportList = (importedList: Anime[]) => {
    const currentCachedDetails = loadDetailsCache() || {};
    const mergedList = importedList.map(anime => ({
      ...anime,
      ...(currentCachedDetails[anime.id] || {})
    }));
    
    setAnimeList(mergedList);
    saveAnimeListToCache(mergedList);
    setCurrentView('my-list');
    hasPopulatedInitialQueue.current = false;
    fetchQueueRef.current = [];
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }
    isProcessingQueueRef.current = false;
    // Reset rate limit related flags on import to avoid blocking new data
    setIsRateLimited(false);
    setRateLimitSeconds(0);
    setRetryDelay(2000); // Reset retry delay
    setIsNetworkError(false); // Reset network error state
    setUnresolvedAnimeIds(new Set<number>()); // New: Clear unresolved list on new import
    saveUnresolvedIdsToCache(new Set<number>()); // New: Clear cache for unresolved
    setIsDeleteAllPromptOpen(false); // Ensure delete modals are closed
    setIsConfirmDeleteAllOpen(false); // Ensure delete modals are closed
    addLog("List imported. Fetch queue and unresolved list reset. Rate limit cleared.");
  };
  
  // New function to collect all app data for JSON export
  const collectAllAppData = useCallback(() => {
    const allData = {
      animeList: loadAnimeListFromCache(),
      detailsCache: loadDetailsCache(),
      rssFeeds: loadRssFeedsFromCache(),
      bookmarkedItems: bookmarkedItems, // Direct state
      timeSettings: loadTimeSettingsFromCache(),
      customBackground: loadCustomBackgroundSettings(),
      liveEffectSettings: loadLiveEffectSettings(), // New: include live effect settings
      unresolvedAnimeIds: Array.from(unresolvedAnimeIds), // New: include unresolved IDs
      userProfile: userProfile, // Direct state
      // You can add more localStorage items if they are managed outside state directly
      localStorageRaw: {
        [ANIME_LIST_KEY]: localStorage.getItem(ANIME_LIST_KEY),
        [ANIME_DETAILS_CACHE_KEY]: localStorage.getItem(ANIME_DETAILS_CACHE_KEY),
        [RSS_FEEDS_KEY]: localStorage.getItem(RSS_FEEDS_KEY),
        [TIME_SETTINGS_KEY]: localStorage.getItem(TIME_SETTINGS_KEY),
        [CUSTOM_BACKGROUND_KEY]: localStorage.getItem(CUSTOM_BACKGROUND_KEY),
        [LIVE_EFFECT_KEY]: localStorage.getItem(LIVE_EFFECT_KEY), // New: include live effect key
        [UNRESOLVED_ANIME_IDS_KEY]: localStorage.getItem(UNRESOLVED_ANIME_IDS_KEY), // New: include unresolved IDs key
        // FIX: Corrected typo from BOOK_MARKED_ITEMS_KEY to BOOKMARKED_ITEMS_KEY
        [BOOKMARKED_ITEMS_KEY]: localStorage.getItem(BOOKMARKED_ITEMS_KEY),
      }
    };
    return JSON.stringify(allData, null, 2); // Pretty print JSON
  }, [bookmarkedItems, userProfile, unresolvedAnimeIds]);


  // Refactored handleExportList to support different export types
  const handleExportList = useCallback((exportType: ExportDataType) => {
    if (animeList.length === 0 && exportType === ExportDataType.AnimeListXML) {
      console.warn("Cannot export empty anime list.");
      return { success: false, message: 'No anime in list to export.' };
    }
    
    try {
      if (exportType === ExportDataType.AnimeListXML) {
        const xmlString = generateMalXml(animeList, userProfile.username);
        downloadFile('hermes_myanimelist_export.xml', xmlString, 'text/xml');
        addLog('Anime list exported successfully.');
        return { success: true, message: 'Anime list exported successfully!' };
      } else if (exportType === ExportDataType.AllAppDataJSON) {
        const jsonString = collectAllAppData();
        downloadFile('hermes_all_data_export.json', jsonString, 'application/json');
        addLog('All application data exported successfully.');
        return { success: true, message: 'All application data exported successfully!' };
      }
      return { success: false, message: 'Unsupported export type.' };
    } catch (error) {
      console.error(`Failed to export data (${exportType}):`, error);
      return { success: false, message: `Failed to export data: ${error instanceof Error ? error.message : String(error)}` };
    }
  }, [animeList, userProfile.username, collectAllAppData, addLog]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleViewDetails = useCallback((anime: Anime) => {
    const animeFromList = animeList.find(a => a.id === anime.id);
    setSelectedAnime(animeFromList || anime);
  }, [animeList]);
  
  const handleUpdateAnime = useCallback((animeId: number, updates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => {
    const anime = animeList.find(a => a.id === animeId);
    if (!anime) return;

    const performActualUpdate = (resolvedUpdates: Partial<Pick<Anime, 'episodesWatched' | 'status' | 'score'>>) => {
        let updatedAnimeGlobal: Anime | undefined;
        setAnimeList(prevList => {
            const newList = prevList.map(item => {
                if (item.id === animeId) {
                    const updatedAnime: Anime = { ...item, ...resolvedUpdates };
                    
                    if (resolvedUpdates.episodesWatched !== undefined) {
                        const maxEpisodes = item.totalEpisodes > 0 ? item.totalEpisodes : Infinity;
                        updatedAnime.episodesWatched = Math.max(0, Math.min(resolvedUpdates.episodesWatched, maxEpisodes));
                    }

                    if (resolvedUpdates.status === undefined && resolvedUpdates.episodesWatched !== undefined) {
                         if (item.status === WatchStatus.Completed && (item.totalEpisodes === 0 || updatedAnime.episodesWatched < item.totalEpisodes)) {
                            updatedAnime.status = WatchStatus.Watching;
                        }
                    }

                    updatedAnimeGlobal = updatedAnime;
                    return updatedAnime;
                }
                return item;
            });
            saveAnimeListToCache(newList);
            return newList;
        });
        setSelectedAnime(prev => prev && prev.id === animeId && updatedAnimeGlobal ? { ...prev, ...updatedAnimeGlobal } : prev);
        setAnimeToEdit(prev => prev && prev.id === animeId && updatedAnimeGlobal ? { ...prev, ...updatedAnimeGlobal } : prev); // Keep edit modal updated
    };

    if (updates.status) {
        performActualUpdate(updates);
        setConfirmationRequest(null);
        return;
    }
    
    if (updates.episodesWatched !== undefined) {
        if (anime.totalEpisodes > 0 && updates.episodesWatched === anime.totalEpisodes && anime.status !== WatchStatus.Completed) {
            performActualUpdate(updates);
            setCompletionRequest(anime);
            return;
        }

        if (anime.status !== WatchStatus.Watching && updates.episodesWatched > anime.episodesWatched) {
            const handleConfirm = () => {
                performActualUpdate({ ...updates, status: WatchStatus.Watching });
            };

            setConfirmationRequest({
                anime,
                onConfirm: handleConfirm,
            });
            return;
        }
    }

    performActualUpdate(updates);
  }, [animeList]);
  
  const handleConfirmCompletion = (animeId: number) => {
    handleUpdateAnime(animeId, { status: WatchStatus.Completed });
    setCompletionRequest(null);
  };
  
  const handleDetailsModalClose = () => {
    setSelectedAnime(null);
  };
  
  const handleDeleteAnime = useCallback((animeId: number) => {
    setAnimeList(prevList => {
        const newList = prevList.filter(a => a.id !== animeId);
        saveAnimeListToCache(newList);
        return newList;
    });
    setUnresolvedAnimeIds(prev => { // Also remove from unresolved if it's there
        if (prev.has(animeId)) {
            // FIX: Explicitly type Set to Set<number> to prevent type inference issues.
            const newSet = new Set<number>(prev);
            newSet.delete(animeId);
            saveUnresolvedIdsToCache(newSet);
            return newSet;
        }
        return prev;
    });
    if (selectedAnime?.id === animeId) {
        handleDetailsModalClose();
    }
    if (animeToEdit?.id === animeId) { // Close edit modal if deleted
      setIsEditModalOpen(false);
      setAnimeToEdit(null);
    }
    setDeleteRequest(null);
  }, [selectedAnime?.id, animeToEdit?.id]);
  
  const requestDeleteAnime = useCallback((anime: Anime) => {
    setDeleteRequest(anime);
  }, []);
  
  const handleAddAnimeToList = useCallback((animeToAdd: Anime) => {
    if (animeList.some(a => a.id === animeToAdd.id)) {
      console.warn(`Anime "${animeToAdd.title}" is already in the list.`);
      return;
    }

    const newList = [animeToAdd, ...animeList];
    setAnimeList(newList);
    saveAnimeListToCache(newList);

    if (selectedAnime && selectedAnime.id === animeToAdd.id) {
      setSelectedAnime(animeToAdd);
    }
  }, [animeList, selectedAnime]);


  const handleToggleBookmark = useCallback((itemToToggle: BookmarkedItem) => {
    setBookmarkedItems(prev => {
      const isBookmarked = prev.some(item => {
        if (item.type === 'article' && itemToToggle.type === 'article') {
          return item.link === itemToToggle.link;
        }
        if (item.type === 'image' && itemToToggle.type === 'image') {
          return item.id === itemToToggle.id;
        }
        return false;
      });
      
      if (isBookmarked) {
        return prev.filter(item => {
          if (item.type === 'article' && itemToToggle.type === 'article') {
            return item.link !== itemToToggle.link;
          }
          if (item.type === 'image' && itemToToggle.type === 'image') {
            return item.id !== itemToToggle.id;
          }
          return true;
        });
      } else {
        return [...prev, itemToToggle];
      }
    });
  }, []);
  
  const handleViewArticle = (article: RssArticle) => setSelectedArticle(article);

  const handleProfileUpdate = (newProfile: { username?: string; profilePic?: string }) => setUserProfile(prev => ({ ...prev, ...newProfile }));

  const handleRefresh = () => {
    addLog("Manual refresh triggered. Checking for missing data...");
    
    const allItemsWithoutDetails = animeList
      .filter(a => !a.description || a.mediaStatus === undefined) // Include items without mediaStatus
      .map(a => a.id);
    
    const currentQueueSet = new Set(fetchQueueRef.current);
    const newItems = allItemsWithoutDetails.filter(id => !currentQueueSet.has(id));

    if (newItems.length > 0) {
      fetchQueueRef.current = [...newItems, ...fetchQueueRef.current]; // Add new items to front for priority
      addLog(`Added ${newItems.length} new item(s) to the fetch queue. Total: ${fetchQueueRef.current.length}.`);
    } else {
      addLog("No new items to fetch.");
    }
    
    // Explicitly clear processing state and rate limit flags.
    isProcessingQueueRef.current = false; 
    setIsRateLimited(false); 
    setRateLimitSeconds(0);
    setRetryDelay(2000); // Reset retry delay to default
    setIsNetworkError(false); // Reset network error state

    // Trigger a re-evaluation of the queue processing useEffect.
    // The fetchQueueRef.current.length change already triggers it implicitly,
    // but setting refreshKey can be useful for other components.
    setRefreshKey(prev => prev + 1); 
    addLog("Fetch queue state reset. Processing will resume if items are available.");
  };

  const handleAddRssFeed = (url: string) => {
    if (rssFeeds.includes(url)) return;
    const newFeeds = [...rssFeeds, url];
    setRssFeeds(newFeeds);
    saveRssFeedsToCache(newFeeds);
  };

  const handleRemoveRssFeed = (url: string) => {
    const newFeeds = rssFeeds.filter(feed => feed !== url);
    setRssFeeds(newFeeds);
    saveRssFeedsToCache(newFeeds);
  };

  const handleEditRssFeed = (oldUrl: string, newUrl: string) => {
    if (rssFeeds.includes(newUrl) && oldUrl !== newUrl) return; // prevent duplicates
    const newFeeds = rssFeeds.map(feed => (feed === oldUrl ? newUrl : feed));
    setRssFeeds(newFeeds);
    saveRssFeedsToCache(newFeeds);
  };

  const handleResetRssFeeds = useCallback(() => {
    setRssFeeds(PREDEFINED_FEEDS);
    saveRssFeedsToCache(PREDEFINED_FEEDS);
  }, []);
  
  const handleTimeSettingsChange = (newSettings: TimeSettings) => {
    setTimeSettings(newSettings);
    saveTimeSettingsToCache(newSettings);
  };

  const handleApplyPreset = useCallback((presetId: string) => {
    const allPresets = [...PREDEFINED_PRESETS, ...appearancePresets];
    const preset = allPresets.find(p => p.id === presetId);
    if (preset) {
        setCustomBackground(preset.background);
        setLiveEffectSettings(preset.effects);
        setActivePresetId(presetId);
        saveActivePresetIdToCache(presetId);
        setAppearanceHistory([]);
    }
  }, [appearancePresets]);

  const handleCustomBackgroundChange = useCallback((newSettings: CustomBackgroundSettings) => {
    setAppearanceHistory(prev => [...prev.slice(-19), { background: customBackground, effects: liveEffectSettings }]);
    setCustomBackground(newSettings);
    saveCustomBackgroundSettings(newSettings);
    setActivePresetId(null); // Mark as custom/unsaved
    saveActivePresetIdToCache(null);
  }, [customBackground, liveEffectSettings]);

  const handleLiveEffectChange = useCallback((newSettings: LiveEffectSettings) => {
    setAppearanceHistory(prev => [...prev.slice(-19), { background: customBackground, effects: liveEffectSettings }]);
    setLiveEffectSettings(newSettings);
    saveLiveEffectSettings(newSettings);
    setActivePresetId(null); // Mark as custom/unsaved
    saveActivePresetIdToCache(null);
  }, [customBackground, liveEffectSettings]);

  const handleUndoAppearanceChange = useCallback(() => {
    if (appearanceHistory.length === 0) return;

    const lastState = appearanceHistory[appearanceHistory.length - 1];
    const newHistory = appearanceHistory.slice(0, -1);
    
    setAppearanceHistory(newHistory);

    setCustomBackground(lastState.background);
    saveCustomBackgroundSettings(lastState.background);

    setLiveEffectSettings(lastState.effects);
    saveLiveEffectSettings(lastState.effects);

    setActivePresetId(null);
    saveActivePresetIdToCache(null);
  }, [appearanceHistory]);


  const handleSaveNewPreset = useCallback((name: string) => {
    const newPreset: AppearancePreset = {
      id: `preset-${Date.now()}`,
      name,
      background: {
        ...customBackground,
        accentColor: customBackground.accentColor || '#58A6FF',
        componentColor: customBackground.componentColor || '#161B22',
        overlayColor: customBackground.overlayColor || '#0D1117',
        primaryTextColor: customBackground.primaryTextColor || '#C9D1D9',
        secondaryTextColor: customBackground.secondaryTextColor || '#8B949E',
      },
      effects: liveEffectSettings,
    };
    const newPresets = [...appearancePresets, newPreset];
    setAppearancePresets(newPresets);
    saveAppearancePresetsToCache(newPresets);
    handleApplyPreset(newPreset.id); // Apply the newly saved preset
  }, [customBackground, liveEffectSettings, appearancePresets, handleApplyPreset]);
  
  const handleUpdatePreset = useCallback((presetId: string, updates: Partial<Pick<AppearancePreset, 'name' | 'background' | 'effects'>>) => {
    const newPresets = appearancePresets.map(p => {
        if (p.id === presetId) {
            const newPreset = { ...p, ...updates };
            if (updates.background) {
                newPreset.background = {
                    ...p.background,
                    ...updates.background,
                    accentColor: updates.background.accentColor || '#58A6FF',
                    componentColor: updates.background.componentColor || '#161B22',
                    overlayColor: updates.background.overlayColor || '#0D1117',
                    primaryTextColor: updates.background.primaryTextColor || '#C9D1D9',
                    secondaryTextColor: updates.background.secondaryTextColor || '#8B949E',
                }
            }
            return newPreset;
        }
        return p;
    });
    setAppearancePresets(newPresets);
    saveAppearancePresetsToCache(newPresets);
  }, [appearancePresets]);

  const handleDeletePreset = useCallback((presetId: string) => {
    const newPresets = appearancePresets.filter(p => p.id !== presetId);
    setAppearancePresets(newPresets);
    saveAppearancePresetsToCache(newPresets);
    if (presetId === activePresetId) {
        setActivePresetId(null); // Current settings become "custom"
        saveActivePresetIdToCache(null);
    }
  }, [activePresetId, appearancePresets]);

  // New handler for centralized Save Preset modal
  const handleSavePresetModalConfirm = useCallback((name: string) => {
    if (!presetModalState) return;
    switch (presetModalState.mode) {
      case 'new':
        handleSaveNewPreset(name); // Saves CURRENT settings.
        break;
      case 'rename':
        if (presetModalState.presetId) handleUpdatePreset(presetModalState.presetId, { name });
        break;
      case 'duplicate':
        if (presetModalState.presetId) {
          const presetToDuplicate = [...PREDEFINED_PRESETS, ...appearancePresets].find(p => p.id === presetModalState.presetId);
          if (presetToDuplicate) {
            // Create a new preset with a new ID/name but the OLD settings
            const newPreset: AppearancePreset = {
              id: `preset-${Date.now()}`,
              name,
              background: presetToDuplicate.background,
              effects: presetToDuplicate.effects,
            };
            const newPresets = [...appearancePresets, newPreset];
            setAppearancePresets(newPresets);
            saveAppearancePresetsToCache(newPresets);
            handleApplyPreset(newPreset.id); // Apply the newly duplicated preset
          }
        }
        break;
    }
    setPresetModalState(null);
  }, [presetModalState, handleSaveNewPreset, handleUpdatePreset, appearancePresets, handleApplyPreset]);

  // New handler for centralized Confirmation modals for presets
  const handlePresetConfirm = useCallback(() => {
    if (!presetConfirmState) return;
    if (presetConfirmState.mode === 'overwrite') {
        handleUpdatePreset(presetConfirmState.presetId, { background: customBackground, effects: liveEffectSettings });
        setAppearanceHistory([]);
    } else if (presetConfirmState.mode === 'delete') {
        handleDeletePreset(presetConfirmState.presetId);
        setAppearanceHistory([]);
    }
    setPresetConfirmState(null);
  }, [presetConfirmState, handleUpdatePreset, handleDeletePreset, customBackground, liveEffectSettings]);

  const getPresetModalTitle = () => {
    if (!presetModalState) return '';
    switch (presetModalState.mode) {
        case 'new': return 'Save New Preset';
        case 'rename': return 'Rename Preset';
        case 'duplicate': return 'Duplicate Preset';
    }
  };


  const handleViewListByStatus = useCallback((status: WatchStatus) => {
    setSelectedStatusForListModal(status);
    setIsStatusListModalOpen(true);
  }, []);
  
  const handleLogViewToggle = () => setIsLogModalOpen(prev => !prev);
  
  const handleStopFetching = useCallback(() => {
    addLog("Stop request received. Clearing queue and halting process.");
    fetchQueueRef.current = [];
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }
    isProcessingQueueRef.current = false;
    setFetchProgress({ total: 0, current: 0, fetchingTitle: '', inProgress: false });
    setIsRateLimited(false); // Clear rate limit flag as well
    setRateLimitSeconds(0);
    setRetryDelay(2000); // Reset retry delay
    setIsNetworkError(false);
  }, [addLog]);

  // Handlers for centralized Edit/Add modals
  const handleOpenEditModal = useCallback((anime: Anime) => {
    setAnimeToEdit(anime);
    setIsEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setAnimeToEdit(null);
  }, []);

  const handleOpenAddModal = useCallback((anime: Anime) => {
    setAnimeToAddToList(anime);
    setIsAddModalOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setAnimeToAddToList(null);
  }, []);

  // Dashboard customization handlers
  const handleUpdateDashboardLayout = useCallback((newLayout: DashboardLayout) => {
    if (!dashboardSettings) return;
    
    setDashboardSettings(prev => {
      if (!prev) return null;
      const newLayouts = prev.layouts.map(l => l.id === newLayout.id ? newLayout : l);
      return { ...prev, layouts: newLayouts };
    });
  }, [dashboardSettings]);

  const handleSetActiveLayout = useCallback((layoutId: string) => {
     if (!dashboardSettings) return;
     setDashboardSettings(prev => prev ? ({ ...prev, activeLayoutId: layoutId }) : null);
  }, [dashboardSettings]);


  // DELETE ALL DATA LOGIC
  const handlePerformDeleteAllData = useCallback(() => {
    // Clear all localStorage keys
    localStorage.removeItem(ANIME_LIST_KEY);
    localStorage.removeItem(ANIME_DETAILS_CACHE_KEY);
    localStorage.removeItem(RSS_FEEDS_KEY);
    // FIX: Corrected typo from BOOK_MARKED_ITEMS_KEY to BOOKMARKED_ITEMS_KEY
    localStorage.removeItem(BOOKMARKED_ITEMS_KEY);
    localStorage.removeItem(TIME_SETTINGS_KEY);
    localStorage.removeItem(CUSTOM_BACKGROUND_KEY);
    localStorage.removeItem(LIVE_EFFECT_KEY); // New: Clear live effect settings
    localStorage.removeItem(UNRESOLVED_ANIME_IDS_KEY); // New: Clear unresolved IDs
    localStorage.removeItem(APPEARANCE_PRESETS_KEY);
    localStorage.removeItem(ACTIVE_PRESET_ID_KEY);
    localStorage.removeItem(MAL_CLIENT_ID_KEY);
    clearMalTokens();

    // Reset all major states to initial values
    setAnimeList([]);
    setDetailsCache({});
    setBookmarkedItems([]); // Clear bookmarked items
    setRssFeeds([]); // Reset to empty feeds
    setUnresolvedAnimeIds(new Set<number>()); // New: Reset unresolved IDs state
    setAppearancePresets([]);
    setActivePresetId(null);
    setAppearanceHistory([]);
    setMalClientId(null);
    setMalAuthData(null);
    setIsLoading(false); // Assume not loading after reset
    setIsSidebarCollapsed(false);
    setSelectedAnime(null);
    setSelectedArticle(null);
    setRefreshKey(0);
    setUserProfile({ username: 'User', profilePic: 'https://picsum.photos/40/40?grayscale' });
    setConfirmationRequest(null);
    setCompletionRequest(null);
    setDeleteRequest(null);
    setIsRateLimited(false);
    setRateLimitSeconds(0);
    setIsFetchingProfileData(false);
    setTimeSettings({ // Reset to default time settings
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      format: '12h',
      showSeconds: false,
      colonAnimation: 'blink',
      showDate: true,
      dateFormat: 'month-day',
      showYear: false,
      numericDateStyle: 'md',
    });
    setIsStatusListModalOpen(false);
    setSelectedStatusForListModal(null);
    setCustomBackground({ // Reset to default background settings
      imageUrl: null,
      opacity: 1,
      blur: 8,
      brightness: 1,
      contrast: 1,
      grayscale: false,
      positionX: 50,
      positionY: 50,
      zoom: 100,
      tileOpacity: 0.9,
      backgroundOverlayOpacity: 0.85,
      accentColor: null,
      componentColor: null,
      overlayColor: null,
      primaryTextColor: null,
      secondaryTextColor: null,
    });
    setLiveEffectSettings({ // New: Reset live effect settings
      type: LiveEffectType.None,
      count: 50,
      size: 15,
      speed: 1,
      windIntensity: 0.2,
      color: '#F0F8FF',
    });
    setIsEditModalOpen(false);
    setAnimeToEdit(null);
    setIsAddModalOpen(false);
    setAnimeToAddToList(null);

    // Reset fetching related states
    fetchQueueRef.current = [];
    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }
    isProcessingQueueRef.current = false;
    hasPopulatedInitialQueue.current = false;
    setFetchProgress({ total: 0, current: 0, fetchingTitle: '', inProgress: false });
    setFetchLogs([]);
    setIsLogModalOpen(false);
    setRetryDelay(2000);
    setIsNetworkError(false);

    // Close deletion modals and navigate home
    setIsDeleteAllPromptOpen(false);
    setIsConfirmDeleteAllOpen(false);
    setCurrentView('home');
    addLog("All application data has been permanently deleted.");
    console.log("All application data has been permanently deleted.");
  }, [addLog]);

  const handleDeleteAllData = useCallback((shouldExport: boolean) => {
    setIsDeleteAllPromptOpen(false); // Close the first prompt
    
    // If user chose to export, do it now
    if (shouldExport) {
      // Use the new ExportDataType for exporting all data
      const exportResult = handleExportList(ExportDataType.AllAppDataJSON);
      if (!exportResult.success) {
        addLog(`Export failed before deletion: ${exportResult.message}`);
      } else {
        addLog(`Export successful.`);
      }
    }

    // Open the final confirmation modal
    setIsConfirmDeleteAllOpen(true);
  }, [handleExportList, addLog]);

  // New handler for resolving anime matches
  const handleResolveMatch = useCallback((originalMalId: number, matchedAnime: Anime) => {
    const originalAnime = animeList.find(a => a.id === originalMalId);
    if (!originalAnime) return;

    // Create a new merged anime object
    // It keeps the user's progress but takes all metadata from the matched result
    const mergedAnime: Anime = {
        ...matchedAnime, // All details from the match
        id: matchedAnime.id, // Use the new MAL ID from the match
        episodesWatched: originalAnime.episodesWatched,
        score: originalAnime.score,
        status: originalAnime.status,
        season: originalAnime.season, // Preserve original season if it existed
    };
    
    // Remove the old entry and add the new one
    const newList = animeList.filter(a => a.id !== originalMalId);
    newList.unshift(mergedAnime); // Add to top for visibility
    
    // Update anime list and details cache
    setAnimeList(newList);
    saveAnimeListToCache(newList);
    handleUpdateAnimeDetails(mergedAnime.id, matchedAnime); // This updates details cache

    addLog(`✅ Resolved: Matched "${originalAnime.title}" to "${mergedAnime.title}" (MAL ID: ${mergedAnime.id}).`);

  }, [animeList, handleUpdateAnimeDetails, addLog]);

  const handleDisconnectMal = useCallback(() => {
    clearMalTokens();
    setMalAuthData(null);
  }, []);
  
  const handleRecheckMalStatus = useCallback(async () => {
      const cachedTokens = loadMalTokens();
      if (cachedTokens) {
          try {
              // TODO: Add token refresh logic here in the future
              const user = await getUserInfo(cachedTokens.access_token);
              setMalAuthData({ tokens: cachedTokens, user });
          } catch (error) {
              console.error("Failed to validate existing MAL session on recheck:", error);
              clearMalTokens(); // Clear invalid tokens
              setMalAuthData(null);
          }
      } else {
          // No tokens found, ensure state is disconnected
          setMalAuthData(null);
      }
  }, []);

  const handleSetMalClientId = useCallback((id: string) => {
    const trimmedId = id.trim();
    setMalClientId(trimmedId);
    saveMalClientId(trimmedId);
  }, []);

  const handleClearDetailsCache = useCallback(() => {
    addLog("Clearing details cache and unresolved IDs...");
    
    localStorage.removeItem(ANIME_DETAILS_CACHE_KEY);
    localStorage.removeItem(UNRESOLVED_ANIME_IDS_KEY);
    
    setDetailsCache({});
    saveDetailsCache({});
    setUnresolvedAnimeIds(new Set());
    saveUnresolvedIdsToCache(new Set());
    
    const strippedList = animeList.map(anime => {
      const { id, title, posterUrl, score, episodesWatched, totalEpisodes, status, genres, season } = anime;
      return { id, title, posterUrl, score, episodesWatched, totalEpisodes, status, genres, season };
    });
    
    setAnimeList(strippedList);
    saveAnimeListToCache(strippedList);

    const allAnimeIds = strippedList.map(a => a.id);
    fetchQueueRef.current = allAnimeIds;
    addLog(`Details cache cleared. Re-populating fetch queue with ${allAnimeIds.length} items.`);

    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }
    isProcessingQueueRef.current = false;
    setFetchProgress({ total: 0, current: 0, fetchingTitle: '', inProgress: false });
    setIsRateLimited(false); 
    setRateLimitSeconds(0);
    setRetryDelay(2000); 
    setIsNetworkError(false);

    setRefreshKey(prev => prev + 1); 
  }, [addLog, animeList]);
  
  const handleNavigateToMyListWithPulse = useCallback(() => {
    setCurrentView('my-list');
    setTriggerSearchPulse(true);
  }, []);

  const handleNavigateToSettingsWithPulse = useCallback(() => {
    setCurrentView('settings');
    setTriggerImportPulse(true);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeView 
                  username={userProfile.username} 
                  animeList={animeList} 
                  isLoading={isLoading} 
                  onUpdateAnime={handleUpdateAnime} 
                  onViewDetails={handleViewDetails} 
                  onDelete={requestDeleteAnime} 
                  timeSettings={timeSettings} 
                  onViewListByStatus={handleViewListByStatus} 
                  onOpenEditModal={handleOpenEditModal} 
                  customBackground={customBackground} 
                  isLayoutLocked={isLayoutLocked}
                  onToggleLock={() => setIsLayoutLocked(prev => !prev)}
                  dashboardSettings={dashboardSettings}
                  onUpdateLayout={handleUpdateDashboardLayout}
                  onSetActiveLayout={handleSetActiveLayout}
                  onNavigateToMyListWithPulse={handleNavigateToMyListWithPulse}
                  onNavigateToSettingsWithPulse={handleNavigateToSettingsWithPulse}
                />;
      case 'my-list':
        return <AnimeListView 
                  animeList={animeList} 
                  isLoading={isLoading} 
                  onViewDetails={handleViewDetails} 
                  onUpdateAnime={handleUpdateAnime} 
                  onDelete={requestDeleteAnime} 
                  onAddToList={handleAddAnimeToList} 
                  onApiError={handleApiError} 
                  isRateLimited={isRateLimited} 
                  onOpenEditModal={handleOpenEditModal} 
                  onOpenAddModal={handleOpenAddModal} 
                  unresolvedAnimeIds={unresolvedAnimeIds} 
                  onResolveMatch={handleResolveMatch} 
                  customBackground={customBackground} 
                  username={userProfile.username}
                  triggerSearchPulse={triggerSearchPulse}
                  onSearchPulseConsumed={() => setTriggerSearchPulse(false)}
                />;
      case 'discover':
        return <DiscoverView 
                  bookmarkedItems={bookmarkedItems} 
                  onToggleBookmark={handleToggleBookmark} 
                  onViewArticle={handleViewArticle} 
                  refreshKey={refreshKey} 
                  rssFeeds={rssFeeds}
                  onOpenManageFeedsModal={() => setIsManageFeedsModalOpen(true)}
                  customBackground={customBackground}
                />;
      case 'saved':
        return <SavedView savedItems={bookmarkedItems} onToggleBookmark={handleToggleBookmark} onViewArticle={handleViewArticle} onViewImage={setImageToView} customBackground={customBackground} />;
      case 'profile':
         return <ProfileView 
                  userProfile={userProfile} 
                  animeList={animeList} 
                  onViewDetails={handleViewDetails} 
                  isFetchingProfileData={isFetchingProfileData} 
                  onViewListByStatus={handleViewListByStatus} 
                  onOpenEditProfileModal={() => setIsEditProfileModalOpen(true)} 
                  onOpenEditModal={handleOpenEditModal}
                  customBackground={customBackground}
                />;
      case 'settings':
         return <SettingsView 
                    animeList={animeList}
                    onImport={handleImportList}
                    onExport={handleExportList} // Pass the refactored handleExportList
                    timeSettings={timeSettings} 
                    onTimeSettingsChange={handleTimeSettingsChange} 
                    customBackground={customBackground}
                    onCustomBackgroundChange={handleCustomBackgroundChange}
                    liveEffectSettings={liveEffectSettings}
                    onLiveEffectChange={handleLiveEffectChange}
                    onDeleteAllData={() => setIsDeleteAllPromptOpen(true)}
                    malAuthData={malAuthData}
                    onDisconnectMal={handleDisconnectMal}
                    malClientId={malClientId}
                    onSetMalClientId={handleSetMalClientId}
                    onRecheckMalStatus={handleRecheckMalStatus}
                    onClearDetailsCache={handleClearDetailsCache}
                    appearancePresets={[...PREDEFINED_PRESETS, ...appearancePresets]}
                    activePresetId={activePresetId}
                    onApplyPreset={handleApplyPreset}
                    onSaveNewPreset={handleSaveNewPreset}
                    onUpdatePreset={handleUpdatePreset}
                    onDeletePreset={handleDeletePreset}
                    onOpenSavePresetModal={setPresetModalState}
                    onOpenConfirmPresetModal={setPresetConfirmState}
                    onUndo={handleUndoAppearanceChange}
                    canUndo={appearanceHistory.length > 0}
                    triggerImportPulse={triggerImportPulse}
                    onImportPulseConsumed={() => setTriggerImportPulse(false)}
                />;
      case 'about':
        return <AboutView customBackground={customBackground} />;
      default:
        return <HomeView 
                  username={userProfile.username} 
                  animeList={animeList.filter(a => a.status === WatchStatus.Watching)} 
                  isLoading={isLoading} 
                  onUpdateAnime={handleUpdateAnime} 
                  onViewDetails={handleViewDetails} 
                  onDelete={requestDeleteAnime} 
                  timeSettings={timeSettings} 
                  onViewListByStatus={handleViewListByStatus} 
                  onOpenEditModal={handleOpenEditModal} 
                  customBackground={customBackground}
                  isLayoutLocked={isLayoutLocked}
                  onToggleLock={() => setIsLayoutLocked(prev => !prev)}
                  dashboardSettings={dashboardSettings}
                  onUpdateLayout={handleUpdateDashboardLayout}
                  onSetActiveLayout={handleSetActiveLayout}
                  onNavigateToMyListWithPulse={handleNavigateToMyListWithPulse}
                  onNavigateToSettingsWithPulse={handleNavigateToSettingsWithPulse}
                />;
    }
  };

  const wrapperStyle: React.CSSProperties = {};
  if (customBackground.imageUrl) {
      wrapperStyle.backgroundColor = `rgb(var(--color-primary-rgb) / ${customBackground.backgroundOverlayOpacity})`;
      wrapperStyle.backdropFilter = `blur(${customBackground.blur}px)`;
      wrapperStyle.WebkitBackdropFilter = `blur(${customBackground.blur}px)`;
  }

  return (
    <div className="flex h-screen font-sans relative">
      {customBackground.imageUrl && (
        <div
          className="fixed inset-0 z-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${customBackground.imageUrl})`,
            backgroundSize: `${customBackground.zoom}%`,
            backgroundPosition: `${customBackground.positionX}% ${customBackground.positionY}%`,
            filter: `blur(${customBackground.blur}px) brightness(${customBackground.brightness}) contrast(${customBackground.contrast}) ${customBackground.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'}`,
            opacity: customBackground.opacity,
            WebkitFilter: `blur(${customBackground.blur}px) brightness(${customBackground.brightness}) contrast(${customBackground.contrast}) ${customBackground.grayscale ? 'grayscale(100%)' : 'grayscale(0%)'}`,
          }}
        >
        </div>
      )}

      {/* New: Live Effect Overlay, positioned between background and foreground content */}
      <LiveEffectOverlay settings={liveEffectSettings} />

      <div
        className={`flex flex-1 relative z-10 overflow-hidden ${customBackground.imageUrl ? '' : 'bg-primary'}`}
        style={wrapperStyle}
      >
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          userProfile={userProfile}
          onRefresh={handleRefresh}
          fetchProgress={fetchProgress}
          onLogViewToggle={handleLogViewToggle}
          onStopFetching={handleStopFetching}
          customBackground={customBackground}
          isMalConnected={!!malAuthData}
          isRateLimited={isRateLimited}
          rateLimitSeconds={rateLimitSeconds}
          isNetworkError={isNetworkError}
          networkErrorCountdown={networkErrorCountdown}
        />
        <main 
            className="flex-1 flex flex-col overflow-y-auto px-4 py-6 md:px-6 scrollbar-thin transition-all duration-300"
        >
          <div key={currentView} className="flex-grow animate-fade-in flex flex-col">
            {renderContent()}
          </div>
        </main>
      </div>
      {selectedAnime && (
        <AnimeDetailModal 
            anime={selectedAnime} 
            isOpen={!!selectedAnime} 
            onClose={handleDetailsModalClose} 
            onUpdateAnime={handleUpdateAnime} 
            onDetailsLoaded={handleUpdateAnimeDetails} 
            onViewDetails={handleViewDetails} 
            onDelete={requestDeleteAnime}
            isInList={animeList.some(a => a.id === selectedAnime.id)}
            onAddToList={handleAddAnimeToList}
            onApiError={handleApiError}
            customBackground={customBackground}
            onOpenEditModal={handleOpenEditModal}
            onOpenAddModal={handleOpenAddModal}
            bookmarkedItems={bookmarkedItems}
            onToggleBookmark={handleToggleBookmark}
        />
      )}
      {selectedArticle && (
        <ArticleDetailModal 
            isOpen={!!selectedArticle} 
            article={selectedArticle} 
            onClose={() => setSelectedArticle(null)} 
            isBookmarked={bookmarkedItems.some(a => a.type === 'article' && a.link === selectedArticle.link)} 
            onToggleBookmark={(article) => handleToggleBookmark({...article, type: 'article'})} 
            onViewImage={setImageToView}
            customBackground={customBackground}
        />
      )}
      {confirmationRequest && (
        <ConfirmationModal
            isOpen={!!confirmationRequest}
            onClose={() => setConfirmationRequest(null)}
            onConfirm={confirmationRequest.onConfirm}
            title="Start Watching?"
            message={
                <p>
                    You're about to watch an episode of{' '}
                    <strong className="text-text-primary">{confirmationRequest.anime.title}</strong>.
                    Would you like to change its status to 'Watching'?</p>
            }
            customBackground={customBackground}
        />
      )}
      {completionRequest && (
        <ConfirmationModal
            isOpen={!!completionRequest}
            onClose={() => setCompletionRequest(null)}
            onConfirm={() => handleConfirmCompletion(completionRequest.id)}
            title="Mark as Completed?"
            message={
                <p>
                    You've finished watching <strong className="text-text-primary">{completionRequest.title}</strong>.
                    Would you like to change its status to 'Completed'?</p>
            }
            customBackground={customBackground}
        />
      )}
      {deleteRequest && (
        <ConfirmationModal
            isOpen={!!deleteRequest}
            onClose={() => setDeleteRequest(null)}
            onConfirm={() => handleDeleteAnime(deleteRequest.id)}
            title="Delete from List?"
            message={
                <p>
                    Are you sure you want to delete <strong className="text-text-primary">{deleteRequest.title}</strong> from your list? All your tracking data for this entry will be permanently lost.</p>
            }
            customBackground={customBackground}
            isDestructive={true}
        />
      )}
      {isStatusListModalOpen && selectedStatusForListModal && (
        <StatusAnimeListModal
          isOpen={isStatusListModalOpen}
          onClose={() => setIsStatusListModalOpen(false)}
          animeList={animeList}
          statusFilter={selectedStatusForListModal}
          onViewDetails={handleViewDetails}
          customBackground={customBackground}
        />
      )}
      <FetchLogModal
        isOpen={isLogModalOpen}
        onClose={handleLogViewToggle}
        logs={fetchLogs}
        fetchProgress={fetchProgress}
        onStopFetching={handleStopFetching}
        customBackground={customBackground}
      />
      {/* Centralized EditProgressModal */}
      {isEditModalOpen && animeToEdit && (
        <EditProgressModal
          anime={animeToEdit}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleUpdateAnime}
          onDelete={requestDeleteAnime}
          customBackground={customBackground}
        />
      )}
      {/* Centralized AddToListModal */}
      {isAddModalOpen && animeToAddToList && (
        <AddToListModal
          anime={animeToAddToList}
          isOpen={isAddModalOpen}
          onClose={handleCloseAddModal}
          onSave={handleAddAnimeToList}
          customBackground={customBackground}
        />
      )}

      {/* Delete All Data - Step 1: Export Prompt */}
      {isDeleteAllPromptOpen && (
        <ConfirmationModal
          isOpen={isDeleteAllPromptOpen}
          onClose={() => setIsDeleteAllPromptOpen(false)}
          title="Delete All Data?"
          message={
            <p>
              Before permanently deleting all your data, would you like to export your current anime list for backup?
            </p>
          }
          confirmText="Yes, Export & Delete"
          cancelText="No, Just Delete"
          onConfirm={() => handleDeleteAllData(true)} // Export and then proceed
          onCloseWithCustomAction={() => handleDeleteAllData(false)} // Just proceed without export
          isDestructive={true} // Indicate a destructive action for styling
          customBackground={customBackground}
        />
      )}

      {/* Delete All Data - Step 2: Final Confirmation */}
      {isConfirmDeleteAllOpen && (
        <ConfirmationModal
          isOpen={isConfirmDeleteAllOpen}
          onClose={() => setIsConfirmDeleteAllOpen(false)}
          title="Are You Absolutely Sure?"
          message={
            <p>
              This action will permanently delete ALL your anime list data, news feeds, settings, and profile information from this application. 
              <strong className="text-red-400"> This cannot be undone.</strong> Do you wish to proceed?
            </p>
          }
          confirmText="Yes, Delete Everything"
          onConfirm={handlePerformDeleteAllData}
          isDestructive={true}
          customBackground={customBackground}
        />
      )}

       {isEditProfileModalOpen && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          userProfile={userProfile}
          onSave={handleProfileUpdate}
          customBackground={customBackground}
        />
      )}
       <ManageFeedsModal
        isOpen={isManageFeedsModalOpen}
        onClose={() => setIsManageFeedsModalOpen(false)}
        feeds={rssFeeds}
        onAddFeed={handleAddRssFeed}
        onRemoveFeed={handleRemoveRssFeed}
        onEditFeed={handleEditRssFeed}
        onResetFeeds={handleResetRssFeeds}
        customBackground={customBackground}
      />
      {imageToView && (
        <ImageViewerModal
          imageUrl={imageToView}
          onClose={() => setImageToView(null)}
        />
      )}

      {/* Centralized Preset Modals */}
      {presetModalState && (
        <SavePresetModal
            isOpen={!!presetModalState}
            onClose={() => setPresetModalState(null)}
            onSave={handleSavePresetModalConfirm}
            initialName={presetModalState.initialName || ''}
            title={getPresetModalTitle()}
            customBackground={customBackground}
        />
      )}
      {presetConfirmState && (
          <ConfirmationModal
              isOpen={!!presetConfirmState}
              onClose={() => setPresetConfirmState(null)}
              onConfirm={handlePresetConfirm}
              title={presetConfirmState.mode === 'overwrite' ? "Overwrite Preset?" : "Delete Preset?"}
              message={
                  presetConfirmState.mode === 'overwrite' ? 
                  <p>Are you sure you want to overwrite '<strong>{presetConfirmState.presetName}</strong>'? This will replace its settings with your current unsaved changes.</p> :
                  <p>Are you sure you want to permanently delete the preset '<strong>{presetConfirmState.presetName}</strong>'? This action cannot be undone.</p>
              }
              confirmText={presetConfirmState.mode === 'overwrite' ? "Yes, Overwrite" : "Yes, Delete"}
              isDestructive
              customBackground={customBackground}
          />
      )}
    </div>
  );
};

export default App;