import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn("VITE_API_KEY environment variable not set. Gemini API features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getCreativeStoryStream = async (title: string, description: string) => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  const prompt = `You are a creative storyteller. Based on the ancient manuscript titled "${title}" which is about "${description}", write a short, imaginative story (around 100 words) that could be inspired by it. Make it engaging for a general audience. The story should evoke a sense of history, mystery, or wisdom.`;

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-flash-preview-04-17",
    contents: prompt,
    config: {
        temperature: 0.8,
        topP: 0.95,
    }
  });

  return response;
};