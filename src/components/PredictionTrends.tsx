import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Match, Prediction } from '../types';
import { TrendingUp } from 'lucide-react';

interface PredictionTrendsProps {
  history: { match: Match; prediction: Prediction }[];
}

export const PredictionTrends: React.FC<PredictionTrendsProps> = ({ history }) => {
  const data = React.useMemo(() => {
    return [...history].reverse().map((item, index) => ({
      name: `P${index + 1}`,
      confidence: item.prediction.confidence,
      match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`,
    }));
  }, [history]);

  if (history.length < 2) {
    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-zinc-500 gap-4 min-h-[300px]">
        <div className="p-3 bg-zinc-800 rounded-full">
          <TrendingUp className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium">Generate more predictions to see trends</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Confidence Trends
          </h3>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">AI Certainty over recent predictions</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Data</span>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              itemStyle={{ color: '#10b981' }}
              labelStyle={{ color: '#71717a', marginBottom: '4px' }}
              cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="confidence" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorConfidence)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
