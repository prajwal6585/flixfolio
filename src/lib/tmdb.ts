import axios from 'axios';
import { Media, UserPreferences, MediaDetails, Episode } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

const api = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export async function searchMedia(query: string, page = 1): Promise<Media[]> {
  if (!query) return [];
  
  try {
    const [movieResults, tvResults] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&page=${page}`),
      axios.get(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${query}&page=${page}`)
    ]);

    const movies = movieResults.data.results.map((movie: any) => ({
      id: movie.id.toString(),
      title: movie.title,
      description: movie.overview,
      posterUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
      backdropUrl: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : '',
      rating: movie.vote_average,
      year: new Date(movie.release_date).getFullYear(),
      type: 'movie' as const
    }));

    const series = tvResults.data.results.map((show: any) => ({
      id: show.id.toString(),
      title: show.name,
      description: show.overview,
      posterUrl: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : '',
      backdropUrl: show.backdrop_path ? `${IMAGE_BASE_URL}${show.backdrop_path}` : '',
      rating: show.vote_average,
      year: new Date(show.first_air_date).getFullYear(),
      type: 'series' as const
    }));

    return [...movies, ...series];
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
}

export async function getPopularMedia(type: 'movie' | 'tv' = 'movie', page = 1) {
  const endpoint = type === 'movie' ? '/movie/popular' : '/tv/popular';
  const { data } = await api.get(endpoint, {
    params: {
      page,
    },
  });

  return data.results.map((item: any): Media => ({
    id: item.id.toString(),
    title: type === 'movie' ? item.title : item.name,
    type: type === 'movie' ? 'movie' : 'series',
    posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : undefined,
    year: new Date(type === 'movie' ? item.release_date : item.first_air_date).getFullYear(),
    rating: item.vote_average,
    description: item.overview,
  }));
}

export async function getMediaDetails(id: string, type: 'movie' | 'tv'): Promise<MediaDetails> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key is not configured');
  }

  try {
    console.log(`Fetching ${type} details for ID: ${id}`); // Debug log

    const [details, credits, videos] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`),
      axios.get(`${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`),
      axios.get(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`)
    ]);

    console.log('API Response:', { details: details.data, credits: credits.data, videos: videos.data }); // Debug log

    const director = credits.data.crew.find(
      (member: any) => member.job === 'Director'
    );
    const producer = credits.data.crew.find(
      (member: any) => member.job === 'Producer'
    );
    const writer = credits.data.crew.find(
      (member: any) => member.department === 'Writing'
    );

    const trailer = videos.data.results.find(
      (v: any) => v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos.data.results.find(
      (v: any) => v.type === 'Teaser' && v.site === 'YouTube'
    );

    return {
      id: details.data.id.toString(),
      title: details.data.title || details.data.name,
      type: type === 'tv' ? 'series' as const : 'movie' as const,
      description: details.data.overview,
      year: new Date(details.data.release_date || details.data.first_air_date).getFullYear(),
      rating: details.data.vote_average,
      overview: details.data.overview,
      posterPath: details.data.poster_path,
      backdropPath: details.data.backdrop_path,
      releaseDate: details.data.release_date || details.data.first_air_date,
      runtime: details.data.runtime || details.data.episode_run_time?.[0],
      genres: details.data.genres.map((g: any) => g.name),
      cast: credits.data.cast.slice(0, 10).map((member: any) => ({
        id: member.id,
        name: member.name,
        character: member.character,
        profilePath: member.profile_path ? `${IMAGE_BASE_URL}${member.profile_path}` : null,
        order: member.order,
      })),
      crew: credits.data.crew.map((member: any) => ({
        id: member.id,
        name: member.name,
        job: member.job,
        department: member.department,
        profilePath: member.profile_path ? `${IMAGE_BASE_URL}${member.profile_path}` : null,
      })),
      director: director?.name,
      producer: producer?.name,
      writer: writer?.name,
      productionCompanies: details.data.production_companies.map((pc: any) => pc.name),
      imdbId: details.data.imdb_id,
      seasons: type === 'tv' ? details.data.seasons : undefined,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    };
  } catch (error) {
    console.error('Error in getMediaDetails:', error);
    throw error;
  }
}

export async function getRecommendations(watchedMediaIds: string[], preferences: UserPreferences): Promise<Media[]> {
  const mediaType = 'movie'; // or handle both movies and TV shows
  const recommendations = await Promise.all(
    watchedMediaIds.map(id => 
      api.get(`/${mediaType}/${id}/recommendations`).catch(() => ({ data: { results: [] } }))
    )
  );

  return recommendations
    .flatMap(response => response.data.results)
    .map((item: any): Media => ({
      id: item.id.toString(),
      title: item.title || item.name,
      type: item.title ? 'movie' : 'series',
      posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : undefined,
      year: new Date(item.release_date || item.first_air_date).getFullYear(),
      rating: item.vote_average,
      description: item.overview,
    }));
}

