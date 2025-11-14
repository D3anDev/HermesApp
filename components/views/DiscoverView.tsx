import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RssArticle, BookmarkedItem, CustomBackgroundSettings } from '../../types';
import { Compass, Loader2, ListPlus, Settings2, AlertTriangle, ExternalLink, Star, Newspaper, Plus, History, Share2 } from 'lucide-react';
import { ArticleCard } from '../cards/ArticleCard';
import { fetchRssFeed } from '../../services/rssService';
import { PREDEFINED_FEED_SOURCES } from '../../utils/predefinedFeeds';
import { Tile } from '../cards/Tile';

interface DiscoverViewProps {
    bookmarkedItems: BookmarkedItem[];
    onToggleBookmark: (item: BookmarkedItem) => void;
    onViewArticle: (article: RssArticle) => void;
    refreshKey: number;
    rssFeeds: string[];
    onOpenManageFeedsModal: () => void;
    customBackground: CustomBackgroundSettings;
}

const FeaturedArticleCard: React.FC<{ article: RssArticle, onReadMore: () => void, customBackground: CustomBackgroundSettings }> = ({ article, onReadMore, customBackground }) => {
    const cardStyle: React.CSSProperties = {
        backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
    };
    
    return (
        <div 
            className="rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0 group border border-border-color h-full"
            style={cardStyle}
        >
            {article.imageUrl && (
                <div className="relative h-64 lg:h-auto overflow-hidden">
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent lg:bg-gradient-to-r"></div>
                </div>
            )}
            <div className="p-6 flex flex-col justify-between">
                <div>
                    <p className="text-base text-accent font-semibold mb-2">{article.source} &bull; {new Date(article.date).toLocaleDateString()}</p>
                    <h3 className="text-3xl xl:text-4xl text-text-primary font-bold mb-3 leading-tight group-hover:text-accent transition-colors">{article.title}</h3>
                    <p className="text-lg text-text-secondary line-clamp-3">{article.snippet}</p>
                </div>
                <button
                    onClick={onReadMore}
                    className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-md text-primary bg-accent hover:bg-blue-400 transition-colors font-semibold text-base self-start"
                >
                    <span>Read More</span>
                    <ExternalLink size={16} />
                </button>
            </div>
        </div>
    );
};

