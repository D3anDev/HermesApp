
import React, { useMemo, useState, useEffect } from 'react';
import type { Anime } from '../../types';
import { PieChart as PieChartIcon } from 'lucide-react';

// A predefined color palette for the chart slices
const GENRE_COLORS = [
  '#58A6FF', '#1F6FEB', '#3FB950', '#F778BA', '#F0883E',
  '#A371F7', '#79C0FF', '#C9D1D9', '#E6EDF3', '#484F58'
];

interface GenreData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface GenreDistributionProps {
  animeList: Anime[];
}

const DonutSegment: React.FC<{
  item: GenreData;
  startAngle: number;
  endAngle: number;
  isHovered: boolean;
  onHover: (name: string | null) => void;
}> = ({ item, startAngle, endAngle, isHovered, onHover }) => {
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  const innerRadius = 40;
  const outerRadius = 48;
  const radius = (innerRadius + outerRadius) / 2;
  const strokeWidth = outerRadius - innerRadius;


  // Adjust angles for gaps
  const gap = 0;
  const effectiveStartAngle = startAngle + gap / 2;
  const effectiveEndAngle = endAngle - gap / 2;

  // Use the middle radius for the arc path
  const arc = describeArc(50, 50, radius, effectiveStartAngle, effectiveEndAngle);
  const pathLength = 2 * Math.PI * radius * ((effectiveEndAngle - effectiveStartAngle) / 360);

  return (
    <path
      d={arc}
      fill="none"
      stroke={item.color}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      onMouseEnter={() => onHover(item.name)}
      onMouseLeave={() => onHover(null)}
      className="transition-all duration-300"
      style={{
        transformOrigin: '50% 50%',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        filter: isHovered ? 'url(#glow)' : 'none',
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
        animation: 'draw-arc 1s ease-out forwards',
      }}
    />
  );
};


export const GenreDistribution: React.FC<GenreDistributionProps> = ({ animeList }) => {
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const { genreData, totalCount } = useMemo(() => {
    if (!animeList || animeList.length === 0) return { genreData: [], totalCount: 0 };

    const genreCounts: Record<string, number> = {};
    let validEntries = 0;
    animeList.forEach(anime => {
      if (anime.genres && anime.genres.length > 0) {
        validEntries++;
        anime.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    if (Object.keys(genreCounts).length === 0) return { genreData: [], totalCount: 0 };

    const sortedGenres = Object.entries(genreCounts).sort(([, a], [, b]) => b - a);
    const topGenres = sortedGenres.slice(0, 9);
    const otherCount = sortedGenres.slice(9).reduce((sum, [, count]) => sum + count, 0);
    const totalDistributionCount = topGenres.reduce((sum, [, count]) => sum + count, 0) + otherCount;

    let chartData: GenreData[] = topGenres.map(([name, value], index) => ({
      name,
      value,
      percentage: (value / totalDistributionCount) * 100,
      color: GENRE_COLORS[index % GENRE_COLORS.length],
    }));

    if (otherCount > 0) {
      chartData.push({
        name: 'Other',
        value: otherCount,
        percentage: (otherCount / totalDistributionCount) * 100,
        color: GENRE_COLORS[9 % GENRE_COLORS.length],
      });
    }

    return { genreData: chartData, totalCount: animeList.length };
  }, [animeList]);
  
  const hoveredData = useMemo(() => {
    return genreData.find(d => d.name === hoveredGenre);
  }, [hoveredGenre, genreData]);

  if (genreData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 h-full min-h-[300px]">
        <PieChartIcon className="w-16 h-16 text-text-secondary mb-4" />
        <p className="text-xl text-text-primary font-medium">No Genre Data</p>
        <p className="text-base text-text-secondary/70 mt-1">Add anime with genres to see your distribution.</p>
      </div>
    );
  }

  let cumulativeAngle = 0;

  return (
    <div className="flex flex-col md:flex-row h-full items-center justify-center gap-6">
      <style>{`
        @keyframes draw-arc {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <defs>
            <filter id="glow">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgba(255, 255, 255, 0.3)" />
            </filter>
          </defs>
          {genreData.map((item) => {
            const angle = item.percentage * 3.6;
            const startAngle = cumulativeAngle;
            cumulativeAngle += angle;
            const endAngle = cumulativeAngle;
            return (
              <DonutSegment
                key={item.name}
                item={item}
                startAngle={startAngle}
                endAngle={endAngle}
                isHovered={hoveredGenre === item.name}
                onHover={setHoveredGenre}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
           <div className={`transition-opacity duration-200 ${hoveredData ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-3xl font-bold text-text-primary truncate max-w-[120px]">
                  {hoveredData?.percentage.toFixed(1)}%
              </p>
              <p className="text-base text-text-primary font-semibold truncate max-w-[120px]">{hoveredData?.name}</p>
              <p className="text-sm text-text-secondary">({hoveredData?.value} entries)</p>
           </div>
           <div className={`absolute transition-opacity duration-200 ${hoveredData ? 'opacity-0' : 'opacity-100'}`}>
               <p className="text-3xl font-bold text-text-primary">{totalCount}</p>
               <p className="text-base text-text-secondary">Total Entries</p>
           </div>
        </div>
      </div>
      <div className="w-full max-w-xs overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 text-base">
          {genreData.map(item => (
            <li
              key={item.name}
              onMouseEnter={() => setHoveredGenre(item.name)}
              onMouseLeave={() => setHoveredGenre(null)}
              className={`flex items-center gap-3 px-3 py-1 rounded-md transition-colors duration-200 cursor-pointer ${hoveredGenre === item.name ? 'bg-accent/10' : ''}`}
            >
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className={`text-base ${hoveredGenre === item.name ? 'text-text-primary' : 'text-text-secondary'}`}>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
