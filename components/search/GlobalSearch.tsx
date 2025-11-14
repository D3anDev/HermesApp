// components/StorageUsageView.tsx
import React, { useState, useEffect } from 'react';
import { Database, Trash2, RotateCw } from 'lucide-react';
import { ANIME_LIST_KEY, ANIME_DETAILS_CACHE_KEY, RSS_FEEDS_KEY, TIME_SETTINGS_KEY, CUSTOM_BACKGROUND_KEY, LIVE_EFFECT_KEY, UNRESOLVED_ANIME_IDS_KEY, BOOKMARKED_ITEMS_KEY, MAL_TOKENS_KEY, MAL_CLIENT_ID_KEY } from '../../utils/cache';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { CustomBackgroundSettings } from '../../types';

// --- Utility Functions (kept in-component to avoid creating new files) ---

interface StorageBreakdown {
  listData: number;
  detailsCache: number;
  bookmarks: number;
  appSettings: number;
}

interface StorageUsage {
  total: number;
  breakdown: StorageBreakdown;
}

const keysToCategorize = {
  listData: [ANIME_LIST_KEY],
  detailsCache: [ANIME_DETAILS_CACHE_KEY],
  bookmarks: [BOOKMARKED_ITEMS_KEY],
  appSettings: [
    RSS_FEEDS_KEY, TIME_SETTINGS_KEY, CUSTOM_BACKGROUND_KEY,
    LIVE_EFFECT_KEY, UNRESOLVED_ANIME_IDS_KEY, MAL_TOKENS_KEY, MAL_CLIENT_ID_KEY
  ],
};

const getLocalStorageItemSize = (key: string): number => {
  const item = localStorage.getItem(key);
  if (!item) return 0;
  return new Blob([item]).size;
};

const calculateStorageUsage = (): StorageUsage => {
  const breakdown: StorageBreakdown = { listData: 0, detailsCache: 0, bookmarks: 0, appSettings: 0 };
  Object.entries(keysToCategorize).forEach(([category, keys]) => {
    const totalSize = keys.reduce((acc, key) => acc + getLocalStorageItemSize(key), 0);
    breakdown[category as keyof StorageBreakdown] = totalSize;
  });
  const total = Object.values(breakdown).reduce((acc, size) => acc + size, 0);
  return { total, breakdown };
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// --- Component ---

interface StorageUsageViewProps {
  onClearDetailsCache: () => void;
  refreshTrigger: number; // A prop to trigger recalculation
  customBackground?: CustomBackgroundSettings;
}

const breakdownInfo = [
  { key: 'detailsCache', label: 'Details & Images Cache', color: 'bg-accent', description: 'Cached anime metadata, images, and relations. Clearing this is safe; data will be re-fetched as needed.' },
  { key: 'listData', label: 'Anime List Data', color: 'bg-green-500', description: 'Your core anime list and progress. Managed via import/export.' },
  { key: 'bookmarks', label: 'Bookmarks', color: 'bg-yellow-500', description: 'Your saved news articles and images.' },
  { key: 'appSettings', label: 'App Settings', color: 'bg-purple-500', description: 'Your preferences for appearance, news feeds, and time settings.' },
];

export const StorageUsageView: React.FC<StorageUsageViewProps> = ({ onClearDetailsCache, refreshTrigger, customBackground }) => {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  useEffect(() => {
    setUsage(calculateStorageUsage());
  }, [refreshTrigger]);

  const handleRecalculate = () => {
    setUsage(calculateStorageUsage());
  };
  
  const handleConfirmClear = () => {
    onClearDetailsCache();
    setIsConfirmingClear(false);
    // Give localStorage a moment to update before recalculating
    setTimeout(() => handleRecalculate(), 500);
  };

  if (!usage) {
    return null; // Or a loading state
  }
  
  const totalUsed = usage.total;

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center -mt-4">
          <p className="text-text-secondary mt-2 mb-6 text-lg">
              An overview of the space used by the application's cached data.
          </p>
          <button onClick={handleRecalculate} className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-accent/10 transition-colors" title="Recalculate Usage">
              <RotateCw size={16} />
          </button>
        </div>

        <div className="flex items-baseline gap-4 mb-2">
            <span className="text-5xl font-bold text-accent">{formatBytes(totalUsed)}</span>
            <span className="text-xl text-text-secondary">used</span>
        </div>
        
        <div className="mt-6 space-y-4">
            <h4 className="text-xl font-semibold text-text-primary">Breakdown</h4>
            <div className="w-full bg-primary rounded-full h-4 flex overflow-hidden border border-border-color">
                {breakdownInfo.map(({ key, color, label }) => {
                    const value = usage.breakdown[key as keyof StorageBreakdown];
                    if (value === 0 || totalUsed === 0) return null;
                    const percentage = (value / totalUsed) * 100;
                    return (
                        <div key={key} className={`${color} h-full`} style={{ width: `${percentage}%` }} title={`${label}: ${formatBytes(value)}`} />
                    );
                })}
            </div>
            <div className="space-y-3">
                 {breakdownInfo.map(({ key, label, color, description }) => {
                    const value = usage.breakdown[key as keyof StorageBreakdown];
                    if (value === 0) return null;
                    return (
                        <div key={key} className="flex items-start gap-4 text-base">
                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${color}`} />
                            <div className="flex-grow">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-primary font-medium">{label}</span>
                                    <span className="font-mono text-text-secondary">{formatBytes(value)}</span>
                                </div>
                                <p className="text-sm text-text-secondary/80">{description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border-color">
             <button
                onClick={() => setIsConfirmingClear(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-base font-semibold bg-yellow-900/50 text-yellow-300 rounded-md hover:bg-yellow-900/70 transition-colors"
             >
                <Trash2 size={16} />
                <span>Clear Details & Images Cache</span>
            </button>
        </div>
      </div>
      {isConfirmingClear && (
        <ConfirmationModal
          isOpen={isConfirmingClear}
          onClose={() => setIsConfirmingClear(false)}
          onConfirm={handleConfirmClear}
          title="Clear Cache?"
          message={
            <div className="space-y-2">
              <p>Are you sure you want to clear the <strong className="text-text-primary">Details & Images Cache</strong>?</p>
              <p>This action is safe and will not delete your anime list progress. All metadata and images will be re-fetched from the internet as needed, which may take some time.</p>
            </div>
          }
          confirmText="Yes, Clear Cache"
          isDestructive
          customBackground={customBackground}
        />
      )}
    </>
  );
};
