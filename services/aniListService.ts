import type { Anime, RelatedAnime, Character } from '../types';
import { WatchStatus } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

const ANIME_DETAILS_QUERY = `
query ($malId: Int) {
  Media(idMal: $malId, type: ANIME) {
    id
    status
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
    }
    bannerImage
    externalLinks {
      site
      url
    }
    description
    genres
    studios(isMain: true) {
      nodes {
        name
      }
    }
    format
    episodes
    averageScore
    startDate {
      year
    }
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          idMal
          type
          title {
            romaji
            english
          }
          format
          coverImage {
            large
          }
        }
      }
    }
    characters(sort: [ROLE, RELEVANCE, ID], perPage: 10) {
      edges {
        role
        node {
          id
          name {
            full
          }
          image {
            large
          }
        }
      }
    }
  }
}
`;

const ANIME_SEARCH_QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 24) {
    media(search: $search, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
      id
      idMal
      status
      title {
        romaji
        english
        native
      }
      coverImage {
        large
      }
      format
      episodes
      startDate {
        year
      }
    }
  }
}
`;

// New custom error for rate limiting
export class RateLimitError extends Error {
  public retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Helper function to remove HTML tags from description
const stripHtml = (html: string | null): string => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

const handleApiResponse = async (response: Response): Promise<any> => {
    if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
        throw new RateLimitError('API rate limit exceeded: 429', retryAfterSeconds);
    }
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`AniList API responded with status: ${response.status}`);
    }

    const json = await response.json();
    
    // Check for GraphQL errors inside a 200 OK response
    if (json.errors) {
        const rateLimitError = json.errors.find((e: any) => e.status === 429);
        if (rateLimitError) {
            // It's unlikely to get here if HTTP status is 200, but good to handle.
            // Let's assume there won't be a Retry-After header on a 200 response. Default to 60.
            throw new RateLimitError(rateLimitError.message, 60);
        }
        // Could throw a generic GraphQL error here too.
        throw new Error(`GraphQL error: ${json.errors.map((e:any) => e.message).join(', ')}`);
    }

    return json;
};

export async function fetchAnimeDetails(malId: number): Promise<Partial<Anime> | null> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANIME_DETAILS_QUERY,
        variables: { malId },
      }),
    });

    const json = await handleApiResponse(response);
    
    if (!json) {
        console.warn(`404 Not Found for MAL ID ${malId}. It might not be an anime.`);
        return null;
    }

    const media = json.data?.Media;

    if (!media) {
      console.warn(`No media found on AniList for MAL ID: ${malId}`);
      return null;
    }
    
    const relations: RelatedAnime[] = (media.relations?.edges || [])
      .filter((edge: any) => edge.node.idMal && edge.node.type === 'ANIME' && ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'SPIN_OFF', 'ALTERNATIVE', 'PARENT'].includes(edge.relationType))
      .map((edge: any) => {
        let relationType = edge.relationType.replace(/_/g, ' ');
        relationType = relationType.charAt(0).toUpperCase() + relationType.slice(1).toLowerCase();

        return {
          id: edge.node.id,
          malId: edge.node.idMal,
          title: edge.node.title.english || edge.node.title.romaji,
          posterUrl: edge.node.coverImage.large,
          relationType: relationType,
          format: edge.node.format,
        };
      });

    const mainTitle = media.title.english || media.title.romaji;
    const allTitles = new Set<string>();
    if (media.title.romaji) allTitles.add(media.title.romaji);
    if (media.title.english) allTitles.add(media.title.english);
    if (media.title.native) allTitles.add(media.title.native);
    allTitles.delete(mainTitle);
    const alternativeTitles = Array.from(allTitles);

    const characters: Character[] = (media.characters?.edges || [])
        .map((edge: any) => ({
            id: edge.node.id,
            name: edge.node.name.full,
            imageUrl: edge.node.image.large,
            role: edge.role,
        }));

    return {
      title: mainTitle,
      alternativeTitles,
      posterUrl: media.coverImage?.extraLarge,
      bannerUrl: media.bannerImage,
      externalLinks: media.externalLinks || [],
      description: stripHtml(media.description),
      genres: media.genres || [],
      studio: media.studios?.nodes[0]?.name || 'Unknown',
      format: media.format || 'Unknown',
      averageScore: media.averageScore,
      totalEpisodes: media.episodes || 0,
      startDate: media.startDate,
      relations,
      characters,
      mediaStatus: media.status,
    };
  } catch (error) {
    console.error(`Failed to fetch details for MAL ID ${malId}:`, error);
    throw error;
  }
}

export async function searchAnime(query: string): Promise<Anime[]> {
    try {
        const response = await fetch(ANILIST_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: ANIME_SEARCH_QUERY,
                variables: { search: query },
            }),
        });

        const json = await handleApiResponse(response);
        const mediaList = json?.data?.Page?.media || [];

        return mediaList
            .filter((media: any) => media.idMal)
            .map((media: any): Anime => {
                const mainTitle = media.title.english || media.title.romaji;
                const allTitles = new Set<string>();
                if (media.title.romaji) allTitles.add(media.title.romaji);
                if (media.title.english) allTitles.add(media.title.english);
                if (media.title.native) allTitles.add(media.title.native);
                allTitles.delete(mainTitle);

                return {
                    id: media.idMal,
                    title: mainTitle,
                    alternativeTitles: Array.from(allTitles),
                    posterUrl: media.coverImage.large,
                    totalEpisodes: media.episodes || 0,
                    format: media.format,
                    startDate: media.startDate,
                    episodesWatched: 0,
                    score: 0,
                    status: WatchStatus.PlanToWatch,
                    mediaStatus: media.status,
                    genres: [],
                    season: 1,
                };
            });

    } catch (error) {
        console.error(`Failed to search for anime "${query}":`, error);
        throw error;
    }
}