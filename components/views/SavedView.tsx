import React from 'react';
import type { RssArticle, BookmarkedItem, BookmarkedImage, CustomBackgroundSettings } from '../../types';
import { Bookmark, Newspaper, Image as ImageIcon, Trash2, Plus, History, Share2 } from 'lucide-react';
import { ArticleCard } from '../cards/ArticleCard';
import { Tile } from '../cards/Tile';

interface SavedViewProps {
  savedItems: BookmarkedItem[];
  onToggleBookmark: (item: BookmarkedItem) => void;
  onViewArticle: (article: RssArticle) => void;
  onViewImage: (url: string) => void;
  customBackground: CustomBackgroundSettings;
}

const SavedImageCard: React.FC<{ image: BookmarkedImage; onRemove: () => void; onViewImage: (url: string) => void }> = ({ image, onRemove, onViewImage }) => {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the main button's onClick from firing
    onRemove();
  };
  
  return (
    <div className="mb-6 break-inside-avoid">
      <button
        onClick={() => onViewImage(image.imageUrl)}
        className="block w-full text-left relative group focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
        title={`View image: ${image.title}`}
      >
        <img src={image.imageUrl} alt={image.title} className="w-full object-cover rounded-lg shadow-lg border border-border-color" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-4">
          <p className="text-white text-lg font-bold drop-shadow-md">{image.title}</p>
        </div>
        <button
          onClick={handleRemoveClick}
          title="Remove bookmark"
          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-red-400 hover:text-red-300 transition-colors z-10 opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Remove image bookmark"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </button>
    </div>
  );
};


export const SavedView: React.FC<SavedViewProps> = ({ savedItems, onToggleBookmark, onViewArticle, onViewImage, customBackground }) => {
  const savedArticles = savedItems
    .filter((item): item is (RssArticle & { type: 'article' }) => item.type === 'article')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const savedImages = savedItems
    .filter((item): item is BookmarkedImage => item.type === 'image');

  const handleArticleBookmarkClick = (e: React.MouseEvent, article: RssArticle) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleBookmark({ ...article, type: 'article' });
  };
  
  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Bookmark className="w-8 h-8 text-accent flex-shrink-0" />
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold text-text-primary">Saved Items</h2>
              <p className="text-xl text-text-secondary">Your collection of saved articles and images.</p>
            </div>
          </div>
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
        </div>
        
        <Tile title={`Saved Articles (${savedArticles.length})`} icon={Newspaper} customBackground={customBackground}>
          {savedArticles.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 4xl:columns-7 5xl:columns-8 gap-6">
              {savedArticles.map((article, index) => (
                <ArticleCard
                  key={index}
                  article={article}
                  isBookmarked={true}
                  onBookmarkClick={(e) => handleArticleBookmarkClick(e, article)}
                  onViewArticle={() => onViewArticle(article)}
                  customBackground={customBackground}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
              <Newspaper className="mx-auto h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-2xl font-semibold text-text-primary">No Saved Articles</h3>
              <p className="text-lg text-text-secondary mt-1">Bookmark articles from the News tab to see them here.</p>
            </div>
          )}
        </Tile>

        <Tile title={`Saved Images (${savedImages.length})`} icon={ImageIcon} customBackground={customBackground}>
          {savedImages.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 3xl:columns-6 4xl:columns-7 5xl:columns-8 gap-6">
              {savedImages.map((image) => (
                <SavedImageCard
                  key={image.id}
                  image={image}
                  onRemove={() => onToggleBookmark(image)}
                  onViewImage={onViewImage}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
                <ImageIcon className="mx-auto h-12 w-12 text-text-secondary mb-4" />
                <h3 className="text-2xl font-semibold text-text-primary">No Saved Images</h3>
                <p className="text-lg text-text-secondary mt-1">Click on a poster in an anime's detail view to bookmark it.</p>
            </div>
          )}
        </Tile>
      </div>
    </div>
  );
};
