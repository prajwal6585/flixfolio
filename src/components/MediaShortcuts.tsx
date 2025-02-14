import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Award, Calendar } from 'lucide-react';
import { Media } from '../types';
import { getTrendingMedia, getTopRatedMedia, getUpcomingMedia } from '../lib/tmdb';
import { MediaCard } from './MediaCard';
import { cn } from '../lib/utils';

interface MediaShortcutsProps {
  currentTab: 'movies' | 'series';
}

interface ShortcutButtonProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ShortcutButton({ icon: Icon, label, isActive, onClick }: ShortcutButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
        isActive
          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

export function MediaShortcuts({ currentTab }: MediaShortcutsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [media, setMedia] = useState<Media[]>([]);

  useEffect(() => {
    if (!activeSection) return;

    const type = currentTab === 'movies' ? 'movie' : 'tv';
    
    const fetchMedia = async () => {
      let result: Media[] = [];
      switch (activeSection) {
        case 'trending':
          result = await getTrendingMedia(type);
          break;
        case 'topRated':
          result = await getTopRatedMedia(type);
          break;
        case 'upcoming':
          result = await getUpcomingMedia(type);
          break;
      }
      setMedia(result);
    };

    fetchMedia();
  }, [activeSection, currentTab]);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <ShortcutButton
          icon={TrendingUp}
          label="Trending"
          isActive={activeSection === 'trending'}
          onClick={() => toggleSection('trending')}
        />
        <ShortcutButton
          icon={Award}
          label="Top Rated"
          isActive={activeSection === 'topRated'}
          onClick={() => toggleSection('topRated')}
        />
        <ShortcutButton
          icon={Calendar}
          label="Upcoming"
          isActive={activeSection === 'upcoming'}
          onClick={() => toggleSection('upcoming')}
        />
      </div>

      <AnimatePresence mode="wait">
        {activeSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map(item => (
                <MediaCard
                  key={item.id}
                  media={item}
                  onAddToWatchlist={() => {}}
                  isInWatchlist={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 