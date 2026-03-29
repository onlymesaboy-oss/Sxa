import React from 'react';
import { TrendingUp, Target, ShieldCheck, Swords } from 'lucide-react';
import { Team, MatchStats } from '../types';

interface StatsPanelProps {
  homeTeam: Team;
  awayTeam: Team;
  confidence: number;
  h2h: MatchStats['h2h'];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ homeTeam, awayTeam, confidence, h2h }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Team Form */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Recent Form</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{homeTeam.name}</span>
            <div className="flex gap-1">
              {homeTeam.form.map((res, i) => (
                <span key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  res === 'W' ? 'bg-emerald-500 text-black' : res === 'D' ? 'bg-zinc-700 text-white' : 'bg-red-500 text-white'
                }`}>{res}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{awayTeam.name}</span>
            <div className="flex gap-1">
              {awayTeam.form.map((res, i) => (
                <span key={i} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  res === 'W' ? 'bg-emerald-500 text-black' : res === 'D' ? 'bg-zinc-700 text-white' : 'bg-red-500 text-white'
                }`}>{res}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goals Stats */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <Target className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Season Stats</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-2xl">
            <div className="text-2xl font-black text-white">{homeTeam.goalsScored}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Home Goals</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-2xl">
            <div className="text-2xl font-black text-white">{awayTeam.goalsScored}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Away Goals</div>
          </div>
        </div>
      </div>

      {/* Confidence */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-emerald-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">កម្រិតទំនុកចិត្ត AI</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-white">{confidence}%</span>
            <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-1 rounded-md">ភាពជឿជាក់ខ្ពស់</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Head to Head */}
      <div className="lg:col-span-3 bg-zinc-900/50 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <Swords className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Head to Head (Last 10)</span>
        </div>

        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
              <span>{homeTeam.name} Wins</span>
              <span>{h2h.homeWins}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${(h2h.homeWins / 10) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
              <span>Draws</span>
              <span>{h2h.draws}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-zinc-600" style={{ width: `${(h2h.draws / 10) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase">
              <span>{awayTeam.name} Wins</span>
              <span>{h2h.awayWins}</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: `${(h2h.awayWins / 10) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
