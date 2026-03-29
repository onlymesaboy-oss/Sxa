import React from 'react';
import { Search, Filter, Calendar, Shield, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { LEAGUES, TEAMS } from '../constants';
import { League, Match, Team, LiveOdds, LiveScore } from '../types';
import { enrichTeamDetails } from '../services/geminiService';
import { fetchLiveOdds } from '../services/oddsService';
import { TeamLogo } from './TeamLogo';

interface MatchSelectorProps {
  onMatchSelect: (match: Match) => void;
  liveMatches?: LiveScore[];
}

const QuickOdds: React.FC<{ leagueId: string; teamId: string }> = ({ leagueId, teamId }) => {
  const [odds, setOdds] = React.useState<LiveOdds | null>(null);

  React.useEffect(() => {
    // We use teamId as a proxy for matchId in this simplified search view
    fetchLiveOdds(leagueId, teamId).then(setOdds);
  }, [leagueId, teamId]);

  if (!odds) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
      <TrendingUp className="w-3 h-3 text-emerald-500" />
      <span className="text-[9px] font-black text-white">{odds.home.toFixed(2)}</span>
    </div>
  );
};

export const MatchSelector: React.FC<MatchSelectorProps> = ({ onMatchSelect, liveMatches = [] }) => {
  const [selectedLeague, setSelectedLeague] = React.useState<League>(LEAGUES[0]);
  const [homeTeam, setHomeTeam] = React.useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = React.useState<Team | null>(null);
  const [manualHomeName, setManualHomeName] = React.useState('');
  const [manualAwayName, setManualAwayName] = React.useState('');
  const [homeEnriching, setHomeEnriching] = React.useState(false);
  const [awayEnriching, setAwayEnriching] = React.useState(false);
  const [homeDetails, setHomeDetails] = React.useState<{ logo: string; description: string } | null>(null);
  const [awayDetails, setAwayDetails] = React.useState<{ logo: string; description: string } | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [matchDate, setMatchDate] = React.useState(new Date().toISOString().split('T')[0]);

  const getLiveInfo = (teamName: string) => {
    return liveMatches.find(m => 
      m.homeTeam.toLowerCase().includes(teamName.toLowerCase()) || 
      m.awayTeam.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(m.homeTeam.toLowerCase()) ||
      teamName.toLowerCase().includes(m.awayTeam.toLowerCase())
    );
  };

  const isCustom = selectedLeague.id === 'custom';

  const handleEnrichHome = async () => {
    if (!manualHomeName) return;
    setHomeEnriching(true);
    try {
      const details = await enrichTeamDetails(manualHomeName);
      setHomeDetails(details);
    } finally {
      setHomeEnriching(false);
    }
  };

  const handleEnrichAway = async () => {
    if (!manualAwayName) return;
    setAwayEnriching(true);
    try {
      const details = await enrichTeamDetails(manualAwayName);
      setAwayDetails(details);
    } finally {
      setAwayEnriching(false);
    }
  };

  const allTeams = React.useMemo(() => {
    return Object.entries(TEAMS).flatMap(([leagueId, teams]) => {
      const league = LEAGUES.find(l => l.id === leagueId);
      return teams.map(team => ({ ...team, league }));
    });
  }, []);

  const globalSearchResults = React.useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allTeams.filter(team => 
      team.name.toLowerCase().includes(term) || 
      team.league?.name.toLowerCase().includes(term)
    );
  }, [searchTerm, allTeams]);

  const teams = TEAMS[selectedLeague.id] || [];

  const handleGenerateMatch = () => {
    if (isCustom) {
      if (manualHomeName && manualAwayName) {
        const match: Match = {
          id: Math.random().toString(36).substr(2, 9),
          homeTeam: {
            id: 'custom-home',
            name: manualHomeName,
            logo: homeDetails?.logo || 'https://media.api-sports.io/football/teams/0.png',
            form: ['?', '?', '?', '?', '?'],
            goalsScored: 0,
            goalsConceded: 0
          },
          awayTeam: {
            id: 'custom-away',
            name: manualAwayName,
            logo: awayDetails?.logo || 'https://media.api-sports.io/football/teams/0.png',
            form: ['?', '?', '?', '?', '?'],
            goalsScored: 0,
            goalsConceded: 0
          },
          league: selectedLeague,
          date: new Date(matchDate).toLocaleDateString(),
        };
        onMatchSelect(match);
      }
      return;
    }

    if (homeTeam && awayTeam && homeTeam.id !== awayTeam.id) {
      const match: Match = {
        id: Math.random().toString(36).substr(2, 9),
        homeTeam,
        awayTeam,
        league: selectedLeague,
        date: new Date(matchDate).toLocaleDateString(),
      };
      onMatchSelect(match);
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Select Match</h2>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text"
            placeholder="Search teams across all leagues..."
            className="w-full bg-zinc-800/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* Global Search Results Dropdown */}
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto backdrop-blur-xl">
              <div className="p-2 border-b border-white/5 bg-zinc-900/50">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">
                  {globalSearchResults.length > 0 ? 'Search Results' : 'No Results Found'}
                </span>
              </div>
              
              {globalSearchResults.length > 0 ? (
                globalSearchResults.map(team => (
                  <div 
                    key={`${team.league?.id}-${team.id}`}
                    className="p-4 hover:bg-zinc-800/50 cursor-pointer flex items-center justify-between border-b border-white/5 last:border-none group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center p-2 group-hover:bg-zinc-700 transition-colors">
                        <TeamLogo src={team.logo} alt={team.name} size="sm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium group-hover:text-emerald-400 transition-colors">{team.name}</div>
                          {getLiveInfo(team.name) && (
                            <div className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                              LIVE
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-zinc-500 text-xs">{team.league?.name}</div>
                          {team.league && <QuickOdds leagueId={team.league.id} teamId={team.id} />}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (team.league) {
                            setSelectedLeague(team.league);
                            setHomeTeam(team);
                            setSearchTerm('');
                          }
                        }}
                        className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-black transition-all"
                      >
                        HOME
                      </button>
                      <button 
                        onClick={() => {
                          if (team.league) {
                            setSelectedLeague(team.league);
                            setAwayTeam(team);
                            setSearchTerm('');
                          }
                        }}
                        className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg hover:bg-white hover:text-black transition-all"
                      >
                        AWAY
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <p className="text-zinc-400 text-sm mb-4">We couldn't find "{searchTerm}" in our database.</p>
                  <button 
                    onClick={() => {
                      const customLeague = LEAGUES.find(l => l.id === 'custom');
                      if (customLeague) {
                        setSelectedLeague(customLeague);
                        setSearchTerm('');
                      }
                    }}
                    className="text-xs font-bold bg-white text-black px-4 py-2 rounded-xl hover:bg-emerald-500 transition-all"
                  >
                    Create Custom Match
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* League Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">League</label>
            <select 
              className="w-full bg-zinc-800 border-none rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
              value={selectedLeague.id}
              onChange={(e) => {
                const league = LEAGUES.find(l => l.id === e.target.value);
                if (league) {
                  setSelectedLeague(league);
                  setHomeTeam(null);
                  setAwayTeam(null);
                  setSearchTerm('');
                  setHomeDetails(null);
                  setAwayDetails(null);
                }
              }}
            >
              {LEAGUES.map(league => (
                <option key={league.id} value={league.id}>{league.name}</option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Match Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input 
                type="date"
                className="w-full bg-zinc-800 border-none rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none [color-scheme:dark]"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>
          </div>

          {/* Home Team Select/Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Home Team</label>
            {isCustom ? (
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Enter Home Team Name"
                    className="w-full bg-zinc-800 border-none rounded-2xl pl-11 pr-12 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={manualHomeName}
                    onChange={(e) => setManualHomeName(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <button 
                    onClick={handleEnrichHome}
                    disabled={!manualHomeName || homeEnriching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50"
                  >
                    {homeEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
                {homeDetails && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center p-2">
                      <TeamLogo src={homeDetails.logo} alt={manualHomeName} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{manualHomeName}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{homeDetails.description}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <select 
                className="w-full bg-zinc-800 border-none rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                value={homeTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  if (team) setHomeTeam(team);
                }}
              >
                <option value="" disabled>Select Home Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Away Team Select/Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Away Team</label>
            {isCustom ? (
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Enter Away Team Name"
                    className="w-full bg-zinc-800 border-none rounded-2xl pl-11 pr-12 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={manualAwayName}
                    onChange={(e) => setManualAwayName(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <button 
                    onClick={handleEnrichAway}
                    disabled={!manualAwayName || awayEnriching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-black transition-all disabled:opacity-50"
                  >
                    {awayEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  </button>
                </div>
                {awayDetails && (
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center p-2">
                      <TeamLogo src={awayDetails.logo} alt={manualAwayName} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{manualAwayName}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{awayDetails.description}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <select 
                className="w-full bg-zinc-800 border-none rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                value={awayTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  if (team) setAwayTeam(team);
                }}
              >
                <option value="" disabled>Select Away Team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button 
          onClick={handleGenerateMatch}
          disabled={isCustom ? (!manualHomeName || !manualAwayName) : (!homeTeam || !awayTeam || homeTeam.id === awayTeam.id)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
        >
          Set Match
        </button>
      </div>
    </div>
  );
};
