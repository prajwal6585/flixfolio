import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Plus, Filter, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { WatchlistType, Media } from '../types';
import { MediaCard } from './MediaCard';
import { cn } from '../lib/utils';

export function WatchlistManager() {
  const { state, dispatch } = useApp();
  const [activeList, setActiveList] = useState<WatchlistType>('want-to-watch');
  const [showFilters, setShowFilters] = useState(false);

  const watchlistTypes: { id: WatchlistType; label: string }[] = [
    { id: 'want-to-watch', label: 'Want to Watch' },
    { id: 'currently-watching', label: 'Currently Watching' },
    { id: 'completed', label: 'Completed' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'dropped', label: 'Dropped' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {watchlistTypes.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveList(id)}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors',
                activeList === id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeList}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {state.watchlists[activeList].map((item) => (
            <MediaCard
              key={item.id}
              media={state.offlineData.media[item.id]}
              onAddToWatchlist={() => {/* Handle list change */}}
              isInWatchlist={true}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 