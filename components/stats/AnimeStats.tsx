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

const statusHexColors: Record<WatchStatus, string> = {
  [WatchStatus.Watching]: '#4ade80', // green-400
  [WatchStatus.Completed]: '#3b82f6', // blue-500
  [WatchStatus.OnHold]: '#facc15',   // yellow-400
  [WatchStatus.Dropped]: '#ef4444',  // red-500
  [WatchStatus.PlanToWatch]: '#9ca3af', // gray-400
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

interface StatusRingChartProps {
  statusCounts: Record<WatchStatus, number>;
  totalEntries: number;
  statusColors: Record<WatchStatus, string>;
  statusOrder: WatchStatus[];
}

const StatusRingChart: React.FC<StatusRingChartProps> = ({ statusCounts, totalEntries, statusColors, statusOrder }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 10;
  const viewBoxSize = 100;
  const center = viewBoxSize / 2;

  // If there are no segments, display a full gray circle
  if (totalEntries === 0) {
    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-700"
          />
        </svg>
        <div className="absolute text-text-primary text-2xl font-bold">
          {totalEntries}
        </div>
      </div>
    );
  }

  let cumulativePercentage = 0;

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        {/* Background circle to show if there are no entries or for a full ring effect */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border-color"
        />
        {statusOrder.map((status, index) => {
          const count = statusCounts[status] || 0;
          const percentage = totalEntries > 0 ? count / totalEntries : 0;

          if (percentage === 0) return null;

          const dashoffset = circumference * (1 - cumulativePercentage);
          const dasharray = circumference * percentage;
          
          cumulativePercentage += percentage;

          const strokeColor = statusHexColors[status]; 

          return (
            <circle
              key={status}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dasharray} ${circumference - dasharray}`}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${center} ${center})`} // Start from top
              className="transition-all duration-300 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute text-text-primary text-2xl font-bold">
        {totalEntries}
      </div>
    </div>
  );
};

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
      
      <div className="mt-3 flex flex-col lg:flex-row gap-3 items-stretch">
        {stats && (
          <div className="bg-primary p-3 rounded-lg flex items-center justify-center flex-shrink-0 w-full max-w-[12rem] aspect-square">
            <StatusRingChart
              statusCounts={stats.statusCounts}
              totalEntries={stats.totalEntries}
              statusColors={statusColors}
              statusOrder={statusOrder}
            />
          </div>
        )}
        {/* Placeholder for the legend */}
        <div className="flex-1">
            <div className="bg-primary p-3 rounded-lg">
                <div className="flex flex-col gap-0"> {/* Changed to flex-col to stack buttons and allow full-width separators */}
                    {statusOrder.map((status, index) => {
                        const count = stats.statusCounts[status] || 0;
                        const percentage = stats.totalEntries > 0 ? (count / stats.totalEntries) * 100 : 0;
                        return (
                            <React.Fragment key={status}>
                                <button 
                                    onClick={() => onViewListByStatus(status)}
                                    className="flex items-center justify-between w-full p-2 rounded-md transition-colors duration-200 hover:bg-hover-fill-color focus:outline-none focus:ring-2 focus:ring-accent"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                                        <span className="text-text-primary text-sm">{status}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                                                            <span className={`text-text-secondary text-sm ${statusTextColors[status]}`}>{count}</span>
                                                                            <span className={`text-text-secondary text-sm font-semibold ${statusTextColors[status]}`}>{percentage.toFixed(1)}%</span>                                    </div>
                                </button>
                                {index < statusOrder.length - 1 && (
                                    <div className="border-b border-border-color w-full my-1"></div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
      



    </div>
  );
};