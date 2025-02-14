import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
}

export function VideoPlayer({ videoUrl, onClose }: VideoPlayerProps) {
  // Convert YouTube watch URL to embed URL
  const embedUrl = videoUrl.replace('watch?v=', 'embed/');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-full max-w-4xl aspect-video"
        onClick={e => e.stopPropagation()}
      >
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
        >
          <X size={24} />
        </button>
      </motion.div>
    </motion.div>
  );
} 