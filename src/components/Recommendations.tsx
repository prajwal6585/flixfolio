import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MediaCard } from './MediaCard';
import { getRecommendations } from '../lib/tmdb';

export function Recommendations() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const recommendations = await getRecommendations(
          state.watchlists['completed'].map(item => item.id),
          state.preferences
        );
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [state.watchlists.completed, state.preferences]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="text-yellow-400" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>

      {/* Recommendation cards */}
    </div>
  );
} 