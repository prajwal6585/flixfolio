import { createContext, useContext, useEffect, useReducer } from 'react';
import { Media, WatchlistItem, CalendarEvent, UserPreferences, FavoriteItem, WatchlistType } from '../types';

interface AppState {
  watchlists: Record<string, WatchlistItem[]>;
  calendar: CalendarEvent[];
  recommendations: Media[];
  preferences: UserPreferences;
  offlineData: {
    lastSync: string;
    media: Record<string, Media>;
  };
  favorites: FavoriteItem[];
}

const initialState: AppState = {
  watchlists: {
    'want-to-watch': [],
    'currently-watching': [],
    'completed': [],
    'favorites': [],
    'dropped': [],
  },
  calendar: [],
  recommendations: [],
  preferences: {
    favoriteGenres: [],
    excludedGenres: [],
    contentLanguages: ['en'],
    maturityRatings: ['PG-13', 'R'],
  },
  offlineData: {
    lastSync: '',
    media: {},
  },
  favorites: [],
};

type AppAction =
  | { type: 'ADD_TO_WATCHLIST'; payload: { item: WatchlistItem; listType: string } }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: { id: string; listType: string } }
  | { type: 'ADD_CALENDAR_EVENT'; payload: CalendarEvent }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SYNC_OFFLINE_DATA'; payload: { media: Record<string, Media> } }
  | { type: 'SET_RECOMMENDATIONS'; payload: Media[] }
  | { type: 'SYNC_WATCHLIST'; payload: { items: WatchlistItem[]; listType: string } }
  | { type: 'ADD_TO_FAVORITES'; payload: FavoriteItem }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_WATCHLIST':
      return {
        ...state,
        watchlists: {
          ...state.watchlists,
          [action.payload.listType]: [
            ...state.watchlists[action.payload.listType].filter(
              item => item.id !== action.payload.item.id
            ),
            action.payload.item
          ]
        }
      };
    case 'REMOVE_FROM_WATCHLIST':
      return {
        ...state,
        watchlists: {
          ...state.watchlists,
          [action.payload.listType]: state.watchlists[action.payload.listType].filter(
            item => item.id !== action.payload.id
          )
        }
      };
    case 'ADD_CALENDAR_EVENT':
      return {
        ...state,
        calendar: [...state.calendar, action.payload]
      };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    case 'SYNC_OFFLINE_DATA':
      return {
        ...state,
        offlineData: {
          ...state.offlineData,
          media: action.payload.media,
          lastSync: new Date().toISOString()
        }
      };
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload
      };
    case 'SYNC_WATCHLIST':
      return {
        ...state,
        watchlists: {
          ...state.watchlists,
          [action.payload.listType]: action.payload.items
        }
      };
    case 'ADD_TO_FAVORITES':
      return {
        ...state,
        favorites: [...state.favorites, action.payload]
      };
    case 'REMOVE_FROM_FAVORITES':
      return {
        ...state,
        favorites: state.favorites.filter(item => item.id !== action.payload)
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const parsed = JSON.parse(savedState) as { watchlists: Record<string, WatchlistItem[]> };
      Object.entries(parsed.watchlists).forEach(([listType, items]) => {
        dispatch({
          type: 'SYNC_WATCHLIST',
          payload: { items: items as WatchlistItem[], listType },
        });
      });
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify({
      watchlists: state.watchlists,
      preferences: state.preferences,
    }));
  }, [state.watchlists, state.preferences]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export function useFavorites() {
  const { state, dispatch } = useApp();

  const addToFavorites = (media: Media) => {
    dispatch({
      type: 'ADD_TO_FAVORITES',
      payload: {
        id: media.id,
        type: media.type,
        dateAdded: new Date().toISOString(),
      },
    });
  };

  const removeFromFavorites = (id: string) => {
    dispatch({
      type: 'REMOVE_FROM_FAVORITES',
      payload: id,
    });
  };

  const isFavorite = (id: string) => {
    return state.favorites.some(item => item.id === id);
  };

  return {
    favorites: state.favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
  };
}

export function useWatchlist() {
  const { state, dispatch } = useApp();

  const addToWatchlist = (media: Media, listType: WatchlistType = 'want-to-watch') => {
    dispatch({
      type: 'ADD_TO_WATCHLIST',
      payload: {
        item: {
          id: media.id,
          dateAdded: new Date().toISOString(),
          listType
        },
        listType
      }
    });
  };

  const removeFromWatchlist = (id: string, listType: string = 'want-to-watch') => {
    dispatch({
      type: 'REMOVE_FROM_WATCHLIST',
      payload: { id, listType }
    });
  };

  const isInWatchlist = (id: string, listType: string = 'want-to-watch') => {
    return state.watchlists[listType].some(item => item.id === id);
  };

  return {
    watchlists: state.watchlists,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist
  };
} 