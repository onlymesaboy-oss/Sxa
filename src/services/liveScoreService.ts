import { GoogleGenAI, Type } from "@google/genai";
import { LiveMatch } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const fetchLiveScores = async (): Promise<LiveMatch[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Find current live football scores for major leagues happening right now (or most recent ones if none live). Provide at least 5 matches.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              homeTeam: { type: Type.STRING },
              awayTeam: { type: Type.STRING },
              homeScore: { type: Type.NUMBER },
              awayScore: { type: Type.NUMBER },
              status: { type: Type.STRING, description: "Current minute or status like 'FT'" },
              league: { type: Type.STRING }
            },
            required: ["id", "homeTeam", "awayTeam", "homeScore", "awayScore", "status", "league"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return [];
  }
};
