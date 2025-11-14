import React from 'react';
import type { ViewType, CustomBackgroundSettings } from '../../types';
import { Home, List, Compass, Settings, ChevronLeft, ChevronRight, Bookmark, RefreshCw, X, Download, Wind, Info, AlertTriangle } from 'lucide-react';

interface FetchProgress {
  total: number;
  current: number;
  fetchingTitle: string;
  inProgress: boolean;
}

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  userProfile: {
    username: string;
    profilePic: string;
  };
  onRefresh: () => void;
  fetchProgress: FetchProgress;
  onLogViewToggle: () => void;
  onStopFetching: () => void;
  customBackground: CustomBackgroundSettings;
  isMalConnected: boolean;
  isRateLimited: boolean;
  rateLimitSeconds: number;
  isNetworkError: boolean;
  networkErrorCountdown: { current: number; initial: number };
}

const NavItem: React.FC<{
  icon?: React.ElementType; // Make icon optional
  imgSrc?: string; // Add imgSrc prop
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}> = ({ icon: Icon, imgSrc, label, isActive, isCollapsed, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={isCollapsed ? label : ''}
      className={`flex items-center w-full text-base font-medium rounded-lg transition-colors duration-200 overflow-hidden whitespace-nowrap p-3 h-16 ${
        isCollapsed ? 'justify-center' : 'justify-start'
      } ${
        isActive
          ? 'bg-accent/10 text-accent'
          : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
      }`}
    >
      {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
      {imgSrc && <img src={imgSrc} alt={label} className="w-6 h-6 flex-shrink-0 rounded-full object-cover" />}
      <span
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-w-0 ml-0 opacity-0' : 'max-w-xs ml-4 opacity-100'
        }`}
      >
        {label}
      </span>
    </button>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isCollapsed, onToggle, userProfile, onRefresh, fetchProgress, onLogViewToggle, onStopFetching, customBackground, isMalConnected, isRateLimited, rateLimitSeconds, isNetworkError, networkErrorCountdown }) => {
  const mainNavItems: { id: ViewType; label: string; icon?: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'my-list', label: 'My List', icon: List },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];
  
  const profileNavItem = { id: 'profile', label: 'Profile' };

  const secondaryNavItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info },
  ];

  const CollapseIcon = isCollapsed ? ChevronRight : ChevronLeft;
  const progressPercentage = fetchProgress.total > 0 ? (fetchProgress.current / fetchProgress.total) * 100 : 0;

  const sidebarStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };
  
  const circumference = 2 * Math.PI * 18; // r=18 for a 40x40 viewbox
  
  const rateLimitProgress = rateLimitSeconds / 60;
  const rateLimitStrokeDashoffset = circumference * (1 - rateLimitProgress);

  const { current: networkSeconds, initial: networkInitial } = networkErrorCountdown;
  const networkErrorProgress = networkInitial > 0 ? networkSeconds / networkInitial : 0;
  const networkStrokeDashoffset = circumference * (1 - networkErrorProgress);


  return (
    <nav 
      className={`flex flex-col justify-between border-r border-border-color p-3 transition-all duration-300 ${isCollapsed ? 'w-[88px]' : 'w-56'}`}
      style={sidebarStyle}
    >
      <div>
        <div
          className={`flex items-center w-full text-left rounded-lg transition-colors duration-200 overflow-hidden whitespace-nowrap text-text-primary h-[56px] ${
            isCollapsed ? 'justify-center' : 'px-4'
          }`}
        >
          <Wind className={`flex-shrink-0 text-accent transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-8 h-8'}`} />
          <div className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100 ml-3'}`}>
            <span
              className="block text-3xl font-bold tracking-tighter"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Hermes
            </span>
          </div>
        </div>
        <div className="border-b border-border-color my-3"></div>
        <div className="space-y-2 mt-2">
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.id}
              isCollapsed={isCollapsed}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
          <NavItem
              key={profileNavItem.id}
              imgSrc={userProfile.profilePic}
              label={profileNavItem.label}
              isActive={currentView === profileNavItem.id}
              isCollapsed={isCollapsed}
              onClick={() => setCurrentView(profileNavItem.id)}
          />
          <div className="border-b border-border-color my-3"></div>
           {secondaryNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.id}
              isCollapsed={isCollapsed}
              onClick={() => setCurrentView(item.id)}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="space-y-1">
           <button
            disabled={!isMalConnected}
            title={isCollapsed ? 'Sync with MyAnimeList' : (isMalConnected ? 'Sync with MyAnimeList' : 'Connect to MAL in Settings first')}
            className={`flex items-center w-full text-base font-medium rounded-lg transition-colors duration-200 text-text-secondary hover:bg-secondary hover:text-text-primary overflow-hidden whitespace-nowrap p-3 ${isCollapsed ? 'justify-center' : 'justify-start'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCw className="w-6 h-6 flex-shrink-0" />
            <span className={`opacity-70 transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-4'}`}>
                Sync with MAL
            </span>
          </button>
           <button
            onClick={onRefresh}
            title={isCollapsed ? 'Fetch Info' : 'Fetch Missing Anime Info'}
            className={`flex items-center w-full text-base font-medium rounded-lg transition-colors duration-200 text-text-secondary hover:bg-secondary hover:text-text-primary overflow-hidden whitespace-nowrap p-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <Download className="w-6 h-6 flex-shrink-0" />
            <span className={`opacity-70 transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-4'}`}>
                Fetch Info
            </span>
          </button>
          {isRateLimited && (
            <div
              title={isCollapsed ? `Rate limited: ${rateLimitSeconds}s remaining` : ''}
              className={`flex items-center w-full rounded-lg overflow-hidden whitespace-nowrap p-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            >
              <div className="relative h-10 w-10 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                  <circle
                    className="text-yellow-400/20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    r="18"
                    cx="20"
                    cy="20"
                  />
                  <circle
                    className="text-yellow-400"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={rateLimitStrokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    r="18"
                    cx="20"
                    cy="20"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-yellow-400 font-bold text-sm">
                    {rateLimitSeconds}
                  </span>
                </div>
              </div>

              {!isCollapsed && (
                <span className={`text-yellow-400 font-medium text-base ml-4`}>
                  Rate Limited
                </span>
              )}
            </div>
           )}
           {!isRateLimited && isNetworkError && (
              <div
                title={isCollapsed ? `Network issue. Retrying in ${networkSeconds}s...` : ''}
                className={`flex items-center w-full rounded-lg overflow-hidden whitespace-nowrap p-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <div className="relative h-10 w-10 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                    <circle
                      className="text-orange-400/20"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                    />
                    <circle
                      className="text-orange-400"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={networkStrokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r="18"
                      cx="20"
                      cy="20"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-orange-400 font-bold text-sm">
                      {networkSeconds}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <span className={`text-orange-400 font-medium text-base ml-4`}>
                    Retrying...
                  </span>
                )}
              </div>
           )}
           {fetchProgress.inProgress && (
            <div className={`flex w-full items-center gap-1 ${isCollapsed ? 'p-1' : ''}`}>
                <button
                    onClick={onLogViewToggle}
                    title="View Fetch Progress"
                    className="flex-grow min-w-0 flex flex-col items-start w-full py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-text-secondary hover:bg-secondary hover:text-text-primary"
                >
                    <div className={`w-full px-4 mb-1 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
                        <div className="flex justify-between text-xs opacity-80">
                            <span>Fetching...</span>
                            <span>{fetchProgress.current}/{fetchProgress.total}</span>
                        </div>
                        <p className="truncate text-left text-accent text-xs">
                            {fetchProgress.fetchingTitle || 'Initializing...'}
                        </p>
                    </div>
                    <div className={`w-full transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                        <div className="w-full bg-border-color rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-accent h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </button>
                <button
                    onClick={onStopFetching}
                    aria-label="Stop background fetch"
                    title="Stop Fetching"
                    className="p-2 rounded-md text-text-secondary hover:bg-red-900/50 hover:text-red-400 transition-colors flex-shrink-0"
                >
                    <X size={16}/>
                </button>
            </div>
           )}
           <div className="border-t border-border-color pt-1 my-2"></div>
          <button
            onClick={onToggle}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center w-full text-base font-medium rounded-lg transition-colors duration-200 text-text-secondary hover:bg-secondary hover:text-text-primary overflow-hidden whitespace-nowrap p-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}
          >
            <CollapseIcon className="w-6 h-6 flex-shrink-0" />
            <span className={`opacity-70 transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-4'}`}>
                Collapse
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};