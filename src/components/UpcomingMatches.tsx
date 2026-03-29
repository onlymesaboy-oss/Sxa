import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Shield, ChevronRight, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { Match, LiveOdds, LiveScore } from '../types';
import { getUpcomingMatches } from '../services/geminiService';
import { fetchLiveOdds } from '../services/oddsService';
import { TeamLogo } from './TeamLogo';

interface UpcomingMatchesProps {
  onMatchSelect: (match: Match) => void;
  liveMatches?: LiveScore[];
}

const MatchOdds: React.FC<{ leagueId: string; matchId: string }> = ({ leagueId, matchId }) => {
  const [odds, setOdds] = React.useState<LiveOdds | null>(null);

  React.useEffect(() => {
    fetchLiveOdds(leagueId, matchId).then(setOdds);
  }, [leagueId, matchId]);

  if (!odds) return <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />;

  return (
    <div className="flex gap-2">
      <div className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[9px] font-black text-zinc-400">
        H: <span className="text-white">{odds.home.toFixed(2)}</span>
      </div>
      <div className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[9px] font-black text-zinc-400">
        D: <span className="text-white">{odds.draw.toFixed(2)}</span>
      </div>
      <div className="px-2 py-0.5 bg-white/5 rounded border border-white/5 text-[9px] font-black text-zinc-400">
        A: <span className="text-white">{odds.away.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const UpcomingMatches: React.FC<UpcomingMatchesProps> = ({ onMatchSelect, liveMatches = [] }) => {
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const getLiveInfo = (match: Match) => {
    return liveMatches.find(m => 
      (m.homeTeam.toLowerCase().includes(match.homeTeam.name.toLowerCase()) || 
       match.homeTeam.name.toLowerCase().includes(m.homeTeam.toLowerCase())) &&
      (m.awayTeam.toLowerCase().includes(match.awayTeam.name.toLowerCase()) || 
       match.awayTeam.name.toLowerCase().includes(m.awayTeam.toLowerCase()))
    );
  };

  React.useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await getUpcomingMatches();
        setMatches(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">កំពុងស្វែងរកការប្រកួតសំខាន់ៗ...</p>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-black text-white uppercase tracking-tight">ការប្រកួតសំខាន់ៗបន្ទាប់</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Odds Active</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Featured Matches</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onMatchSelect(match)}
            className="group relative bg-zinc-900/30 border border-white/5 rounded-3xl p-5 hover:bg-zinc-800/50 hover:border-emerald-500/30 transition-all cursor-pointer overflow-hidden"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
            
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter line-clamp-1">
                      {match.league.name}
                    </span>
                  </div>
                  {getLiveInfo(match) && (
                    <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-1 animate-pulse">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3 text-emerald-500" />
                  {match.date}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <TeamLogo 
                    src={match.homeTeam.logo} 
                    alt={match.homeTeam.name} 
                    size="md"
                    className="bg-white/5 rounded-xl p-2 border border-white/5 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-tight text-center line-clamp-1">
                      {match.homeTeam.name}
                    </span>
                    {getLiveInfo(match) && (
                      <span className="text-[14px] font-black text-emerald-500 mt-1">
                        {getLiveInfo(match)?.score.split('-')[0].trim()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs font-black text-zinc-700 italic">VS</div>

                <div className="flex-1 flex flex-col items-center gap-2">
                  <TeamLogo 
                    src={match.awayTeam.logo} 
                    alt={match.awayTeam.name} 
                    size="md"
                    className="bg-white/5 rounded-xl p-2 border border-white/5 group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-tight text-center line-clamp-1">
                      {match.awayTeam.name}
                    </span>
                    {getLiveInfo(match) && (
                      <span className="text-[14px] font-black text-emerald-500 mt-1">
                        {getLiveInfo(match)?.score.split('-')[1].trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col gap-3 group-hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Live Odds</span>
                  </div>
                  <MatchOdds leagueId={match.league.id} matchId={match.id} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">View AI Analysis</span>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
