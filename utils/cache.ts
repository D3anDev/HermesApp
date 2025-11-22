import { Anime, TimeSettings, CustomBackgroundSettings, LiveEffectSettings, LiveEffectType, BookmarkedItem, MalTokens, AppearancePreset, DashboardSettings } from '../types';

export const ANIME_LIST_KEY = 'hermes_animeList';
export const ANIME_DETAILS_CACHE_KEY = 'hermes_animeDetailsCache';
export const RSS_FEEDS_KEY = 'hermes_rssFeeds';
export const TIME_SETTINGS_KEY = 'hermes_timeSettings';
export const CUSTOM_BACKGROUND_KEY = 'hermes_customBackground';
export const LIVE_EFFECT_KEY = 'hermes_liveEffectSettings';
export const UNRESOLVED_ANIME_IDS_KEY = 'hermes_unresolvedAnimeIds';
export const BOOKMARKED_ITEMS_KEY = 'hermes_bookmarkedItems';
export const MAL_TOKENS_KEY = 'hermes_malTokens';
export const MAL_CLIENT_ID_KEY = 'hermes_malClientId';
export const APPEARANCE_PRESETS_KEY = 'hermes_appearancePresets';
export const ACTIVE_PRESET_ID_KEY = 'hermes_activePresetId';
export const DASHBOARD_SETTINGS_KEY = 'hermes_dashboardSettings';


export type DetailsCache = Record<number, Partial<Anime>>;

