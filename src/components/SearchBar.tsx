import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-20 z-30 mb-8 px-4"
    >
      <div className="max-w-3xl mx-auto">
        <div className="relative group">
          <motion.div 
            className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl group-hover:bg-primary-500/30 transition-all"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          />
          <div className="relative bg-gray-800/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-lg transform transition-all">
            <div className="flex items-center px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 group-hover:text-primary-400 transition-colors" />
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search movies and TV series..."
                className="flex-1 ml-3 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
              />
            </div>
          </div>
        </div>
        {value && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-400 text-sm mt-2 ml-4"
          >
            Showing results for "{value}"
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}