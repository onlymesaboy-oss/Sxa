import React from 'react';
import { motion } from 'motion/react';
import { Match, Team, Fixture, Prediction } from '../types';
import { TrendingUp, Calendar, Info } from 'lucide-react';

interface MatchDetailsProps {
  match: Match;
  prediction?: Prediction | null;
}

const TeamDetails: React.FC<{ team: Team; title: string; description?: string }> = ({ team, title, description }) => {
  return (
    <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center p-1.5 border border-white/5">
          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{title}: {team.name}</h4>
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Official Data</span>
          </div>
        </div>
      </div>

      {description && (
        <p className="text-xs text-zinc-500 leading-relaxed border-l-2 border-emerald-500/20 pl-4 italic">
          {description}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Recent Form</label>
          <div className="flex gap-2">
            {team.form.map((result, i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black
                  ${result === 'W' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 
                    result === 'L' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
                    'bg-zinc-800 text-zinc-400 border border-white/5'}`}
              >
                {result}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Upcoming Fixtures</label>
          <div className="space-y-2">
            {team.upcomingFixtures?.map((fixture, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 font-medium">{fixture.date}</span>
                  <span className="text-zinc-300">vs {fixture.opponent}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${fixture.isHome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {fixture.isHome ? 'HOME' : 'AWAY'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="bg-zinc-800/30 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Goals Scored</div>
            <div className="text-xl font-black text-white">{team.goalsScored}</div>
          </div>
          <div className="bg-zinc-800/30 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] font-bold text-zinc-500 uppercase mb-1">Conceded</div>
            <div className="text-xl font-black text-white">{team.goalsConceded}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MatchDetails: React.FC<MatchDetailsProps> = ({ match, prediction }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 text-zinc-400">
        <Info className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-bold uppercase tracking-widest">Team In-Depth Analysis</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TeamDetails 
          team={match.homeTeam} 
          title="Home" 
          description={prediction?.enrichedTeams?.home.description} 
        />
        <TeamDetails 
          team={match.awayTeam} 
          title="Away" 
          description={prediction?.enrichedTeams?.away.description} 
        />
      </div>
    </motion.div>
  );
};
