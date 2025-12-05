import { GoogleGenAI, Type } from "@google/genai";
import { TracingWord } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNewTracingWord = async (excludeWords: string[]): Promise<TracingWord | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a single, simple word suitable for a 3-year-old child to learn to trace and write. 
      The word should be 3-5 letters long. Lowercase only.
      Do not use these words: ${excludeWords.join(", ")}.
      Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The word to trace (lowercase).",
            },
            category: {
              type: Type.STRING,
              description: "A simple category for the word (e.g., Animals, Food, Home).",
            }
          },
          required: ["text", "category"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.text && result.category) {
      return {
        text: result.text.toLowerCase(),
        category: result.category,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to generate word:", error);
    return null;
  }
};
