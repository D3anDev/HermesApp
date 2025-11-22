import type { RssArticle } from '../../types';

// Using a CORS proxy to bypass browser restrictions on fetching cross-origin data.
const CORS_PROXY = 'https://corsproxy.io/?';

// Helper to get text content from an element, cleaning up CDATA
const getElementText = (element: Element | Document, tagName: string): string => {
  const node = element.querySelector(tagName);
  return node?.textContent?.trim() || '';
};

// Helper to get raw HTML content from an element, supporting CDATA
const getElementHtml = (element: Element, tagName: string): string => {
  const node = element.querySelector(tagName);
  if (!node) return '';

  // If the first child is a CDATA section, its textContent is the raw HTML string
  if (node.firstChild?.nodeType === Node.CDATA_SECTION_NODE) {
    return node.textContent?.trim() || '';
  }
  // Otherwise, for regular elements, use innerHTML
  return node.innerHTML?.trim() || '';
};


// Helper to strip HTML tags for a clean snippet
const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

// Helper to extract an image URL from various possible places in the feed item
const extractImageUrl = (item: Element): string | null => {
    // 1. Check for media:content (often high-res)
    const mediaContent = item.querySelector('media\\:content, content');
    if (mediaContent?.getAttribute('medium') === 'image' && mediaContent.getAttribute('url')) {
        return mediaContent.getAttribute('url')!;
    }

    // 2. Check for media:thumbnail
    const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
    if (mediaThumbnail?.getAttribute('url')) {
        return mediaThumbnail.getAttribute('url')!;
    }
    
    // 3. Check for enclosure (RSS 2.0 standard)
    const enclosure = item.querySelector('enclosure');
    if (enclosure?.getAttribute('type')?.startsWith('image') && enclosure.getAttribute('url')) {
        return enclosure.getAttribute('url')!;
    }

    // 4. Check for Atom link enclosure
    const atomEnclosureLink = item.querySelector('link[rel="enclosure"][type^="image"]');
    if (atomEnclosureLink?.getAttribute('href')) {
        return atomEnclosureLink.getAttribute('href')!;
    }
    
    // 5. Look for an <img> tag inside description or content:encoded
    const contentHtml = getElementHtml(item, 'content\\:encoded') || getElementHtml(item, 'description') || getElementHtml(item, 'summary');
    // More robust regex to handle single or double quotes
    const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/);
    if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
    }
    
    // 6. Fallback is now null as no image was found
    return null;
};


export const fetchRssFeed = async (url: string): Promise<RssArticle[]> => {
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch feed with status: ${response.status}`);
        }
        const xmlString = await response.text();

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('XML Parsing Error:', parserError.textContent);
            throw new Error('Failed to parse XML feed.');
        }

        const isAtom = xmlDoc.querySelector('feed');
        const items = isAtom ? xmlDoc.querySelectorAll('entry') : xmlDoc.querySelectorAll('item');
        const feedTitle = getElementText(xmlDoc, 'title');

        const articles: RssArticle[] = [];

        items.forEach(item => {
            try {
                const title = getElementText(item, 'title');
                const link = isAtom ? item.querySelector('link')?.getAttribute('href') : getElementText(item, 'link');
                const date = getElementText(item, 'pubDate') || getElementText(item, 'updated');
                
                // Prioritize full content, fall back to description/summary
                const fullContentHtml = getElementHtml(item, 'content\\:encoded') || getElementHtml(item, 'description') || getElementHtml(item, 'summary');
                const snippet = stripHtml(fullContentHtml).substring(0, 200) + '...';
                const imageUrl = extractImageUrl(item);
                
                if (title && link) {
                    articles.push({
                        title,
                        link,
                        snippet,
                        content: fullContentHtml,
                        source: feedTitle || new URL(url).hostname,
                        date: new Date(date).toISOString(), // Standardize date format
                        imageUrl,
                    });
                }
            } catch (e) {
                console.warn("Skipping a malformed item in the feed:", item, e);
            }
        });
        
        return articles;

    } catch (error) {
        console.error(`Error fetching or parsing RSS feed from ${url}:`, error);
        throw error;
    }
};