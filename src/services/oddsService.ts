import { LiveOdds } from '../types';

/**
 * Service to fetch real-time betting odds.
 * In a production environment, this would call a real betting API like:
 * - The Odds API (the-odds-api.com)
 * - Betfair API
 * - Sportradar
 */

// Simulated base odds for different leagues/matches
const BASE_ODDS: Record<string, { home: number; draw: number; away: number }> = {
  'PL': { home: 1.85, draw: 3.40, away: 4.20 },
  'LL': { home: 2.10, draw: 3.25, away: 3.60 },
  'SA': { home: 1.95, draw: 3.30, away: 3.90 },
  'BL': { home: 1.70, draw: 3.80, away: 5.00 },
  'L1': { home: 2.25, draw: 3.10, away: 3.40 },
  'default': { home: 2.00, draw: 3.30, away: 3.70 }
};

/**
 * Fetches current odds for a specific match.
 * @param leagueId The ID of the league to get base odds from
 * @param matchId The unique ID of the match
 */
export const fetchLiveOdds = async (leagueId: string, matchId: string): Promise<LiveOdds> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const base = BASE_ODDS[leagueId] || BASE_ODDS['default'];
  
  // Add some "real-time" jitter to simulate market movements
  // In a real app, this data comes from the API
  const jitter = () => (Math.random() * 0.1) - 0.05;
  
  const home = Number((base.home + jitter()).toFixed(2));
  const draw = Number((base.draw + jitter()).toFixed(2));
  const away = Number((base.away + jitter()).toFixed(2));

  // Determine change direction for UI feedback
  const rand = Math.random();
  const change: 'up' | 'down' | 'stable' = rand > 0.7 ? 'up' : rand < 0.3 ? 'down' : 'stable';

  return {
    home,
    draw,
    away,
    lastUpdated: new Date().toISOString(),
    change
  };
};

/**
 * Hook-like function to subscribe to odds updates.
 * In a real app, this might use WebSockets (Pusher, Socket.io, etc.)
 */
export const subscribeToOdds = (
  leagueId: string, 
  matchId: string, 
  onUpdate: (odds: LiveOdds) => void
) => {
  // Initial fetch
  fetchLiveOdds(leagueId, matchId).then(onUpdate);

  // Poll every 15 seconds to simulate real-time updates
  const interval = setInterval(async () => {
    const odds = await fetchLiveOdds(leagueId, matchId);
    onUpdate(odds);
  }, 15000);

  return () => clearInterval(interval);
};
