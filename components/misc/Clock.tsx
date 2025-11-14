import React, { useState, useEffect } from 'react';
import type { ColonAnimation } from '../../types';

interface ClockProps {
  timezone: string;
  format: '12h' | '24h';
  showSeconds: boolean;
  colonAnimation: ColonAnimation;
  showDate: boolean;
  dateFormat: 'month-day' | 'numeric';
  showYear: boolean;
  numericDateStyle: 'md' | 'dm';
  className?: string;
}

export const Clock: React.FC<ClockProps> = ({ timezone, format, showSeconds, colonAnimation, showDate, showYear, className = '' }) => {
  const [timeParts, setTimeParts] = useState({ hour: '', minute: '', second: '', period: '' });
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const timeOptions: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          hour12: format === '12h',
          hour: '2-digit',
          minute: '2-digit',
          ...(showSeconds && { second: '2-digit' }),
        };
        const timeFormatter = new Intl.DateTimeFormat('en-US', timeOptions);
        const parts = timeFormatter.formatToParts(now);

        setTimeParts({
            hour: parts.find(p => p.type === 'hour')?.value || '00',
            minute: parts.find(p => p.type === 'minute')?.value || '00',
            second: parts.find(p => p.type === 'second')?.value || '',
            period: parts.find(p => p.type === 'dayPeriod')?.value || '',
        });

        if (showDate) {
            const dateOptions: Intl.DateTimeFormatOptions = {
                timeZone: timezone,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                ...(showYear && { year: 'numeric' }),
            };
            setDateString(new Intl.DateTimeFormat('en-US', dateOptions).format(now));
        }

      } catch (e) {
        console.error("Invalid timezone for clock:", timezone);
        setTimeParts({ hour: 'XX', minute: 'XX', second: '', period: '' });
        setDateString('Invalid Date');
      }
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [timezone, format, showSeconds, showDate, showYear]);
  
  const animatedAnims: ColonAnimation[] = ['blink', 'fade', 'pulse'];
  const colonAnimationClass = animatedAnims.includes(colonAnimation) ? `animate-${colonAnimation}-colon` : '';
  const colonClass = `text-6xl lg:text-7xl font-bold tracking-tight ${colonAnimationClass}`;
  const numberClass = "text-7xl lg:text-8xl font-bold tracking-tight";

  return (
    <div className={`flex flex-col items-end text-right font-sans ${className}`}>
        <div className="flex items-baseline text-text-primary">
            <span className={numberClass}>{timeParts.hour}</span>
            {colonAnimation !== 'none' && <span className={colonClass}>:</span>}
            <span className={numberClass}>{timeParts.minute}</span>
            {showSeconds && timeParts.second && (
                <>
                    {colonAnimation !== 'none' && <span className={colonClass}>:</span>}
                    <span className={numberClass}>{timeParts.second}</span>
                </>
            )}
            {timeParts.period && (
                <p className="text-xl md:text-2xl font-medium text-text-secondary/80 ml-4 self-end pb-2">{timeParts.period}</p>
            )}
        </div>
        {showDate && (
            <p className="text-xl lg:text-2xl text-text-secondary tracking-wide -mt-2">{dateString}</p>
        )}
    </div>
  );
};