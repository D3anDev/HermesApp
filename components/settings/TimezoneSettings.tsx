import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { TimeSettings, ColonAnimation } from '../../types';
import { getTimezones, timezoneAliases } from '../../utils/time';
import { Clock } from '../misc/Clock';
import { Search, ChevronDown } from 'lucide-react';
import Fuse from 'fuse.js';

interface TimezoneSettingsProps {
  settings: TimeSettings;
  onUpdate: (newSettings: TimeSettings) => void;
}

interface TimezoneSearchItem {
    tz: string;
    searchText: string;
}

const colonAnimationOptions: { value: ColonAnimation; label: string }[] = [
    { value: 'none', label: 'Off' },
    { value: 'solid', label: 'Solid' },
    { value: 'blink', label: 'Blink' },
    { value: 'fade', label: 'Fade' },
    { value: 'pulse', label: 'Pulse' },
];

export const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ settings, onUpdate }) => {
  const [allTimezones, setAllTimezones] = useState<string[]>([]);
  const [fuse, setFuse] = useState<Fuse<TimezoneSearchItem> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [showFullResults, setShowFullResults] = useState(false);
  
  const [currentSettings, setCurrentSettings] = useState<TimeSettings>(settings);

  useEffect(() => {
    const tzRegions = getTimezones();
    const flatList = Object.values(tzRegions).flat().sort((a,b) => a.localeCompare(b));
    setAllTimezones(flatList);

    const searchData: TimezoneSearchItem[] = flatList.map(tz => ({
        tz,
        searchText: [tz.replace(/_/g, ' '), ...(timezoneAliases[tz] || [])].join(' ')
    }));
    
    const fuseInstance = new Fuse(searchData, {
        keys: ['searchText'],
        threshold: 0.3,
        includeScore: true,
    });
    setFuse(fuseInstance);
  }, []);
  
  useEffect(() => {
    onUpdate(currentSettings);
  }, [currentSettings, onUpdate]);
  
  useEffect(() => {
    setCurrentSettings(settings);
    setSearchTerm(settings.timezone.replace(/_/g, ' '));
  }, [settings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
        const isValidTimezone = allTimezones.some(tz => tz.replace(/_/g, ' ').toLowerCase() === searchTerm.toLowerCase());
        if (!isValidTimezone) {
            setSearchTerm(currentSettings.timezone.replace(/_/g, ' '));
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchWrapperRef, allTimezones, searchTerm, currentSettings.timezone]);


  const fuzzySearchResults = useMemo(() => {
    if (!fuse || !isSearchActive || !searchTerm || searchTerm.length < 2) return [];
    
    const normalizedCurrent = currentSettings.timezone.replace(/_/g, ' ').toLowerCase();
    if (searchTerm.toLowerCase() === normalizedCurrent) return [];

    return fuse.search(searchTerm).map(result => result.item.tz);
  }, [fuse, searchTerm, isSearchActive, currentSettings.timezone]);

  const displayedResults = useMemo(() => {
    if (showFullResults) {
        return fuzzySearchResults;
    }
    return fuzzySearchResults.slice(0, 3);
  }, [fuzzySearchResults, showFullResults]);


  const handleTimezoneSelect = (timezone: string) => {
    handleSettingChange('timezone', timezone);
    setSearchTerm(timezone.replace(/_/g, ' '));
    setIsSearchActive(false);
    setShowFullResults(false);
  };

  const handleSettingChange = (field: keyof TimeSettings, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setShowFullResults(true);
      setIsSearchActive(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setShowFullResults(false);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="flex-grow">
            <p className="text-text-secondary -mt-2 mb-6 text-lg">
                Choose your timezone and preferred display format.
            </p>

            <div className="space-y-6">
                <div className="relative" ref={searchWrapperRef}>
                    <label htmlFor="timezone-search" className="block text-lg font-medium text-text-secondary mb-1">Timezone</label>
                    <form onSubmit={handleSearchSubmit} className="relative flex">
                        <input
                            type="text"
                            id="timezone-search"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchActive(true)}
                            placeholder="Search for a city, region, or country..."
                            autoComplete="off"
                            className="w-full bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-l-md py-2 px-4 text-text-primary text-base"
                        />
                         <button 
                            type="submit"
                            aria-label="Search timezones"
                            className="px-4 py-2 bg-accent text-primary rounded-r-md hover:bg-blue-400 transition-colors flex items-center gap-2"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                    {isSearchActive && displayedResults.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-secondary border border-border-color rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-thin z-10">
                            {displayedResults.map(tz => (
                                <button
                                    key={tz}
                                    onClick={() => handleTimezoneSelect(tz)}
                                    className="w-full text-left px-4 py-2 text-text-primary hover:bg-accent/10 hover:text-accent text-base"
                                >
                                    {tz.replace(/_/g, ' ')}
                                </button>
                            ))}
                            {!showFullResults && fuzzySearchResults.length > 3 && (
                                <div className="px-4 py-2 text-sm text-text-secondary text-center border-t border-border-color">
                                    Press Enter or click Search for more results...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t border-border-color pt-6">
                    <h4 className="text-xl font-semibold text-text-primary mb-4">Time</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between min-h-[40px]">
                            <label className="text-text-primary cursor-pointer text-base">Time Format</label>
                            <div className="flex gap-2 p-1 bg-primary rounded-md border border-border-color">
                                <button
                                    onClick={() => handleSettingChange('format', '12h')}
                                    className={`px-3 py-1 rounded text-base ${currentSettings.format === '12h' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                >AM/PM</button>
                                <button
                                    onClick={() => handleSettingChange('format', '24h')}
                                    className={`px-3 py-1 rounded text-base ${currentSettings.format === '24h' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                >24-hour</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between min-h-[40px]">
                            <label htmlFor="show-seconds-toggle" className="text-text-primary cursor-pointer text-base">Show seconds</label>
                            <button
                                id="show-seconds-toggle"
                                onClick={() => handleSettingChange('showSeconds', !currentSettings.showSeconds)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSettings.showSeconds ? 'bg-accent' : 'bg-border-color'}`}
                                role="switch"
                                aria-checked={currentSettings.showSeconds}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSettings.showSeconds ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between min-h-[40px]">
                            <label htmlFor="colon-animation-select" className="text-text-primary cursor-pointer text-base">Separator Animation</label>
                            <div className="relative">
                                <select
                                    id="colon-animation-select"
                                    value={currentSettings.colonAnimation}
                                    onChange={(e) => handleSettingChange('colonAnimation', e.target.value as ColonAnimation)}
                                    className="w-32 appearance-none bg-primary border border-border-color focus:border-accent focus:ring-0 rounded-md py-2 px-3 text-text-primary text-base"
                                >
                                    {colonAnimationOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border-color pt-6">
                     <h4 className="text-xl font-semibold text-text-primary mb-4">Date</h4>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between min-h-[40px]">
                            <label htmlFor="show-date-toggle" className="text-text-primary cursor-pointer text-base">Show date</label>
                            <button
                                id="show-date-toggle"
                                onClick={() => handleSettingChange('showDate', !currentSettings.showDate)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSettings.showDate ? 'bg-accent' : 'bg-border-color'}`}
                                role="switch"
                                aria-checked={currentSettings.showDate}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSettings.showDate ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        <div className={`space-y-4 transition-opacity ${!currentSettings.showDate ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center justify-between min-h-[40px]">
                                <label className="text-text-primary cursor-pointer text-base">Date Format</label>
                                <div className="flex gap-2 p-1 bg-primary rounded-md border border-border-color">
                                    <button
                                        onClick={() => handleSettingChange('dateFormat', 'month-day')}
                                        disabled={!currentSettings.showDate}
                                        className={`px-3 py-1 rounded text-base ${currentSettings.dateFormat === 'month-day' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                    >Long</button>
                                    <button
                                        onClick={() => handleSettingChange('dateFormat', 'numeric')}
                                        disabled={!currentSettings.showDate}
                                        className={`px-3 py-1 rounded text-base ${currentSettings.dateFormat === 'numeric' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                    >Numeric</button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between min-h-[40px]">
                                <label className="text-text-primary cursor-pointer text-base">Show year</label>
                                <button
                                    onClick={() => handleSettingChange('showYear', !currentSettings.showYear)}
                                    disabled={!currentSettings.showDate}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${currentSettings.showYear ? 'bg-accent' : 'bg-border-color'}`}
                                    role="switch"
                                    aria-checked={currentSettings.showYear}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${currentSettings.showYear ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className={`transition-opacity ${currentSettings.dateFormat !== 'numeric' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex items-center justify-between min-h-[40px]">
                                    <label className="text-text-primary text-base">Numeric Format</label>
                                    <div className="flex gap-2 p-1 bg-primary rounded-md border border-border-color">
                                        <button
                                            onClick={() => handleSettingChange('numericDateStyle', 'md')}
                                            disabled={currentSettings.dateFormat !== 'numeric' || !currentSettings.showDate}
                                            className={`px-3 py-1 rounded text-base ${currentSettings.numericDateStyle === 'md' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                        >MM/DD</button>
                                        <button
                                            onClick={() => handleSettingChange('numericDateStyle', 'dm')}
                                            disabled={currentSettings.dateFormat !== 'numeric' || !currentSettings.showDate}
                                            className={`px-3 py-1 rounded text-base ${currentSettings.numericDateStyle === 'dm' ? 'bg-accent text-primary' : 'text-text-secondary'}`}
                                        >DD/MM</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </div>
        
        <div className="mt-auto pt-6 border-t border-border-color flex-shrink-0">
            <p className="text-lg text-text-secondary mb-2 text-center">Live Preview</p>
            <div className="flex justify-center items-center h-48 bg-primary rounded-lg border border-dashed border-border-color p-4">
              <Clock {...currentSettings} />
            </div>
        </div>
    </div>
  );
};