export async function getMovies(page = 1): Promise<Media[]> {
  try {
    const [popular, topRated, upcoming] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`),
      axios.get(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}`),
      axios.get(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&page=${page}`)
    ]);

    const allMovies = [...popular.data.results, ...topRated.data.results, ...upcoming.data.results];
    
    // Remove duplicates
    const uniqueMovies = Array.from(new Map(allMovies.map(movie => 
      [movie.id, movie]
    )).values());

    return uniqueMovies.map((movie: any) => ({
      id: movie.id.toString(),
      title: movie.title,
      description: movie.overview,
      posterUrl: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : '',
      backdropUrl: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : '',
      rating: movie.vote_average,
      year: new Date(movie.release_date).getFullYear(),
      type: 'movie' as const
    }));
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

export async function getTvSeries(page = 1): Promise<Media[]> {
  try {
    const [popular, topRated, airingToday] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`),
      axios.get(`${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&page=${page}`),
      axios.get(`${TMDB_BASE_URL}/tv/airing_today?api_key=${TMDB_API_KEY}&page=${page}`)
    ]);

    const allSeries = [...popular.data.results, ...topRated.data.results, ...airingToday.data.results];
    
    // Remove duplicates
    const uniqueSeries = Array.from(new Map(allSeries.map(show => 
      [show.id, show]
    )).values());

    return uniqueSeries.map((show: any) => ({
      id: show.id.toString(),
      title: show.name,
      description: show.overview,
      posterUrl: show.poster_path ? `${IMAGE_BASE_URL}${show.poster_path}` : '',
      backdropUrl: show.backdrop_path ? `${IMAGE_BASE_URL}${show.backdrop_path}` : '',
      rating: show.vote_average,
      year: new Date(show.first_air_date).getFullYear(),
      type: 'series' as const
    }));
  } catch (error) {
    console.error('Error fetching TV series:', error);
    return [];
  }
}

export async function getMediaVideos(id: string, type: 'movie' | 'tv'): Promise<string | null> {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`
    );

    const videos = response.data.results;
    // Look for official trailer, teaser, or any video in that order
    const video = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') ||
                 videos.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube') ||
                 videos[0];

    return video ? `https://www.youtube.com/watch?v=${video.key}` : null;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return null;
  }
}

export async function getSeasonDetails(seriesId: string, seasonNumber: number): Promise<Episode[]> {
  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/tv/${seriesId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`
    );

    return response.data.episodes.map((episode: any) => ({
      id: episode.id,
      name: episode.name,
      overview: episode.overview,
      episode_number: episode.episode_number,
      air_date: episode.air_date,
      still_path: episode.still_path,
      runtime: episode.runtime
    }));
  } catch (error) {
    console.error('Error fetching season details:', error);
    return [];
  }
}

export async function getTrendingMedia(type: 'movie' | 'tv', limit: number = 10) {
  try {
    const { data } = await api.get(`/trending/${type}/week`);
    return data.results.slice(0, limit).map((item: any): Media => ({
      id: item.id.toString(),
      title: type === 'movie' ? item.title : item.name,
      description: item.overview,
      posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '',
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : '',
      rating: item.vote_average,
      year: new Date(type === 'movie' ? item.release_date : item.first_air_date).getFullYear(),
      type: type === 'movie' ? 'movie' : 'series'
    }));
  } catch (error) {
    console.error('Error fetching trending media:', error);
    return [];
  }
}

export async function getTopRatedMedia(type: 'movie' | 'tv', limit: number = 10) {
  try {
    const { data } = await api.get(`/${type}/top_rated`);
    return data.results.slice(0, limit).map((item: any): Media => ({
      id: item.id.toString(),
      title: type === 'movie' ? item.title : item.name,
      description: item.overview,
      posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '',
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : '',
      rating: item.vote_average,
      year: new Date(type === 'movie' ? item.release_date : item.first_air_date).getFullYear(),
      type: type === 'movie' ? 'movie' : 'series'
    }));
  } catch (error) {
    console.error('Error fetching top rated media:', error);
    return [];
  }
}

export async function getUpcomingMedia(type: 'movie' | 'tv', limit: number = 10) {
  try {
    const endpoint = type === 'movie' ? '/movie/upcoming' : '/tv/on_the_air';
    const { data } = await api.get(endpoint);
    return data.results.slice(0, limit).map((item: any): Media => ({
      id: item.id.toString(),
      title: type === 'movie' ? item.title : item.name,
      description: item.overview,
      posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '',
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : '',
      rating: item.vote_average,
      year: new Date(type === 'movie' ? item.release_date : item.first_air_date).getFullYear(),
      type: type === 'movie' ? 'movie' : 'series'
    }));
  } catch (error) {
    console.error('Error fetching upcoming media:', error);
    return [];
  }
}