// --- Anime List Cache ---
export const saveAnimeListToCache = (list: Anime[]): void => {
  try {
    localStorage.setItem(ANIME_LIST_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("Failed to save anime list to localStorage:", error);
  }
};

export const loadAnimeListFromCache = (): Anime[] | null => {
  try {
    const cachedList = localStorage.getItem(ANIME_LIST_KEY);
    return cachedList ? JSON.parse(cachedList) : null;
  } catch (error) {
    console.error("Failed to load anime list from localStorage:", error);
    return null;
  }
};

// --- Details Cache ---
export const saveDetailsCache = (cache: DetailsCache): void => {
  try {
    localStorage.setItem(ANIME_DETAILS_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Failed to save details cache to localStorage:", error);
  }
};

export const loadDetailsCache = (): DetailsCache | null => {
  try {
    const cachedDetails = localStorage.getItem(ANIME_DETAILS_CACHE_KEY);
    return cachedDetails ? JSON.parse(cachedDetails) : {};
  } catch (error) {
    console.error("Failed to load details cache from localStorage:", error);
    return {};
  }
};

// --- RSS Feeds Cache ---
export const saveRssFeedsToCache = (feeds: string[]): void => {
  try {
    localStorage.setItem(RSS_FEEDS_KEY, JSON.stringify(feeds));
  } catch (error) {
    console.error("Failed to save RSS feeds to localStorage:", error);
  }
};

export const loadRssFeedsFromCache = (): string[] => {
  try {
    const cachedFeeds = localStorage.getItem(RSS_FEEDS_KEY);
    return cachedFeeds ? JSON.parse(cachedFeeds) : [];
  } catch (error) {
    console.error("Failed to load RSS feeds from localStorage:", error);
    return [];
  }
};

// --- Time Settings Cache ---
export const saveTimeSettingsToCache = (settings: TimeSettings): void => {
  try {
    localStorage.setItem(TIME_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save time settings to localStorage:", error);
  }
};

export const loadTimeSettingsFromCache = (): TimeSettings | null => {
  try {
    const cachedSettings = localStorage.getItem(TIME_SETTINGS_KEY);
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      // Add defaults for backward compatibility with older cache formats
      return {
        ...parsed,
        showSeconds: parsed.showSeconds ?? false,
        colonAnimation: parsed.colonAnimation ?? (parsed.blinkingColon === false ? 'solid' : 'blink'),
        showDate: parsed.showDate ?? true,
        dateFormat: parsed.dateFormat ?? 'month-day',
        showYear: parsed.showYear ?? false,
        numericDateStyle: parsed.numericDateStyle ?? 'md',
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to load time settings from localStorage:", error);
    return null;
  }
};

// --- Custom Background Cache ---
export const saveCustomBackgroundSettings = (settings: CustomBackgroundSettings): void => {
  try {
    localStorage.setItem(CUSTOM_BACKGROUND_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save custom background settings to localStorage:", error);
  }
};

export const loadCustomBackgroundSettings = (): CustomBackgroundSettings | null => {
  try {
    const cachedSettings = localStorage.getItem(CUSTOM_BACKGROUND_KEY);
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      // Fix: Add missing properties accentColor, componentColor, and overlayColor to the returned object to match the CustomBackgroundSettings type. This ensures backward compatibility with older cached data that may not have these fields.
      return {
        imageUrl: parsed.imageUrl ?? null,
        opacity: parsed.opacity ?? 1,
        blur: parsed.blur ?? 8,
        brightness: parsed.brightness ?? 1,
        contrast: parsed.contrast ?? 1,
        grayscale: parsed.grayscale ?? false,
        positionX: parsed.positionX ?? 50,
        positionY: parsed.positionY ?? 50,
        zoom: parsed.zoom ?? 100,
        tileOpacity: parsed.tileOpacity ?? parsed.overlayOpacity ?? 0.9,
        backgroundOverlayOpacity: parsed.backgroundOverlayOpacity ?? parsed.overlayOpacity ?? 0.85,
        accentColor: parsed.accentColor ?? null,
        componentColor: parsed.componentColor ?? null,
        overlayColor: parsed.overlayColor ?? null,
        primaryTextColor: parsed.primaryTextColor ?? null,
        secondaryTextColor: parsed.secondaryTextColor ?? null,
      };
    }
    return null;
  } catch (error)
 {
    console.error("Failed to load custom background settings from localStorage:", error);
    return null;
  }
};

// --- Live Effect Settings Cache ---
export const saveLiveEffectSettings = (settings: LiveEffectSettings): void => {
  try {
    localStorage.setItem(LIVE_EFFECT_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save live effect settings to localStorage:", error);
  }
};

export const loadLiveEffectSettings = (): LiveEffectSettings | null => {
  try {
    const cachedSettings = localStorage.getItem(LIVE_EFFECT_KEY);
    if (cachedSettings) {
      const parsed = JSON.parse(cachedSettings);
      return {
        type: parsed.type ?? LiveEffectType.None,
        count: parsed.count ?? 50,
        size: parsed.size ?? 15,
        speed: parsed.speed ?? 1,
        windIntensity: parsed.windIntensity ?? 0.2,
        color: parsed.color ?? (parsed.type === LiveEffectType.Rain ? '#ADD8EE' : '#F0F8FF'), // Default color based on type
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to load live effect settings from localStorage:", error);
    return null;
  }
};

// --- Unresolved Anime IDs Cache ---
export const saveUnresolvedIdsToCache = (ids: Set<number>): void => {
  try {
    localStorage.setItem(UNRESOLVED_ANIME_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (error) {
    console.error("Failed to save unresolved IDs to localStorage:", error);
  }
};

export const loadUnresolvedIdsFromCache = (): Set<number> | null => {
  try {
    const cachedIds = localStorage.getItem(UNRESOLVED_ANIME_IDS_KEY);
    return cachedIds ? new Set<number>(JSON.parse(cachedIds)) : null;
  } catch (error) {
    console.error("Failed to load unresolved IDs from localStorage:", error);
    return null;
  }
};

// --- Bookmarked Items Cache ---
export const saveBookmarkedItemsToCache = (items: BookmarkedItem[]): void => {
  try {
    localStorage.setItem(BOOKMARKED_ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save bookmarked items to localStorage:", error);
  }
};

export const loadBookmarkedItemsFromCache = (): BookmarkedItem[] | null => {
  try {
    const cachedItems = localStorage.getItem(BOOKMARKED_ITEMS_KEY);
    return cachedItems ? JSON.parse(cachedItems) : [];
  } catch (error) {
    console.error("Failed to load bookmarked items from localStorage:", error);
    return [];
  }
};

// --- MyAnimeList Tokens Cache ---
export const saveMalTokens = (tokens: MalTokens): void => {
  try {
    localStorage.setItem(MAL_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error("Failed to save MAL tokens to localStorage:", error);
  }
};

export const loadMalTokens = (): MalTokens | null => {
  try {
    const cachedTokens = localStorage.getItem(MAL_TOKENS_KEY);
    return cachedTokens ? JSON.parse(cachedTokens) : null;
  } catch (error) {
    console.error("Failed to load MAL tokens from localStorage:", error);
    return null;
  }
};

export const clearMalTokens = (): void => {
  try {
    localStorage.removeItem(MAL_TOKENS_KEY);
  } catch (error) {
    console.error("Failed to clear MAL tokens from localStorage:", error);
  }
};

// --- MyAnimeList Client ID Cache ---
export const saveMalClientId = (clientId: string): void => {
  try {
    if (clientId) {
      localStorage.setItem(MAL_CLIENT_ID_KEY, clientId);
    } else {
      localStorage.removeItem(MAL_CLIENT_ID_KEY);
    }
  } catch (error) {
    console.error("Failed to save MAL Client ID to localStorage:", error);
  }
};

export const loadMalClientId = (): string | null => {
  try {
    return localStorage.getItem(MAL_CLIENT_ID_KEY);
  } catch (error) {
    console.error("Failed to load MAL Client ID from localStorage:", error);
    return null;
  }
};

// --- Appearance Presets Cache ---
export const saveAppearancePresetsToCache = (presets: AppearancePreset[]): void => {
  try {
    localStorage.setItem(APPEARANCE_PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error("Failed to save appearance presets to localStorage:", error);
  }
};

export const loadAppearancePresetsFromCache = (): AppearancePreset[] => {
  try {
    const cached = localStorage.getItem(APPEARANCE_PRESETS_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error("Failed to load appearance presets from localStorage:", error);
    return [];
  }
};

export const saveActivePresetIdToCache = (id: string | null): void => {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PRESET_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PRESET_ID_KEY);
    }
  } catch (error) {
    console.error("Failed to save active preset ID to localStorage:", error);
  }
};

export const loadActivePresetIdFromCache = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_PRESET_ID_KEY);
  } catch (error) {
    console.error("Failed to load active preset ID from localStorage:", error);
    return null;
  }
};

// --- Dashboard Settings Cache ---
export const saveDashboardSettingsToCache = (settings: DashboardSettings): void => {
  try {
    localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save dashboard settings to localStorage:", error);
  }
};

export const loadDashboardSettingsFromCache = (): DashboardSettings | null => {
  try {
    const cachedSettings = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
    return cachedSettings ? JSON.parse(cachedSettings) : null;
  } catch (error) {
    console.error("Failed to load dashboard settings from localStorage:", error);
    return null;
  }
};