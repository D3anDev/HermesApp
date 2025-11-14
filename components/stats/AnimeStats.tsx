import React, { useMemo } from 'react';
import type { Anime } from '../../types';
import { WatchStatus } from '../../types';
import { Clapperboard, Film, Clock, Star } from 'lucide-react';

interface AnimeStatsProps {
  animeList: Anime[];
  onViewListByStatus: (status: WatchStatus) => void;
  useAbbreviations?: boolean;
}

const statusColors: Record<WatchStatus, string> = {
  [WatchStatus.Watching]: 'bg-green-500',
  [WatchStatus.Completed]: 'bg-blue-600',
  [WatchStatus.OnHold]: 'bg-yellow-500',
  [WatchStatus.Dropped]: 'bg-red-600',
  [WatchStatus.PlanToWatch]: 'bg-gray-400',
};

const statusTextColors: Record<WatchStatus, string> = {
  [WatchStatus.Watching]: 'text-green-400',
  [WatchStatus.Completed]: 'text-blue-400',
  [WatchStatus.OnHold]: 'text-yellow-400',
  [WatchStatus.Dropped]: 'text-red-400',
  [WatchStatus.PlanToWatch]: 'text-gray-300',
};

const statusOrder = [
  WatchStatus.Watching,
  WatchStatus.Completed,
  WatchStatus.OnHold,
  WatchStatus.Dropped,
  WatchStatus.PlanToWatch,
];

const MetricItem: React.FC<{ icon: React.ElementType; value: string | number; label: string; shortLabel: string; useAbbreviations?: boolean; }> = ({ icon: Icon, value, label, shortLabel, useAbbreviations }) => (
    <div className="flex items-center gap-3 bg-primary p-3 rounded-lg">
        <div className="bg-border-color p-2 rounded-md flex-shrink-0">
            <Icon className="w-5 h-5 text-accent" />
        </div>
        <div className="min-w-0">
            <p className="font-bold text-lg text-text-primary leading-tight truncate">{String(value)}</p>
            <p className="text-sm text-text-secondary truncate">{useAbbreviations ? shortLabel : label}</p>
        </div>
    </div>
);

export const AnimeStats: React.FC<AnimeStatsProps> = ({ animeList, onViewListByStatus, useAbbreviations = false }) => {
  const stats = useMemo(() => {
    if (!animeList || animeList.length === 0) return null;

    const statusCounts = animeList.reduce((acc, anime) => {
      acc[anime.status] = (acc[anime.status] || 0) + 1;
      return acc;
    }, {} as Record<WatchStatus, number>);

    const totalEpisodes = animeList.reduce((sum, anime) => sum + anime.episodesWatched, 0);
    const days = (totalEpisodes * 24) / (60 * 24); 
    
    let totalScore = 0;
    let ratedCount = 0;
    animeList.forEach(anime => {
      if (anime.score > 0) {
        totalScore += anime.score;
        ratedCount++;
      }
    });
    const overallAverageUserScore = ratedCount > 0 ? (totalScore / ratedCount).toFixed(1) : 'N/A';

    return {
      days: parseFloat(days.toFixed(1)),
      totalEntries: animeList.length,
      totalEpisodes,
      statusCounts,
      overallAverageUserScore,
    };
  }, [animeList]);

  if (!stats) return null;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <MetricItem icon={Clapperboard} value={stats.totalEntries} label="Total Entries" shortLabel="Entries" useAbbreviations={useAbbreviations} />
        <MetricItem icon={Film} value={stats.totalEpisodes.toLocaleString()} label="Episodes Watched" shortLabel="Episodes" useAbbreviations={useAbbreviations} />
        <MetricItem icon={Clock} value={stats.days} label="Days Watched" shortLabel="Days" useAbbreviations={useAbbreviations} />
        <MetricItem icon={Star} value={stats.overallAverageUserScore} label="Your Avg. Score" shortLabel="Avg. Score" useAbbreviations={useAbbreviations} />
      </div>
      
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-text-primary mb-3">Overall List Progress</h4>
        <div className="w-full bg-border-color rounded-full h-3 lg:h-5 flex overflow-hidden transition-all duration-300">
          {statusOrder.map((status) => {
            const count = stats.statusCounts[status] || 0;
            const percentage = stats.totalEntries > 0 ? (count / stats.totalEntries) * 100 : 0;
            if (percentage === 0) return null;
            return (
              <div
                key={status}
                className={`${statusColors[status]} h-full transition-all duration-300`}
                style={{ width: `${percentage}%` }}
                title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={stats.totalEntries}
                aria-valuetext={`${status} status, ${count} entries`}
              ></div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
          <h4 className="text-lg font-semibold text-text-primary mb-4">List Distribution</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {statusOrder.map(status => {
                  const count = stats.statusCounts[status] || 0;
                  const percentage = stats.totalEntries > 0 ? (count / stats.totalEntries) * 100 : 0;
                  if (count === 0) return null;
                  return (
                      <button 
                          key={status} 
                          onClick={() => onViewListByStatus(status)}
                          className="flex flex-col bg-primary p-3 md:p-4 rounded-lg border border-border-color text-left hover:bg-border-color transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                          <div className="flex items-center gap-2 mb-1">
                              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                              <span className={`text-sm ${statusTextColors[status]}`}>{status}</span>
                          </div>
                          <div className="flex flex-col xs:flex-row items-baseline justify-between flex-wrap">
                              <span className={`text-xl xs:text-base sm:text-lg lg:text-xl font-bold ${statusTextColors[status]}`}>{count}</span>
                              <span className="text-xs sm:text-base text-text-secondary whitespace-nowrap">{percentage.toFixed(1)}%</span>
                          </div>
                      </button>
                  );
              })}
          </div>
      </div>
    </div>
  );
};