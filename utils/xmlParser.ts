import type { Anime } from '../types';
import { WatchStatus } from '../types';

// Maps status strings from MyAnimeList XML to the application's WatchStatus enum
const statusMap: { [key: string]: WatchStatus } = {
  'Watching': WatchStatus.Watching,
  'Completed': WatchStatus.Completed,
  'On-Hold': WatchStatus.OnHold,
  'Dropped': WatchStatus.Dropped,
  'Plan to Watch': WatchStatus.PlanToWatch,
};

// Helper to get text content from an element, handling CDATA sections
const getElementText = (element: Element | Document, tagName: string): string => {
  const node = element.querySelector(tagName);
  if (node?.firstChild?.nodeType === Node.CDATA_SECTION_NODE) {
    return node.textContent?.trim() || '';
  }
  return node?.textContent?.trim() || '';
};

/**
 * Parses an XML string from a MyAnimeList export and transforms it into an array of Anime objects.
 * @param xmlString The XML content as a string.
 * @returns An array of Anime objects.
 */
export const parseMalXml = (xmlString: string): Anime[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parser errors which MAL might not handle gracefully
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.error('XML Parsing Error:', parserError.textContent);
    throw new Error('Failed to parse XML file. Please ensure it is a valid MyAnimeList export.');
  }
  
  const animeNodes = xmlDoc.querySelectorAll('anime');
  if (animeNodes.length === 0 && !xmlDoc.querySelector('myanimelist')) {
      throw new Error('Invalid XML format. Make sure the file is from MyAnimeList.');
  }
  
  const animeList: Anime[] = [];

  animeNodes.forEach(node => {
    try {
      const id = parseInt(getElementText(node, 'series_animedb_id'), 10);
      const title = getElementText(node, 'series_title');
      const totalEpisodes = parseInt(getElementText(node, 'series_episodes'), 10);
      const episodesWatched = parseInt(getElementText(node, 'my_watched_episodes'), 10);
      const score = parseInt(getElementText(node, 'my_score'), 10);
      const statusString = getElementText(node, 'my_status');
      const status = statusMap[statusString] || WatchStatus.PlanToWatch;

      // Basic validation: ensure essential fields are present and valid
      if (!id || !title || isNaN(totalEpisodes) || isNaN(episodesWatched) || isNaN(score)) {
        console.warn('Skipping an invalid or incomplete anime entry:', { title, id });
        return;
      }

      animeList.push({
        id,
        title,
        // Use anime ID for a unique, consistent placeholder image
        posterUrl: `https://picsum.photos/seed/${id}/400/600`, 
        score,
        episodesWatched,
        totalEpisodes,
        status,
        genres: [], // Genre data is not available in the MAL XML export
        season: 1,  // Season data is not available in the MAL XML export, defaulting to 1
      });
    } catch (e) {
      console.error("Error processing a specific anime node:", e, node);
    }
  });

  return animeList;
};

/**
 * Parses an OPML or XML file to extract a list of RSS feed URLs.
 * @param xmlString The file content as a string.
 * @returns An array of feed URLs.
 */
export const parseOpmlForFeeds = (xmlString: string): string[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    console.error('OPML Parsing Error:', parserError.textContent);
    throw new Error('Failed to parse file. Please ensure it is a valid OPML/XML file.');
  }

  const outlineNodes = xmlDoc.querySelectorAll('outline[xmlUrl]');
  const feedUrls: string[] = [];

  outlineNodes.forEach(node => {
    const url = node.getAttribute('xmlUrl');
    if (url) {
      feedUrls.push(url);
    }
  });

  return feedUrls;
};