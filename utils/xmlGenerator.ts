import type { Anime } from '../types';
import { WatchStatus } from '../types';

// Maps application's WatchStatus enum to MyAnimeList XML string values
const exportStatusMap: Record<WatchStatus, string> = {
  [WatchStatus.Watching]: 'Watching',
  [WatchStatus.Completed]: 'Completed',
  [WatchStatus.OnHold]: 'On-Hold',
  [WatchStatus.Dropped]: 'Dropped',
  [WatchStatus.PlanToWatch]: 'Plan to Watch',
};

/**
 * Generates an XML string in MyAnimeList format from the provided anime list.
 * @param animeList The array of Anime objects to export.
 * @param username The user's name for the <myinfo> section.
 * @returns A string containing the XML representation of the anime list.
 */
export const generateMalXml = (animeList: Anime[], username: string): string => {
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
  xml += `<myanimelist>\n\n`;

  // Calculate stats for <myinfo> section
  const totalAnime = animeList.length;
  const totalWatching = animeList.filter(a => a.status === WatchStatus.Watching).length;
  const totalCompleted = animeList.filter(a => a.status === WatchStatus.Completed).length;
  const totalOnhold = animeList.filter(a => a.status === WatchStatus.OnHold).length;
  const totalDropped = animeList.filter(a => a.status === WatchStatus.Dropped).length;
  const totalPlantowatch = animeList.filter(a => a.status === WatchStatus.PlanToWatch).length;

  xml += `\t<myinfo>\n`;
  // Note: User ID is not tracked in Hermes, so using a placeholder.
  // The user_name is passed from App.tsx.
  xml += `\t\t<user_id>0</user_id>\n`;
  xml += `\t\t<user_name><![CDATA[${username}]]></user_name>\n`;
  xml += `\t\t<user_export_type>1</user_export_type>\n`;
  xml += `\t\t<user_total_anime>${totalAnime}</user_total_anime>\n`;
  xml += `\t\t<user_total_watching>${totalWatching}</user_total_watching>\n`;
  xml += `\t\t<user_total_completed>${totalCompleted}</user_total_completed>\n`;
  xml += `\t\t<user_total_onhold>${totalOnhold}</user_total_onhold>\n`;
  xml += `\t\t<user_total_dropped>${totalDropped}</user_total_dropped>\n`;
  xml += `\t\t<user_total_plantowatch>${totalPlantowatch}</user_total_plantowatch>\n`;
  xml += `\t</myinfo>\n\n`;

  // Add each anime entry
  animeList.forEach(anime => {
    const malStatus = exportStatusMap[anime.status] || 'Plan to Watch'; // Fallback
    const malScore = anime.score > 0 ? anime.score.toString() : '0'; // MAL scores are 0-10, 0 for unrated.
    const malTotalEpisodes = anime.totalEpisodes > 0 ? anime.totalEpisodes : '0'; // MAL uses 0 for unknown/unreleased.

    xml += `\t<anime>\n`;
    xml += `\t\t<series_animedb_id>${anime.id}</series_animedb_id>\n`;
    xml += `\t\t<series_title><![CDATA[${anime.title}]]></series_title>\n`;
    xml += `\t\t<series_type>TV</series_type>\n`; // Default to TV, as type is not explicitly stored in `Anime` for this export
    xml += `\t\t<series_episodes>${malTotalEpisodes}</series_episodes>\n`;
    xml += `\t\t<my_id>0</my_id>\n`; // Internal MAL ID, not used by Hermes
    xml += `\t\t<my_watched_episodes>${anime.episodesWatched}</my_watched_episodes>\n`;
    xml += `\t\t<my_start_date>0000-00-00</my_start_date>\n`; // Start/finish dates not tracked in Hermes for export
    xml += `\t\t<my_finish_date>0000-00-00</my_finish_date>\n`;
    xml += `\t\t<my_rated></my_rated>\n`; // Rated status not directly available
    xml += `\t\t<my_score>${malScore}</my_score>\n`;
    xml += `\t\t<my_storage></my_storage>\n`; // Storage info not tracked
    xml += `\t\t<my_storage_value>0.00</my_storage_value>\n`;
    xml += `\t\t<my_status>${malStatus}</my_status>\n`;
    xml += `\t\t<my_comments><![CDATA[]]></my_comments>\n`; // Comments not tracked
    xml += `\t\t<my_times_watched>0</my_times_watched>\n`; // Rewatch count not tracked
    xml += `\t\t<my_rewatch_value></my_rewatch_value>\n`; // Rewatch value not tracked
    xml += `\t\t<my_priority>LOW</my_priority>\n`; // Default priority
    xml += `\t\t<my_tags><![CDATA[]]></my_tags>\n`; // Tags not tracked
    xml += `\t\t<my_rewatching>0</my_rewatching>\n`; // Rewatching status not separately tracked
    xml += `\t\t<my_rewatching_ep>0</my_rewatching_ep>\n`;
    xml += `\t\t<my_discuss>1</my_discuss>\n`; // Default
    xml += `\t\t<my_sns>default</my_sns>\n`; // Default
    xml += `\t\t<update_on_import>0</update_on_import>\n`; // Default
    xml += `\t</anime>\n\n`;
  });

  xml += `</myanimelist>\n`;
  return xml;
};
