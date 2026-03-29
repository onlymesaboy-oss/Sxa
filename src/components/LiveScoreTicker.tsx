import React from 'react';
import { motion } from 'motion/react';
import { getLiveScores } from '../services/geminiService';
import { LiveScore } from '../types';
import { Activity, Loader2 } from 'lucide-react';

export const LiveScoreTicker: React.FC = () => {
  const [scores, setScores] = React.useState<LiveScore[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchScores = async () => {
      try {
        const liveScores = await getLiveScores();
        setScores(liveScores);
      } catch (error) {
        console.error('Failed to fetch live scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 60000 * 5); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-emerald-500/5 border-b border-white/5 py-2 flex items-center justify-center gap-2">
        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
        <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Loading Live Scores...</span>
      </div>
    );
  }

  if (scores.length === 0) return null;

  return (
    <div className="bg-emerald-500/5 border-b border-white/5 py-2 overflow-hidden relative group">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10" />
      
      <motion.div 
        className="flex items-center gap-12 whitespace-nowrap px-12"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {[...scores, ...scores].map((score, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{score.league}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-white">{score.homeTeam}</span>
              <span className="px-2 py-0.5 bg-white/10 rounded text-xs font-black text-emerald-400 font-mono">{score.score}</span>
              <span className="text-xs font-bold text-white">{score.awayTeam}</span>
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              score.status === 'FT' ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/20 text-emerald-500'
            }`}>
              {score.status}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
