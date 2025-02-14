export interface Media {
  id: string;
  title: string;
  description: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating: number;
  year: number;
  type: 'movie' | 'series';
}

export interface WatchlistItem {
  id: string;
  dateAdded: string;
  listType: WatchlistType;
  notes?: string;
  rating?: number;
}

export type WatchlistType = 
  | 'want-to-watch'
  | 'currently-watching'
  | 'completed'
  | 'favorites'
  | 'dropped';

// Track watching progress for movies
interface WatchProgress {
  mediaId: string;
  progress: number; // percentage watched
  lastWatched: Date;
  status: 'not-started' | 'in-progress' | 'completed';
}

// Add notes/reviews
interface UserReview {
  mediaId: string;
  rating: number;
  review: string;
  dateWatched: Date;
  private: boolean;
}

interface FilterOptions {
  genres: string[];
  year: { start: number; end: number };
  rating: { min: number; max: number };
  runtime: { min: number; max: number };
  status: 'released' | 'upcoming';
  watchStatus: 'watched' | 'unwatched' | 'in-progress';
}

interface UserStats {
  totalWatchTime: number;
  favoriteGenres: { genre: string; count: number }[];
  watchingStreak: number;
  completedSeries: number;
  averageRating: number;
}

export interface UserPreferences {
  favoriteGenres: string[];
  excludedGenres: string[];
  contentLanguages: string[];
  maturityRatings: string[];
}

export interface CalendarEvent {
  id: string;
  mediaId: string;
  title: string;
  date: string;
  type: 'release' | 'reminder' | 'watch-party';
  description?: string;
}

export interface Recommendation {
  mediaId: string;
  reason: string;
  confidence: number;
  basedOn: string[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

export interface MediaDetails extends Media {
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  type: 'movie' | 'series';
  runtime?: number;
  genres: string[];
  cast: CastMember[];
  crew: CrewMember[];
  director?: string;
  producer?: string;
  writer?: string;
  productionCompanies: string[];
  imdbId?: string;
  imdbRating?: number;
  imdbVotes?: number;
  budget?: number;
  awards?: string[];
  trailerUrl: string | null;
  seasons?: any[]; // Add proper type if needed
}

export interface FavoriteItem {
  id: string;
  type: 'movie' | 'series';
  dateAdded: string;
}

export interface AppState {
  favorites: FavoriteItem[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string;
  still_path: string;
  runtime: number;
}