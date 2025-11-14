import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RssArticle, BookmarkedItem } from '../../types';
import { Rss, Loader2, ListPlus, Settings2, AlertTriangle, ChevronDown } from 'lucide-react';
import { ArticleCard } from '../cards/ArticleCard';
import { fetchRssFeed } from '../../services/rssService';
import { ManageFeedsModal } from '../modals/ManageFeedsModal';


interface NewsViewProps {
    bookmarkedItems: BookmarkedItem[];
    onToggleBookmark: (item: BookmarkedItem) => void;
    onViewArticle: (article: RssArticle) => void;
    refreshKey: number;
    rssFeeds: string[];
    onAddFeed: (url: string) => void;
    onRemoveFeed: (url: string) => void;
    onEditFeed: (oldUrl: string, newUrl: string) => void;
    onResetFeeds: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ 
    bookmarkedItems, 
    onToggleBookmark, 
    onViewArticle, 
    refreshKey,
    rssFeeds,
    onAddFeed,
    onRemoveFeed,
    onEditFeed,
    onResetFeeds
}) => {
    const [articles, setArticles] = useState<RssArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManageFeedsModalOpen, setIsManageFeedsModalOpen] = useState(false);
    const [feedErrors, setFeedErrors] = useState<string[]>([]);
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'date' | 'source'>('date');

    const fetchAllFeeds = useCallback(async () => {
        if (rssFeeds.length === 0) {
            setArticles([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setFeedErrors([]); // Reset errors
        const allArticles: RssArticle[] = [];
        const currentErrors: string[] = [];
        
        await Promise.all(
            rssFeeds.map(async (url) => {
                try {
                    const feedArticles = await fetchRssFeed(url);
                    allArticles.push(...feedArticles);
                } catch (error) {
                    console.error(`Failed to fetch or parse feed: ${url}`, error);
                    currentErrors.push(url);
                }
            })
        );

        setFeedErrors(currentErrors);
        setArticles(allArticles);
        setIsLoading(false);
    }, [rssFeeds]);

    useEffect(() => {
        fetchAllFeeds();
    }, [refreshKey, fetchAllFeeds]);

    const sources = useMemo(() => ['all', ...Array.from(new Set(articles.map(a => a.source))).sort()], [articles]);
    
    const displayedArticles = useMemo(() => {
        return articles
            .filter(a => selectedSource === 'all' || a.source === selectedSource)
            .sort((a, b) => {
                if (sortOrder === 'source') {
                    const sourceCompare = a.source.localeCompare(b.source);
                    if (sourceCompare !== 0) return sourceCompare;
                }
                // Primary sort is always by date
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
    }, [articles, selectedSource, sortOrder]);


    const handleBookmarkClick = (e: React.MouseEvent, article: RssArticle) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleBookmark({ ...article, type: 'article' });
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <p className="text-xl text-text-secondary">Fetching latest anime news...</p>
                </div>
            );
        }
        
        if (rssFeeds.length === 0) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-center bg-secondary rounded-lg">
                    <ListPlus className="w-16 h-16 text-text-secondary mb-4" />
                    <p className="text-2xl text-text-primary font-medium">Your news feed is empty</p>
                    <p className="text-lg text-text-secondary/70 mt-1">Click 'Manage Feeds' to add your first RSS feed.</p>
                </div>
            );
        }

        if (displayedArticles.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center bg-secondary rounded-lg">
                    <Rss className="w-16 h-16 text-text-secondary mb-4" />
                    <p className="text-2xl text-text-primary font-medium">No articles found</p>
                    <p className="text-lg text-text-secondary/70 mt-1">
                        {selectedSource !== 'all' ? `No articles from "${selectedSource}".` : 'Could not find any articles from your feeds.'}
                    </p>
                </div>
            );
        }

        return (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 4xl:columns-7 5xl:columns-8 gap-6">
                {displayedArticles.map((article, index) => {
                    const isBookmarked = bookmarkedItems.some(a => a.type === 'article' && a.link === article.link);
                    return (
                        <ArticleCard
                            key={`${article.link}-${index}`}
                            article={article}
                            isBookmarked={isBookmarked}
                            onBookmarkClick={(e) => handleBookmarkClick(e, article)}
                            onViewArticle={() => onViewArticle(article)}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-border-color pb-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Rss className="w-8 h-8 text-accent flex-shrink-0" />
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">Anime News</h2>
                            <p className="text-xl text-text-secondary">Your feed for the latest updates from the anime world.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsManageFeedsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors flex-shrink-0"
                    >
                        <Settings2 size={16} />
                        <span>Manage Feeds</span>
                    </button>
                </div>
                 {feedErrors.length > 0 && (
                    <div className="mb-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-base">
                        <div className="flex items-start">
                            <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold">Failed to load some feeds:</h4>
                                <ul className="list-disc list-inside mt-1 text-base">
                                    {feedErrors.map(url => <li key={url} className="truncate">{url}</li>)}
                                </ul>
                                <p className="text-sm mt-2 text-red-300/80">This can be due to network issues, an invalid URL, or CORS restrictions. Try removing and re-adding the feed, or try a different source.</p>
                            </div>
                        </div>
                    </div>
                )}
                {articles.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-secondary/70 rounded-lg border border-border-color flex-shrink-0">
                        <div className="relative flex-grow">
                            <label htmlFor="source-filter" className="block text-sm font-medium text-text-secondary mb-1">Filter by Source</label>
                            <select
                                id="source-filter"
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                                className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                            >
                                {sources.map(source => (
                                    <option key={source} value={source}>{source === 'all' ? 'All Sources' : source}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>
                        <div className="relative flex-grow">
                            <label htmlFor="sort-order" className="block text-sm font-medium text-text-secondary mb-1">Sort By</label>
                            <select
                                id="sort-order"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'date' | 'source')}
                                className="w-full appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                            >
                                <option value="date">Latest</option>
                                <option value="source">Source</option>
                            </select>
                            <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>
                    </div>
                )}

                <div className="flex-grow min-h-0">
                    {renderContent()}
                </div>
            </div>
            <ManageFeedsModal
                isOpen={isManageFeedsModalOpen}
                onClose={() => setIsManageFeedsModalOpen(false)}
                feeds={rssFeeds}
                onAddFeed={onAddFeed}
                onRemoveFeed={onRemoveFeed}
                onEditFeed={onEditFeed}
                onResetFeeds={onResetFeeds}
            />
        </>
    );
};
