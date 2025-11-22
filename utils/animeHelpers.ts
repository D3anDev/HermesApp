import { Anime, WatchStatus } from '../types';

/**
 * Determines if an anime is untrackable by episodes (e.g., unreleased, unknown episode count for a series).
 * This specifically refers to cases where totalEpisodes is 0 AND it's marked as NOT_YET_RELEASED
 * or its mediaStatus is not yet known (implies untracked/unreleased for episode count).
 * Movies/shorts with 0 episodes that ARE released are still considered 'untrackable by episode'
 * as individual episode tracking is not meaningful, but they *can* be rated once watched.
 * @param anime The Anime object.
 * @returns True if episode tracking should be disabled.
 */
export const isUntrackableByEpisodes = (anime: Anime): boolean => {
  return anime.totalEpisodes === 0 && (anime.mediaStatus === 'NOT_YET_RELEASED' || !anime.mediaStatus);
};

/**
 * Determines if an anime cannot be rated (e.g., unreleased or currently in 'Plan to Watch' status).
 * @param anime The Anime object.
 * @param currentStatus Optional: the current status being considered, if different from anime.status.
 * @returns True if rating should be disabled.
 */
export const isUnratable = (anime: Anime, currentStatus?: WatchStatus): boolean => {
  const effectiveStatus = currentStatus ?? anime.status;
  // If it's untrackable by episodes (implies not yet released or similar), it's also unratable.
  // Also unratable if it's currently 'Plan to Watch'.
  return isUntrackableByEpisodes(anime) || effectiveStatus === WatchStatus.PlanToWatch;
};
