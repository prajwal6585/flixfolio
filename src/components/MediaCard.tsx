import { motion } from 'framer-motion';
import { Play, Plus, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { Media } from '../types';
import { cn } from '../lib/utils';
import { MediaDetailsModal } from './MediaDetailsModal';
import { useFavorites } from '../context/AppContext';

interface MediaCardProps {
  media: Media;
  onAddToWatchlist: (id: string) => void;
  isInWatchlist: boolean;
  onClick: () => void;
}

export function MediaCard({ media, onAddToWatchlist, isInWatchlist, onClick }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const isFav = isFavorite(media.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFromFavorites(media.id);
    } else {
      addToFavorites(media);
    }
  };

  return (
    <>
      <motion.div
        className="relative rounded-xl overflow-hidden cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
      >
        <img
          src={media.posterUrl}
          alt={media.title}
          className="w-full h-[400px] object-cover"
        />
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400" fill="currentColor" />
              <span className="text-white font-medium">{media.rating.toFixed(1)}</span>
            </div>
            <button
              onClick={handleFavoriteClick}
              className={cn(
                'p-2 rounded-full transition-colors',
                isFav
                  ? 'text-red-500 hover:bg-red-500/20'
                  : 'text-white hover:bg-white/20'
              )}
            >
              <Heart
                size={20}
                className={cn('transition-transform', isFav && 'scale-110')}
                fill={isFav ? 'currentColor' : 'none'}
              />
            </button>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{media.title}</h3>
          <p className="text-sm text-gray-200 mb-4 line-clamp-2">{media.description}</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToWatchlist(media.id);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                isInWatchlist
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              )}
            >
              <Plus size={16} />
              {isInWatchlist ? 'Added' : 'Add to Watchlist'}
            </button>
          </div>
        </div>
      </motion.div>

      {showDetails && (
        <MediaDetailsModal
          media={media}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}