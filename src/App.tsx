import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Film, Tv, List, Heart, Menu, X } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { MediaCard } from './components/MediaCard';
import { MediaDetailsModal } from './components/MediaDetailsModal';
import { getMovies, getTvSeries, searchMedia } from './lib/tmdb';
import { Media } from './types';
import { cn } from './lib/utils';
import { useApp } from './context/AppContext';
import { MediaShortcuts } from './components/MediaShortcuts';

type TabType = 'movies' | 'series' | 'watchlist' | 'favorites';

const tabVariants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -10, opacity: 0 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const navItems = [
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'watchlist', label: 'Watchlist', icon: List },
  { id: 'favorites', label: 'Favorites', icon: Heart },
] as const;

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Media[]>([]);
  const [series, setSeries] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const { state, dispatch } = useApp();
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [moviesData, seriesData] = await Promise.all([
          getMovies(1),
          getTvSeries(1)
        ]);
        setMovies(moviesData);
        setSeries(seriesData);
        setHasMore(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery) {
        setIsSearching(true);
        setLoading(true);
        try {
          const results = await searchMedia(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching:', error);
        } finally {
          setLoading(false);
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      let newData: Media[] = [];
      if (searchQuery) {
        newData = await searchMedia(searchQuery, nextPage);
      } else if (activeTab === 'movies') {
        newData = await getMovies(nextPage);
      } else if (activeTab === 'series') {
        newData = await getTvSeries(nextPage);
      }

      if (newData.length === 0) {
        setHasMore(false);
      } else {
        if (activeTab === 'movies') {
          setMovies(prev => [...prev, ...newData]);
        } else if (activeTab === 'series') {
          setSeries(prev => [...prev, ...newData]);
        }
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getWatchlistMedia = () => {
    const watchlistIds = state.watchlists['want-to-watch'].map(item => item.id);
    
    const watchlistMovies = movies.filter(movie => watchlistIds.includes(movie.id));
    const watchlistSeries = series.filter(show => watchlistIds.includes(show.id));

    return {
      movies: watchlistMovies,
      series: watchlistSeries
    };
  };

  const getFavoritesMedia = () => {
    const favoriteIds = state.favorites.map(fav => fav.id);
    const favoriteMovies = movies.filter(movie => favoriteIds.includes(movie.id));
    const favoriteSeries = series.filter(show => favoriteIds.includes(show.id));
    
    return {
      movies: favoriteMovies,
      series: favoriteSeries
    };
  };

  const filteredMedia = () => {
    if (searchQuery) {
      return searchResults;
    }
    return activeTab === 'movies' ? movies : series;
  };

  const handleAddToWatchlist = (mediaItem: Media) => {
    if (state.watchlists['want-to-watch'].some(item => item.id === mediaItem.id)) {
      dispatch({
        type: 'REMOVE_FROM_WATCHLIST',
        payload: { id: mediaItem.id, listType: 'want-to-watch' }
      });
    } else {
      dispatch({
        type: 'ADD_TO_WATCHLIST',
        payload: {
          item: {
            id: mediaItem.id,
            dateAdded: new Date().toISOString(),
            listType: 'want-to-watch'
          },
          listType: 'want-to-watch'
        }
      });
    }
  };

  const renderWatchlistView = () => {
    const { movies: watchlistMovies, series: watchlistSeries } = getWatchlistMedia();

    return (
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <Film size={18} className="text-red-500" />
              <span className="text-red-700 font-medium">{watchlistMovies.length} Movies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Tv size={18} className="text-blue-500" />
              <span className="text-blue-700 font-medium">{watchlistSeries.length} Series</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Movies Column */}
          <div className="bg-red-50/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-red-500 p-2 rounded-lg">
                <Film className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Movies Watchlist</h2>
                <p className="text-sm text-gray-500">
                  {watchlistMovies.length} {watchlistMovies.length === 1 ? 'movie' : 'movies'} to watch
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlistMovies.length > 0 ? (
                watchlistMovies.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
                        Movie
                      </span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <MediaCard
                        media={item}
                        onAddToWatchlist={() => handleAddToWatchlist(item)}
                        isInWatchlist={true}
                        onClick={() => setSelectedMedia(item)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-red-200">
                  <Film className="text-red-300 mb-2" size={48} />
                  <p className="text-gray-600 text-center font-medium">Your movie watchlist is empty</p>
                  <p className="text-sm text-gray-400 text-center mt-1 max-w-sm">
                    Discover great movies and add them to your watchlist
                  </p>
                  <button
                    onClick={() => setActiveTab('movies')}
                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Browse Movies
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Series Column */}
          <div className="bg-blue-50/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Tv className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Series Watchlist</h2>
                <p className="text-sm text-gray-500">
                  {watchlistSeries.length} {watchlistSeries.length === 1 ? 'series' : 'series'} to watch
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlistSeries.length > 0 ? (
                watchlistSeries.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full shadow-lg">
                        Series
                      </span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <MediaCard
                        media={item}
                        onAddToWatchlist={() => handleAddToWatchlist(item)}
                        isInWatchlist={true}
                        onClick={() => setSelectedMedia(item)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-blue-200">
                  <Tv className="text-blue-300 mb-2" size={48} />
                  <p className="text-gray-600 text-center font-medium">Your series watchlist is empty</p>
                  <p className="text-sm text-gray-400 text-center mt-1 max-w-sm">
                    Discover great TV series and add them to your watchlist
                  </p>
                  <button
                    onClick={() => setActiveTab('series')}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Browse Series
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFavoritesView = () => {
    const { movies: favoriteMovies, series: favoriteSeries } = getFavoritesMedia();

    return (
      <div className="space-y-12">
        {/* Section Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
              <Film size={18} className="text-red-500" />
              <span className="text-red-700 font-medium">{favoriteMovies.length} Movies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Tv size={18} className="text-blue-500" />
              <span className="text-blue-700 font-medium">{favoriteSeries.length} Series</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Favorite Movies Column */}
          <div className="bg-red-50/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-red-500 p-2 rounded-lg">
                <Film className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Favorite Movies</h2>
                <p className="text-sm text-gray-500">
                  {favoriteMovies.length} {favoriteMovies.length === 1 ? 'movie' : 'movies'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteMovies.length > 0 ? (
                favoriteMovies.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg">
                        Movie
                      </span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <MediaCard
                        media={item}
                        onAddToWatchlist={() => handleAddToWatchlist(item)}
                        isInWatchlist={state.watchlists['want-to-watch'].some(w => w.id === item.id)}
                        onClick={() => setSelectedMedia(item)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-red-200">
                  <Film className="text-red-300 mb-2" size={48} />
                  <p className="text-gray-600 text-center font-medium">No favorite movies yet</p>
                  <p className="text-sm text-gray-400 text-center mt-1 max-w-sm">
                    Add movies to your favorites by clicking the heart icon
                  </p>
                  <button
                    onClick={() => setActiveTab('movies')}
                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Browse Movies
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Series Column */}
          <div className="bg-blue-50/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Tv className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Favorite Series</h2>
                <p className="text-sm text-gray-500">
                  {favoriteSeries.length} {favoriteSeries.length === 1 ? 'series' : 'series'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteSeries.length > 0 ? (
                favoriteSeries.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full shadow-lg">
                        Series
                      </span>
                    </div>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                      <MediaCard
                        media={item}
                        onAddToWatchlist={() => handleAddToWatchlist(item)}
                        isInWatchlist={state.watchlists['want-to-watch'].some(w => w.id === item.id)}
                        onClick={() => setSelectedMedia(item)}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-8 bg-white rounded-xl border-2 border-dashed border-blue-200">
                  <Tv className="text-blue-300 mb-2" size={48} />
                  <p className="text-gray-600 text-center font-medium">No favorite series yet</p>
                  <p className="text-sm text-gray-400 text-center mt-1 max-w-sm">
                    Add series to your favorites by clicking the heart icon
                  </p>
                  <button
                    onClick={() => setActiveTab('series')}
                    className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Browse Series
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <nav className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              {/* Updated Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center shadow-lg ring-1 ring-white/10">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 text-transparent bg-clip-text tracking-tight">
                    FlixFolio
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                    Your Personal Movie Collection
                  </span>
                </div>
              </motion.div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                        activeTab === item.id
                          ? 'bg-primary-500/20 text-primary-400 shadow-lg shadow-primary-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </div>

            {/* Mobile Navigation */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden border-t border-white/5"
                >
                  <div className="px-2 py-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setActiveTab(item.id as TabType);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3',
                            activeTab === item.id
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <MediaShortcuts currentTab={activeTab as 'movies' | 'series'} />
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === 'watchlist' ? (
                renderWatchlistView()
              ) : activeTab === 'favorites' ? (
                renderFavoritesView()
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMedia().map((item, index) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        transition={{ delay: index * 0.05 }}
                      >
                        <MediaCard
                          media={item}
                          onAddToWatchlist={() => handleAddToWatchlist(item)}
                          isInWatchlist={state.watchlists['want-to-watch'].some(
                            w => w.id === item.id
                          )}
                          onClick={() => setSelectedMedia(item)}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {hasMore && !isSearching && ['movies', 'series'].includes(activeTab) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center"
                    >
                      <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      >
                        {isLoadingMore ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          'Load More'
                        )}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <MediaDetailsModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;