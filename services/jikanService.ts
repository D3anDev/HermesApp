import type { AnimePicture } from '../../types';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

// Helper to handle API responses from Jikan
const handleJikanApiResponse = async (response: Response): Promise<any> => {
    // Jikan API uses 429 for rate limiting
    if (response.status === 429) {
        throw new Error('Jikan API rate limit exceeded: 429');
    }
    if (!response.ok) {
        throw new Error(`Jikan API responded with status: ${response.status}`);
    }
    return response.json();
};

/**
 * Fetches pictures for a given anime from the Jikan API.
 * @param malId The MyAnimeList ID of the anime.
 * @returns A promise that resolves to an array of objects with small and large image URLs.
 */
export const fetchAnimePictures = async (malId: number): Promise<AnimePicture[]> => {
    try {
        const response = await fetch(`${JIKAN_API_URL}/anime/${malId}/pictures`);
        const json = await handleJikanApiResponse(response);
        
        const picturesData: any[] = json?.data || [];
        
        // Extract both small and large image URLs from each picture object
        return picturesData
            .map(pic => ({
                small: pic?.jpg?.image_url,
                large: pic?.jpg?.large_image_url,
            }))
            .filter(pic => pic.small && pic.large); // Ensure both URLs exist
    } catch (error) {
        console.error(`Failed to fetch pictures for MAL ID ${malId} from Jikan:`, error);
        // Return an empty array to prevent the entire details view from failing.
        return [];
    }
};
