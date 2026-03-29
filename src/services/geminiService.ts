import { GoogleGenAI, Type } from "@google/genai";
import { Match, Prediction, LiveScore } from "../types";

export async function generateMatchPrediction(match: Match, liveContext?: { score: string; status: string; odds?: any }): Promise<Prediction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please check your environment variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const liveInfo = liveContext ? `
    LIVE MATCH STATUS:
    Current Score: ${liveContext.score}
    Match Status/Minute: ${liveContext.status}
    Current Live Odds: ${liveContext.odds ? JSON.stringify(liveContext.odds) : 'N/A'}
    
    CRITICAL: This is a LIVE match update. Your prediction MUST account for the current score and remaining time. 
    Adjust your 'correctScore' prediction, 'suggestedHdp', and 'reasoning' based on the current live situation.
  ` : '';

  const prompt = `
    Generate a detailed football match prediction for the following match:
    League: ${match.league.name}
    Home Team: ${match.homeTeam.name} (Form: ${match.homeTeam.form.join(', ')}, Goals Scored: ${match.homeTeam.goalsScored}, Goals Conceded: ${match.homeTeam.goalsConceded})
    Away Team: ${match.awayTeam.name} (Form: ${match.awayTeam.form.join(', ')}, Goals Scored: ${match.awayTeam.goalsScored}, Goals Conceded: ${match.awayTeam.goalsConceded})

    ${liveInfo}

    Note: If the provided form or goal stats are '?' or 0, please use your internal knowledge of the teams' historical performance and current standing to provide the most accurate prediction possible.
    
    Provide a realistic prediction based on current team strength and form.
    Also include realistic head-to-head (H2H) statistics for the last 10 encounters between these two teams.
    Finally, provide realistic 1X2 betting odds (decimal format) and the EXACT current MARKET ASIAN HANDICAP (HDP) and MARKET OVER/UNDER (O/U) lines for the match.
    
    CRITICAL: For the Market HDP and Market O/U, you MUST search for the specific match on multiple reputable sportsbooks (like Bet365, Pinnacle, or William Hill) via Google Search to find the ACTUAL current lines. 
    - ALWAYS prefix the HDP value with 'Home' or 'Away' to indicate which team the handicap applies to (e.g., 'Home -0.75' or 'Away +1.25').
    - For O/U, identify the ACTUAL line being traded (e.g., 2.5, 2.75, 3.0, 3.25). DO NOT just default to 2.5 if the market is different.
    - DO NOT guess or provide generic lines.
    - If a specific line is NOT currently offered by major sportsbooks, DO NOT suggest it.
    
    For the score prediction, provide ONLY ONE exact correct score outcome (e.g., '2-1'). 
    CRITICAL: DO NOT provide multiple options, alternatives, or a list of scores. Only provide the single most likely score.
    
    CONSISTENCY CHECK: Your Correct Score, Over/Under prediction, and BTTS prediction MUST be logically consistent. For example, if the Correct Score is '1-1', the O/U prediction for a 2.5 line MUST be 'Under' and BTTS MUST be 'Yes'.
    
    For the analysis (reasoning), provide a detailed breakdown in multiple points (at least 3-5 points) covering:
    
    Based on the ACTUAL market HDP, provide a SUGGESTED HDP bet (which team to back at what handicap).

    IMPORTANT: For each team, search for their OFFICIAL logo URL and current form (last 5 matches). 
    Also, search for the OFFICIAL STADIUM name where this match is played and the REAL-TIME START TIME (Kick-off time) for this match according to the latest betting or sports news.
    If the match is a 'Custom Match', use your search capabilities to find the most accurate and up-to-date details for these teams as they would appear on professional sports apps like AI SCORE.

    Language Requirement: The 'reasoning' field MUST be written in Khmer (Cambodian) in a natural, professional sports analysis style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correctScore: { 
              type: Type.STRING, 
              description: "The single most likely predicted final score (e.g., '2-1')" 
            },
            overUnder: { type: Type.STRING, description: "Predicted outcome for the market O/U line (e.g., 'Over 3.25' or 'Under 2.5')" },
            marketOverUnder: { type: Type.STRING, description: "The actual current market O/U line found via search (e.g., '3.25')" },
            asianHandicap: { type: Type.STRING, description: "General Asian handicap prediction" },
            marketHdp: { type: Type.STRING, description: "Current real-world market handicap with team label (e.g., 'Home -0.75')" },
            suggestedHdp: { type: Type.STRING, description: "AI suggested bet with team label (e.g., 'Away +0.75')" },
            btts: { type: Type.STRING, enum: ["Yes", "No"], description: "Both teams to score" },
            halfTimeResult: { type: Type.STRING, enum: ["Home", "Draw", "Away"], description: "Half-time result" },
            corners: { type: Type.STRING, description: "Predicted total corners (e.g., 'Over 9.5')" },
            confidence: { type: Type.NUMBER, description: "Confidence level from 0 to 100" },
            reasoning: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Detailed analysis points (at least 3-5 points)" 
            },
            h2h: {
              type: Type.OBJECT,
              properties: {
                homeWins: { type: Type.NUMBER, description: "Number of home team wins in last 10 H2H" },
                awayWins: { type: Type.NUMBER, description: "Number of away team wins in last 10 H2H" },
                draws: { type: Type.NUMBER, description: "Number of draws in last 10 H2H" }
              },
              required: ["homeWins", "awayWins", "draws"]
            },
            odds: {
              type: Type.OBJECT,
              properties: {
                home: { type: Type.NUMBER, description: "Decimal odds for Home win" },
                draw: { type: Type.NUMBER, description: "Decimal odds for Draw" },
                away: { type: Type.NUMBER, description: "Decimal odds for Away win" }
              },
              required: ["home", "draw", "away"]
            },
            enrichedTeams: {
              type: Type.OBJECT,
              properties: {
                home: {
                  type: Type.OBJECT,
                  properties: {
                    logo: { type: Type.STRING, description: "Official logo URL found via search" },
                    form: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Current form (last 5 matches, e.g., ['W', 'L', 'D', 'W', 'W'])" },
                    description: { type: Type.STRING, description: "Brief team summary" }
                  },
                  required: ["logo", "form", "description"]
                },
                away: {
                  type: Type.OBJECT,
                  properties: {
                    logo: { type: Type.STRING, description: "Official logo URL found via search" },
                    form: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Current form (last 5 matches)" },
                    description: { type: Type.STRING, description: "Brief team summary" }
                  },
                  required: ["logo", "form", "description"]
                }
              },
              required: ["home", "away"]
            },
            stadium: { type: Type.STRING, description: "Official stadium name where the match is played" },
            startTime: { type: Type.STRING, description: "Real-time start time (e.g., '20:00 UTC' or '19:45 Local Time')" }
          },
          required: ["correctScore", "overUnder", "marketOverUnder", "asianHandicap", "marketHdp", "suggestedHdp", "btts", "halfTimeResult", "corners", "confidence", "reasoning", "h2h", "odds", "enrichedTeams", "stadium", "startTime"]
        }
      }
    });

    if (!response.text) {
      throw new Error("AI returned an empty response.");
    }

    const result = JSON.parse(response.text);
    
    // Safety check: Ensure only one score is provided
    if (result.correctScore && typeof result.correctScore === 'string') {
      // If AI returns a list like "2-1, 1-0", take only the first one
      const scores = result.correctScore.split(/[,|/]/);
      if (scores.length > 1) {
        result.correctScore = scores[0].trim();
      }
    }

    return result as Prediction;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid")) {
      throw new Error("Invalid API Key. Please check your settings.");
    }
    throw new Error(error.message || "Failed to generate prediction. Please try again.");
  }
}

export async function enrichTeamDetails(teamName: string): Promise<{ logo: string; description: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Search for the official football team: "${teamName}".
    Provide their official logo URL and a brief 1-sentence description.
    If multiple teams exist with this name, choose the most prominent one.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            logo: { type: Type.STRING, description: "Official logo URL" },
            description: { type: Type.STRING, description: "Brief team summary" }
          },
          required: ["logo", "description"]
        }
      }
    });

    if (!response.text) throw new Error("Empty response");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Team Enrichment Error:", error);
    return {
      logo: 'https://media.api-sports.io/football/teams/0.png',
      description: 'Custom team'
    };
  }
}

export async function getLiveScores(): Promise<LiveScore[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Search for the current live football scores across major leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, etc.).
    Provide a list of 5-8 matches that are currently LIVE or recently finished (FT).
    Include the home team, away team, current score, match status (e.g., '45\\'', 'FT', 'LIVE'), and league name.
    If no major matches are live right now, provide the scores for the most recent matches from today.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              homeTeam: { type: Type.STRING },
              awayTeam: { type: Type.STRING },
              score: { type: Type.STRING },
              status: { type: Type.STRING },
              league: { type: Type.STRING }
            },
            required: ["homeTeam", "awayTeam", "score", "status", "league"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Live Scores Error:", error);
    return [];
  }
}

export async function getUpcomingMatches(): Promise<Match[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Search for the most prominent upcoming football matches for today and tomorrow across major European leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League).
    Provide a list of 6-8 featured matches.
    For each match, include:
    - Home team name
    - Away team name
    - League name
    - Date (in a readable format like 'Mar 17, 2026')
    - Official logo URLs for both teams (search for them)
    - A unique ID for the match
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              homeTeam: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  logo: { type: Type.STRING }
                },
                required: ["name", "logo"]
              },
              awayTeam: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  logo: { type: Type.STRING }
                },
                required: ["name", "logo"]
              },
              league: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING }
                },
                required: ["name"]
              },
              date: { type: Type.STRING }
            },
            required: ["id", "homeTeam", "awayTeam", "league", "date"]
          }
        }
      }
    });

    if (!response.text) return [];
    const data = JSON.parse(response.text);
    
    // Map to Match type
    return data.map((m: any) => ({
      ...m,
      homeTeam: {
        ...m.homeTeam,
        id: `h-${m.id}`,
        form: ['?', '?', '?', '?', '?'],
        goalsScored: 0,
        goalsConceded: 0
      },
      awayTeam: {
        ...m.awayTeam,
        id: `a-${m.id}`,
        form: ['?', '?', '?', '?', '?'],
        goalsScored: 0,
        goalsConceded: 0
      },
      league: {
        id: m.league.name.toLowerCase().replace(/\s+/g, '-'),
        name: m.league.name,
        country: 'International',
        logo: 'https://media.api-sports.io/football/leagues/0.png'
      }
    }));
  } catch (error) {
    console.error("Upcoming Matches Error:", error);
    return [];
  }
}
