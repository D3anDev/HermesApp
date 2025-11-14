import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import type { Anime } from '../../types';
import { WatchStatus } from '../../types';
import { CalendarDays } from 'lucide-react';

interface UpcomingCalendarProps {
  animeList: Anime[];
  onViewDetails: (anime: Anime) => void;
  onScrollUpdate: (progress: number) => void;
}

const getStatusStyles = (item: Anime): { text: string; className: string } => {
  if (item.mediaStatus === 'RELEASING') {
    return { text: "Airing Now", className: "text-green-400" };
  }
  if (item.mediaStatus === 'NOT_YET_RELEASED') {
    if (item.startDate?.year) {
      return { text: `Premieres ${item.startDate.year}`, className: "text-accent" };
    }
    return { text: "TBD", className: "text-text-secondary" };
  }
  if (!item.mediaStatus && item.totalEpisodes === 0) {
      return { text: "TBD", className: "text-text-secondary" };
  }
  return { text: "Upcoming", className: "text-text-secondary" };
};

const UpcomingListItem: React.FC<{ anime: Anime; onViewDetails: (anime: Anime) => void; }> = ({ anime, onViewDetails }) => {
    const status = getStatusStyles(anime);

    return (
        <button
            onClick={() => onViewDetails(anime)}
            className="w-full text-left group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent rounded-lg flex gap-4 p-2 transition-colors bg-primary hover:bg-border-color border border-border-color"
        >
            <div className="w-16 h-24 flex-shrink-0 bg-border-color rounded-md overflow-hidden">
                <img src={anime.posterUrl} alt={anime.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="py-1 flex flex-col justify-center min-w-0">
                <h3 className="font-bold text-lg text-text-primary truncate transition-colors group-hover:text-accent">{anime.title}</h3>
                <p className="text-base text-text-secondary">{anime.format || 'Unknown Format'}</p>
                <p className={`text-base font-semibold mt-1 ${status.className}`}>{status.text}</p>
            </div>
        </button>
    );
};

export const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({ animeList, onViewDetails, onScrollUpdate }) => {
  const upcomingList = useMemo(() => {
    const currentlyAiring = animeList
      .filter(a => a.status === WatchStatus.Watching && a.mediaStatus === 'RELEASING')
      .sort((a, b) => (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10));

    const planToWatchFuture = animeList
      .filter(a => 
        a.status === WatchStatus.PlanToWatch && 
        (a.mediaStatus === 'NOT_YET_RELEASED' || (!a.mediaStatus && a.totalEpisodes === 0))
      )
      .sort((a, b) => {
        const yearA = a.startDate?.year || 9999;
        const yearB = b.startDate?.year || 9999;
        if (yearA !== yearB) return yearA - yearB;
        return (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10);
      });
      
    return [...currentlyAiring, ...planToWatchFuture];
  }, [animeList]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight <= clientHeight) {
            onScrollUpdate(100); // If not scrollable, show full bar
            return;
        }
        const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        onScrollUpdate(progress);
    }
  }, [onScrollUpdate]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Initial check
    const timeoutId = setTimeout(handleScroll, 50);

    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(el);
    
    return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
    }
  }, [upcomingList, handleScroll]);

  if (upcomingList.length === 0) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <CalendarDays className="w-16 h-16 text-text-secondary mb-4" />
            <p className="text-2xl text-text-primary font-medium">Nothing on the Horizon</p>
            <p className="text-lg text-text-secondary/70 mt-1">
              Currently airing shows you're watching and unreleased shows you plan to watch will appear here.
            </p>
        </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="absolute inset-0 flex flex-col gap-2 overflow-y-auto no-scrollbar"
    >
        {upcomingList.map(item => (
            <UpcomingListItem
                key={item.id}
                anime={item}
                onViewDetails={onViewDetails}
            />
        ))}
    </div>
  );
};