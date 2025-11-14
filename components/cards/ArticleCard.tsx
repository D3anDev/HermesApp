


import React from 'react';
import type { RssArticle, CustomBackgroundSettings } from '../../types';
import { Bookmark } from 'lucide-react';

export const ArticleCard: React.FC<{
    article: RssArticle;
    isBookmarked: boolean;
    onBookmarkClick: (e: React.MouseEvent) => void;
    onViewArticle: () => void;
    customBackground: CustomBackgroundSettings;
}> = ({ article, isBookmarked, onBookmarkClick, onViewArticle, customBackground }) => {
    const cardStyle: React.CSSProperties = {
        backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
    };

    return (
        <div className="break-inside-avoid relative group h-full">
            <button
                onClick={onViewArticle}
                className="block w-full h-full text-left rounded-lg overflow-hidden shadow-lg hover:shadow-accent/20 transition-all duration-300 border border-border-color hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent hover:scale-[1.03] flex flex-col"
                style={cardStyle}
            >
                {article.imageUrl && (
                    <div className="overflow-hidden aspect-video">
                        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-300" />
                    </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                    <p className="text-sm text-accent font-semibold mb-1">{article.source}</p>
                    <h3 className="text-lg text-text-primary font-bold mb-2 leading-snug group-hover:text-accent transition-colors flex-grow">{article.title}</h3>
                    <p className="text-sm text-text-secondary/70 mt-auto">{new Date(article.date).toLocaleDateString()}</p>
                </div>
            </button>
            <button
                onClick={onBookmarkClick}
                title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:text-accent transition-colors z-10"
                aria-label="Bookmark article"
            >
                <Bookmark
                    className={`w-5 h-5 transition-all ${isBookmarked ? 'fill-accent text-accent' : 'fill-transparent'}`}
                />
            </button>
        </div>
    );
};