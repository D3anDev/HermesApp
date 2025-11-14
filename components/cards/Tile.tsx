import React from 'react';
import type { CustomBackgroundSettings } from '../../types';

interface TileProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
  customBackground: CustomBackgroundSettings;
  headerClassName?: string;
  scrollProgress?: number;
}

export const Tile = React.forwardRef<HTMLDivElement, TileProps>(({ title, icon: Icon, children, className = '', headerExtra, customBackground, headerClassName, scrollProgress }, ref) => {
  const tileStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };
  
  return (
    <div
      ref={ref}
      className={`p-4 rounded-lg border border-border-color flex flex-col ${className}`}
      style={tileStyle}
    >
      {title && (
        <div className={`flex justify-between items-center ${scrollProgress !== undefined ? 'mb-2' : 'mb-4'} flex-shrink-0 ${headerClassName}`}>
          <div className="flex items-center gap-3 min-w-0">
            {Icon && <Icon className="w-6 h-6 text-accent flex-shrink-0" />}
            <h3 className="text-lg font-bold text-text-primary truncate">{title}</h3>
          </div>
          {headerExtra && <div className="flex-shrink-0">{headerExtra}</div>}
        </div>
      )}
      {scrollProgress !== undefined && (
        <div className="w-full bg-border-color rounded-full h-1 mb-2 flex-shrink-0">
            <div
                className="bg-accent h-1 rounded-full"
                style={{ width: `${scrollProgress}%`, transition: 'width 150ms ease-out' }}
            ></div>
        </div>
      )}
      <div className="flex flex-col flex-grow min-h-0 relative">
        {children}
      </div>
    </div>
  );
});

Tile.displayName = 'Tile';