import React, { useMemo } from 'react';
import type { Anime, Character, CustomBackgroundSettings } from '../../types';
import { AnimeStats } from '../stats/AnimeStats';
import { WatchStatus } from '../../types';
import { Loader2, Edit, BarChart3, Star, User, Plus, History, Share2, PieChart } from 'lucide-react';
import { Tile } from '../cards/Tile';
import { GenreDistribution } from '../stats/GenreDistribution';

interface ProfileViewProps {
  animeList: Anime[];
  userProfile: {
    username: string;
    profilePic: string;
  };
  onViewDetails: (anime: Anime) => void;
  isFetchingProfileData: boolean;
  onViewListByStatus: (status: WatchStatus) => void;
  onOpenEditProfileModal: () => void;
  onOpenEditModal: (anime: Anime) => void;
  customBackground: CustomBackgroundSettings;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ animeList, userProfile, onViewDetails, isFetchingProfileData, onViewListByStatus, onOpenEditProfileModal, onOpenEditModal, customBackground }) => {
  
  const favoriteAnime = useMemo(() => {
    return animeList
      .filter(a => a.status === WatchStatus.Completed && (a.averageScore || a.score * 10) >= 80)
      .sort((a, b) => (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10))
      .slice(0, 9);
  }, [animeList]);

  const favoriteCharacters = useMemo(() => {
    const charactersMap = new Map<number, Character>();
    
    // Iterate through high-rated completed anime to get their main characters
    animeList
        .filter(a => a.status === WatchStatus.Completed && (a.averageScore || a.score * 10) >= 85)
        .sort((a, b) => (b.averageScore || b.score * 10) - (a.averageScore || a.score * 10))
        .forEach(anime => {
            if (anime.characters) {
                anime.characters
                    .filter(c => c.role === 'MAIN')
                    .forEach(char => {
                        if (!charactersMap.has(char.id)) {
                            charactersMap.set(char.id, char);
                        }
                    });
            }
        });
        
    return Array.from(charactersMap.values()).slice(0, 9);
  }, [animeList]);

  const profileHeaderStyle: React.CSSProperties = {
    backgroundColor: `rgb(var(--color-secondary-rgb) / ${customBackground.imageUrl ? customBackground.tileOpacity : 1})`
  };

  return (
    <div className="w-full max-w-screen-2xl mx-auto">
      <div className="space-y-6">
          <div 
            className="flex items-start justify-between gap-6 p-6 rounded-lg border border-border-color"
            style={profileHeaderStyle}
          >
              <div className="flex items-center gap-6">
                  <img src={userProfile.profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-accent" />
                  <div>
                      <div className="flex items-center gap-2">
                        <User className="w-6 h-6 text-accent" />
                        <p className="text-text-secondary text-xl">Profile</p>
                      </div>
                      <h1 className="text-5xl lg:text-6xl font-bold text-text-primary">{userProfile.username}</h1>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <button
                    onClick={onOpenEditProfileModal}
                    className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-border-color text-text-secondary rounded-md hover:bg-accent/20 hover:text-accent transition-colors flex-shrink-0"
                  >
                      <Edit size={16} />
                      <span>Edit Profile</span>
                  </button>
              </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Tile title="Your Anime Stats" icon={BarChart3} customBackground={customBackground}>
              <AnimeStats animeList={animeList} onViewListByStatus={onViewListByStatus} />
            </Tile>
            <Tile title="Genre Distribution" icon={PieChart} customBackground={customBackground}>
              <GenreDistribution animeList={animeList} />
            </Tile>
          </div>

          <Tile title="Favorites" icon={Star} customBackground={customBackground}>
            <div className="space-y-6">
              <div>
                  <h3 className="text-2xl lg:text-3xl font-semibold text-text-primary mb-3">Anime ({favoriteAnime.length})</h3>
                  {favoriteAnime.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                          {favoriteAnime.map(anime => (
                              <button key={anime.id} onClick={() => onViewDetails(anime)} className="relative group aspect-[2/3] focus:outline-none focus:ring-2 focus:ring-accent rounded-md">
                                  <img src={anime.posterUrl} alt={anime.title} className="w-full h-full object-cover rounded-md" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-2">
                                      <p className="text-white text-base font-semibold">{anime.title}</p>
                                  </div>
                              </button>
                          ))}
                      </div>
                  ) : (
                      <p className="text-text-secondary text-lg">No favorite anime yet. Complete some shows and rate them highly to see them here!</p>
                  )}
              </div>
              
              <div>
                  <h3 className="text-2xl lg:text-3xl font-semibold text-text-primary mb-3">Characters ({favoriteCharacters.length})</h3>
                  {isFetchingProfileData ? (
                      <div className="flex items-center justify-center py-8 text-text-secondary">
                          <Loader2 className="w-6 h-6 animate-spin mr-3" />
                          <span className="text-lg">Loading character data...</span>
                      </div>
                  ) : favoriteCharacters.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
                          {favoriteCharacters.map(char => (
                              <div key={char.id} className="relative group aspect-[2/3]">
                                  <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover rounded-md" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center p-2">
                                      <p className="text-white text-base font-semibold">{char.name}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-text-secondary text-lg">Favorite characters are sourced from your highest-rated shows. Watch and rate more anime to see them here!</p>
                  )}
              </div>
            </div>
          </Tile>
      </div>
    </div>
  );
};