


import type React from 'react';


export enum WatchStatus {
  Watching = 'Watching',
  Completed = 'Completed',
  OnHold = 'On Hold',
  Dropped = 'Dropped',
  PlanToWatch = 'Plan to Watch',
}

export interface RelatedAnime {
  id: number;
  malId: number | null;
  title: string;
  posterUrl: string;
  relationType: string;
  format: string;
}

export interface Character {
  id: number;
  name: string;
  imageUrl: string;
  role: 'MAIN' | 'SUPPORTING' | 'BACKGROUND';
}

export interface AnimePicture {
  small: string;
  large: string;
}

export interface Anime {
  id: number; // This will be the MAL ID from the import
  title: string;
  posterUrl: string;
  score: number;
  episodesWatched: number;
  totalEpisodes: number;
  status: WatchStatus;
  genres: string[];
  season: number;
  // New optional fields for AniList data
  bannerUrl?: string;
  description?: string;
  studio?: string;
  format?: string;
  averageScore?: number;
  startDate?: { year: number | null };
  externalLinks?: { site: string; url: string; }[];
  relations?: RelatedAnime[];
  alternativeTitles?: string[];
  characters?: Character[];
  mediaStatus?: string; // e.g., 'RELEASING', 'FINISHED', 'NOT_YET_RELEASED'
  pictures?: AnimePicture[]; // New: gallery images from Jikan
}

export type ViewType = 'home' | 'my-list' | 'discover' | 'saved' | 'settings' | 'profile' | 'about';

export interface RssArticle {
  title: string;
  link: string;
  snippet: string;
  content: string;
  source: string;
  date: string;
  imageUrl: string | null;
}

export type ColonAnimation = 'none' | 'solid' | 'blink' | 'fade' | 'pulse';

export interface TimeSettings {
  timezone: string;
  format: '12h' | '24h';
  showSeconds: boolean;
  colonAnimation: ColonAnimation;
  showDate: boolean;
  dateFormat: 'month-day' | 'numeric';
  showYear: boolean;
  numericDateStyle: 'md' | 'dm';
}

export interface CustomBackgroundSettings {
  imageUrl: string | null;
  opacity: number; // 0-1 (image opacity)
  blur: number; // in pixels
  brightness: number; // 0-2 (1 is default)
  contrast: number; // 0-2 (1 is default)
  grayscale: boolean;
  positionX: number; // 0-100 (%)
  positionY: number; // 0-100 (%)
  zoom: number; // 100+ (%)
  tileOpacity: number; // Opacity for tiles, sidebar, modals
  backgroundOverlayOpacity: number; // Opacity for the main background overlay
  // New color fields
  accentColor: string | null;
  componentColor: string | null; // Tiles, sidebar, modals (#161B22)
  overlayColor: string | null;   // Main background overlay (#0D1117)
  primaryTextColor: string | null; // #C9D1D9
  secondaryTextColor: string | null; // #8B949E
}

// Added for ConfirmationModal flexibility
export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string; // Optional custom text for confirm button
  cancelText?: string;  // Optional custom text for cancel button (if different from onClose)
  onCloseWithCustomAction?: () => void; // Optional action for the 'cancel' button that is not just onClose
  isDestructive?: boolean; // Optional flag to style confirm button as destructive
  customBackground?: CustomBackgroundSettings; // Added for consistent styling
}

export enum ExportDataType {
  AnimeListXML = 'ANIME_LIST_XML',
  AllAppDataJSON = 'ALL_APP_DATA_JSON',
}

export enum LiveEffectType {
  None = 'None',
  Snow = 'Snow',
  Leaves = 'Leaves',
  Rain = 'Rain',
  Clouds = 'Clouds',
  Sparks = 'Sparks',
  Lightning = 'Lightning',
  Dust = 'Dust',
}

export interface LiveEffectSettings {
  type: LiveEffectType;
  count: number; // Number of particles
  size: number; // Base size in pixels (e.g., for snow flake diameter, rain line thickness/length multiplier)
  speed: number; // Fall speed (lower value = faster fall)
  windIntensity: number; // How much horizontal drift (0-1)
  color?: string; // Hex color for snow/rain (leaves will be multi-colored)
}

export interface BookmarkedImage {
  type: 'image';
  id: number; // using animeId as a unique identifier
  imageUrl: string;
  title: string; // anime title for context
}

export type BookmarkedItem = (RssArticle & { type: 'article' }) | BookmarkedImage;

// New types for MyAnimeList Integration
export interface MalTokens {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  issued_at: number; // Custom field: timestamp of when tokens were received
}

export interface MalUser {
  id: number;
  name: string;
  picture: string;
}

export interface MalAuthData {
  tokens: MalTokens;
  user: MalUser;
}

export interface AppearancePreset {
  id: string;
  name: string;
  description?: string;
  background: CustomBackgroundSettings;
  effects: LiveEffectSettings;
}

// New types for customizable dashboard
export enum HomeTile {
  ContinueWatching = 'continue-watching',
  Stats = 'stats',
  Upcoming = 'upcoming',
  OptimizedStats = 'optimized-stats',
}

export interface TileLayout {
  id: HomeTile;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayout {
  id: string;
  name: string;
  isEditable: boolean;
  layout: TileLayout[];
}

export interface DashboardSettings {
    layouts: DashboardLayout[];
    activeLayoutId: string;
}