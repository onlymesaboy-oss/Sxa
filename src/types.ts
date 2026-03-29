export interface Fixture {
  opponent: string;
  isHome: boolean;
  date: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  form: string[]; // e.g., ['W', 'D', 'L', 'W', 'W']
  goalsScored: number;
  goalsConceded: number;
  upcomingFixtures?: Fixture[];
}

export interface League {
  id: string;
  name: string;
  country: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  league: League;
  date: string;
}

export interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string; // e.g., '45', 'FT', 'Live'
  league: string;
}

export interface Prediction {
  correctScore: string;
  overUnder: string;
  marketOverUnder: string;
  asianHandicap: string;
  marketHdp: string; // The current market handicap (e.g., 'Home -0.75')
  suggestedHdp: string; // The AI's suggested bet based on market (e.g., 'Away +0.75')
  btts: 'Yes' | 'No';
  halfTimeResult: 'Home' | 'Draw' | 'Away';
  corners: string;
  confidence: number;
  reasoning: string[];
  h2h: {
    homeWins: number;
    awayWins: number;
    draws: number;
  };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  enrichedTeams?: {
    home: {
      logo: string;
      form: string[];
      description: string;
    };
    away: {
      logo: string;
      form: string[];
      description: string;
    };
  };
  stadium?: string;
  startTime?: string;
}

export interface MatchStats {
  h2h: {
    homeWins: number;
    awayWins: number;
    draws: number;
  };
}

export interface LiveScore {
  homeTeam: string;
  awayTeam: string;
  score: string;
  status: string; // e.g., '45'', 'FT', 'LIVE'
  league: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'user' | 'admin' | 'analyst' | 'editor';
  createdAt: any;
}

export interface LiveOdds {
  home: number;
  draw: number;
  away: number;
  lastUpdated: string;
  change?: 'up' | 'down' | 'stable';
}
