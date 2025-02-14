import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Check, ChevronDown, ChevronUp, Film, Play, CheckCircle, Circle, Clock, Award, DollarSign, Users, Clapperboard } from 'lucide-react';
import { Media, MediaDetails } from '../types';
import { useState, useEffect } from 'react';
import { getMediaDetails, getSeasonDetails } from '../lib/tmdb';
import { cn } from '../lib/utils';
import { VideoPlayer } from './VideoPlayer';

interface MediaDetailsModalProps {
  media: Media;
  onClose: () => void;
}

interface Season {
  id: number;
  name: string;
  overview: string;
  episode_count: number;
  air_date: string;
  poster_path: string;
  season_number: number;
}

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string;
  still_path: string;
  runtime: number;
}

export function MediaDetailsModal({ media, onClose }: MediaDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Record<number, Episode[]>>({});
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, boolean>>({});
  const [showVideo, setShowVideo] = useState(false);

  // Load watched episodes from localStorage on mount
  useEffect(() => {
    const savedWatchedEpisodes = localStorage.getItem(`watchedEpisodes-${media.id}`);
    if (savedWatchedEpisodes) {
      setWatchedEpisodes(JSON.parse(savedWatchedEpisodes));
    }
  }, [media.id]);

  // Save watched episodes to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(watchedEpisodes).length > 0) {
      localStorage.setItem(`watchedEpisodes-${media.id}`, JSON.stringify(watchedEpisodes));
    }
  }, [watchedEpisodes, media.id]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMediaDetails(
          media.id, 
          media.type === 'series' ? 'tv' : 'movie'
        );
        console.log('Fetched details:', data); // Debug log
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to load media details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [media.id, media.type]);

  const fetchSeasonEpisodes = async (seasonNumber: number) => {
    if (seasonEpisodes[seasonNumber]) return;

    try {
      const episodes = await getSeasonDetails(media.id, seasonNumber);
      setSeasonEpisodes(prev => ({
        ...prev,
        [seasonNumber]: episodes
      }));
    } catch (error) {
      console.error('Error fetching season episodes:', error);
    }
  };

  const toggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
      await fetchSeasonEpisodes(seasonNumber);
    }
  };

  const toggleEpisodeWatched = (seasonNumber: number, episodeNumber: number) => {
    const key = `${media.id}-s${seasonNumber}-e${episodeNumber}`;
    setWatchedEpisodes(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      return updated;
    });
  };

  const getSeasonProgress = (seasonNumber: number) => {
    const episodes = seasonEpisodes[seasonNumber] || [];
    if (episodes.length === 0) return 0;

    const watchedCount = episodes.filter(ep => 
      watchedEpisodes[`${media.id}-s${seasonNumber}-e${ep.episode_number}`]
    ).length;
    
    return Math.round((watchedCount / episodes.length) * 100);
  };

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-gray-900 p-6 rounded-lg">
          <p className="text-red-400">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl m-4"
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : details ? (
          <>
            <div className="relative">
              {/* Backdrop Image with Gradient Overlay */}
              {details.backdropPath && (
                <div className="absolute inset-0 w-full h-[400px]">
                  <img
                    src={`https://image.tmdb.org/t/p/original${details.backdropPath}`}
                    alt={details.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="relative px-8 pt-8 pb-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Poster */}
                  <img
                    src={`https://image.tmdb.org/t/p/w500${details.posterPath}`}
                    alt={details.title}
                    className="w-64 rounded-xl shadow-2xl self-start"
                  />

                  {/* Details */}
                  <div className="flex-1">
                    <h2 className="text-4xl font-bold text-white mb-4">{details.title}</h2>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="text-yellow-400" fill="currentColor" size={20} />
                        <span className="text-white font-semibold">{details.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400">{details.year}</span>
                      {details.imdbId && (
                        <a
                          href={`https://www.imdb.com/title/${details.imdbId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          <Film size={20} /> IMDb
                        </a>
                      )}
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed mb-6">{details.description}</p>
                    {details.trailerUrl && (
                      <button
                        onClick={() => setShowVideo(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 transition-colors rounded-lg text-white font-semibold mt-4"
                      >
                        <Play size={20} />
                        Watch Trailer
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {/* Key Details */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Details</h3>
                        <div className="space-y-2">
                          {details.director && (
                            <div className="flex items-center gap-2">
                              <Clapperboard size={16} className="text-gray-400" />
                              <span className="text-gray-400">Director:</span>
                              <span className="text-white">{details.director}</span>
                            </div>
                          )}
                          {details.runtime && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-gray-400">Runtime:</span>
                              <span className="text-white">{details.runtime} minutes</span>
                            </div>
                          )}
                          {details.imdbRating && (
                            <div className="flex items-center gap-2">
                              <Star size={16} className="text-yellow-400" />
                              <span className="text-gray-400">IMDb Rating:</span>
                              <span className="text-white">{details.imdbRating}/10</span>
                              <span className="text-gray-400">({details.imdbVotes} votes)</span>
                            </div>
                          )}
                          {details.budget && (
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-gray-400" />
                              <span className="text-gray-400">Budget:</span>
                              <span className="text-white">
                                ${(details.budget / 1000000).toFixed(1)}M
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cast Section */}
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white">Top Cast</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {details.cast.slice(0, 6).map((member) => (
                            <div key={member.id} className="flex items-center gap-3">
                              {member.profilePath ? (
                                <img
                                  src={member.profilePath}
                                  alt={member.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                                  <Users size={20} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{member.name}</p>
                                <p className="text-sm text-gray-400">{member.character}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Production Companies */}
                    {details.productionCompanies?.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Production</h3>
                        <div className="flex flex-wrap gap-4">
                          {details.productionCompanies.map((company) => (
                            <span
                              key={company}
                              className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Awards if available */}
                    {details.awards && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold text-white mb-4">Awards</h3>
                        <div className="flex items-center gap-2">
                          <Award className="text-yellow-400" />
                          <p className="text-gray-300">{details.awards}</p>
                        </div>
                      </div>
                    )}

                    {/* Genres */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {details.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-3 py-1 bg-gray-800/50 rounded-full text-sm text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seasons (for TV Series) */}
            {details.type === 'series' && details.seasons && (
              <div className="px-8 pb-8">
                <h3 className="text-2xl font-bold text-white mb-6">Episodes</h3>
                <div className="space-y-4">
                  {details.seasons.map((season: Season) => (
                    <div
                      key={season.id}
                      className="bg-gray-800/50 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSeason(season.season_number)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-800/70 transition-colors"
                      >
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            Season {season.season_number}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {season.episode_count} episodes • {getSeasonProgress(season.season_number)}% watched
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "transform transition-transform duration-200",
                            expandedSeason === season.season_number ? "rotate-180" : ""
                          )}
                        />
                      </button>

                      {/* Episodes List */}
                      <AnimatePresence>
                        {expandedSeason === season.season_number && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-4 divide-y divide-gray-700">
                              {seasonEpisodes[season.season_number]?.map((episode: Episode) => {
                                const episodeId = `${media.id}-s${season.season_number}-e${episode.episode_number}`;
                                const isWatched = watchedEpisodes[episodeId];

                                return (
                                  <div
                                    key={episode.id}
                                    className="py-4 flex items-center justify-between gap-4"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-4">
                                        <span className="text-gray-400 w-8">
                                          {episode.episode_number}
                                        </span>
                                        <h5 className="text-white font-medium">
                                          {episode.name}
                                        </h5>
                                      </div>
                                      {episode.overview && (
                                        <p className="text-sm text-gray-400 mt-1 ml-12">
                                          {episode.overview}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => toggleEpisodeWatched(season.season_number, episode.episode_number)}
                                      className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isWatched
                                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
                                      )}
                                    >
                                      {isWatched ? (
                                        <CheckCircle size={20} />
                                      ) : (
                                        <Circle size={20} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            >
              <X size={24} />
            </button>

            {/* Add the video player */}
            <AnimatePresence>
              {showVideo && details.trailerUrl && (
                <VideoPlayer
                  videoUrl={details.trailerUrl}
                  onClose={() => setShowVideo(false)}
                />
              )}
            </AnimatePresence>
          </>
        ) : null}
      </motion.div>
    </motion.div>
  );
}