export const DiscoverView: React.FC<DiscoverViewProps> = ({ 
    bookmarkedItems, 
    onToggleBookmark, 
    onViewArticle, 
    refreshKey,
    rssFeeds,
    onOpenManageFeedsModal,
    customBackground,
}) => {
    const [articles, setArticles] = useState<RssArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedErrors, setFeedErrors] = useState<string[]>([]);
    const [activeSource, setActiveSource] = useState<string>('All');

    const getSourceName = (hostname: string) => {
        for (const key in PREDEFINED_FEED_SOURCES) {
            if (hostname.includes(key)) {
                return PREDEFINED_FEED_SOURCES[key];
            }
        }
        return hostname;
    };

    const fetchAllFeeds = useCallback(async () => {
        if (rssFeeds.length === 0) {
            setArticles([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setFeedErrors([]);
        const allArticles: RssArticle[] = [];
        const currentErrors: string[] = [];
        
        await Promise.all(
            rssFeeds.map(async (url) => {
                try {
                    const feedArticles = await fetchRssFeed(url);
                    allArticles.push(...feedArticles.map(a => ({...a, source: getSourceName(a.source) })));
                } catch (error) {
                    currentErrors.push(url);
                }
            })
        );
        
        // Sort all articles by date once after fetching
        allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFeedErrors(currentErrors);
        setArticles(allArticles);
        setIsLoading(false);
    }, [rssFeeds]);

    useEffect(() => {
        fetchAllFeeds();
    }, [refreshKey, fetchAllFeeds]);

    const sources = useMemo(() => ['All', ...Array.from(new Set(articles.map(a => a.source))).sort()], [articles]);
    
    useEffect(() => {
        // If the active source is no longer available (e.g., feed removed), reset to "All"
        if (!sources.includes(activeSource)) {
            setActiveSource('All');
        }
    }, [sources, activeSource]);

    const displayedArticles = useMemo(() => {
        return articles.filter(a => activeSource === 'All' || a.source === activeSource);
    }, [articles, activeSource]);

    const featuredArticle = useMemo(() => displayedArticles.length > 0 ? displayedArticles[0] : null, [displayedArticles]);
    const gridArticles = useMemo(() => displayedArticles.slice(1), [displayedArticles]);

    const handleBookmarkClick = (e: React.MouseEvent, article: RssArticle) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleBookmark({ ...article, type: 'article' });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-xl text-text-secondary">Fetching latest anime news...</p>
                </div>
            );
        }
        
        if (rssFeeds.length === 0) {
             return (
                <Tile title="Your News Feed is Empty" customBackground={customBackground} className="h-full">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <ListPlus className="w-16 h-16 text-text-secondary mb-4" />
                        <p className="text-2xl text-text-primary font-medium">Your news feed is empty</p>
                        <p className="text-lg text-text-secondary/70 mt-1">Click 'Manage Feeds' to add your first RSS feed.</p>
                    </div>
                </Tile>
            );
        }

        if (displayedArticles.length === 0 && !isLoading) {
            return (
                 <Tile title="No Articles Found" customBackground={customBackground} className="h-full">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <Compass className="w-16 h-16 text-text-secondary mb-4" />
                        <p className="text-2xl text-text-primary font-medium">No Articles Found</p>
                        <p className="text-lg text-text-secondary/70 mt-1">
                            {activeSource !== 'All' ? `No articles from "${activeSource}".` : 'Could not find any articles from your feeds.'}
                        </p>
                    </div>
                </Tile>
            );
        }

        return (
            <div className="space-y-6">
                {featuredArticle && (
                    <Tile title="Featured Article" icon={Star} customBackground={customBackground}>
                      <FeaturedArticleCard article={featuredArticle} onReadMore={() => onViewArticle(featuredArticle)} customBackground={customBackground} />
                    </Tile>
                )}

                {gridArticles.length > 0 && (
                    <Tile title="Latest Articles" icon={Newspaper} customBackground={customBackground}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {gridArticles.map((article, index) => {
                                const isBookmarked = bookmarkedItems.some(a => a.type === 'article' && a.link === article.link);
                                return (
                                    <ArticleCard
                                        key={`${article.link}-${index}`}
                                        article={article}
                                        isBookmarked={isBookmarked}
                                        onBookmarkClick={(e) => handleBookmarkClick(e, article)}
                                        onViewArticle={() => onViewArticle(article)}
                                        customBackground={customBackground}
                                    />
                                );
                            })}
                        </div>
                    </Tile>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-screen-2xl mx-auto h-full flex flex-col">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Compass className="w-8 h-8 text-accent flex-shrink-0" />
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-text-primary">Discover</h1>
                        <p className="text-xl text-text-secondary">Your hub for the latest in the anime world.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
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
                  </div>
                  <button
                      onClick={onOpenManageFeedsModal}
                      className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors flex-shrink-0"
                  >
                      <Settings2 size={16} />
                      <span>Manage Feeds</span>
                  </button>
                </div>
            </header>

            {feedErrors.length > 0 && (
                <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-base">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-bold">Failed to load {feedErrors.length} feed(s).</h4>
                            <p className="text-sm mt-1 text-red-300/80">This can be due to network issues, an invalid URL, or CORS restrictions.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {articles.length > 0 && (
                <nav className="mb-6 flex-shrink-0">
                    <div className="border-b border-border-color">
                        <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                            {sources.map(source => (
                                <button
                                    key={source}
                                    onClick={() => setActiveSource(source)}
                                    className={`px-4 py-2 text-lg font-medium rounded-t-md transition-colors whitespace-nowrap ${
                                        activeSource === source
                                            ? 'bg-secondary text-accent border-b-2 border-accent'
                                            : 'text-text-secondary hover:bg-secondary/70 hover:text-text-primary'
                                    }`}
                                >
                                    {source}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            )}

            <div className="flex-grow min-h-0 overflow-y-auto scrollbar-thin -mr-4 pr-4">
                {renderContent()}
            </div>
        </div>
    );
};
