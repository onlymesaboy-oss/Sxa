import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface PredictionCardProps {
  title: string;
  value: string | string[];
  icon: LucideIcon;
  delay?: number;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ title, value, icon: Icon, delay = 0 }) => {
  const formatValue = (val: string) => {
    const lowerVal = val.toLowerCase();
    const isHome = lowerVal.includes('home');
    const isAway = lowerVal.includes('away');
    
    if (isHome || isAway) {
      const cleanValue = val.replace(/home|away/gi, '').trim();
      return (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${
            isHome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-700 text-zinc-400 border border-white/5'
          }`}>
            {isHome ? 'Home' : 'Away'}
          </span>
          <span>{cleanValue || val}</span>
        </div>
      );
    }
    return val;
  };

  const displayValue = Array.isArray(value) 
    ? value.map((v, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="mx-2 text-zinc-700">•</span>}
          {formatValue(v)}
        </React.Fragment>
      ))
    : formatValue(value);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:bg-zinc-800/50 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
          <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Prediction</div>
      </div>
      
      <div>
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{title}</div>
        <div className="text-2xl font-black text-white tracking-tight">{displayValue}</div>
      </div>
    </motion.div>
  );
};
