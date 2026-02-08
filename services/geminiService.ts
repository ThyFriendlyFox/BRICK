
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Platform } from "../types";

// ─── API Key Management ──────────────────────────────────────────────────────

const STORAGE_KEY = 'brick_gemini_api_key';

/**
 * Get the current API key (from localStorage, then env fallback).
 */
export function getApiKey(): string {
  // User-configured key takes priority
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  // Env fallback (from .env / vite define)
  return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
}

/**
 * Save an API key (persists across sessions).
 */
export function setApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Check if an API key is configured.
 */
export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

// ─── Gemini Client (lazy, recreated when key changes) ────────────────────────

let cachedKey = '';
let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const key = getApiKey();
  if (!key) return null;
  if (key !== cachedKey || !ai) {
    ai = new GoogleGenAI({ apiKey: key });
    cachedKey = key;
  }
  return ai;
}

// ─── Draft Generation ────────────────────────────────────────────────────────

interface GeneratedContent {
  title?: string;
  content: string;
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A catchy title, required for Reddit, optional for X and Discord."
    },
    content: {
      type: Type.STRING,
      description: "The body of the social media post. For X, use newlines to separate thread tweets if long."
    }
  },
  required: ["content"]
};

export const generateDraftContent = async (
  platform: Platform,
  context: string,
  codeSnippet?: string,
  toneContext?: string
): Promise<GeneratedContent> => {
  const client = getClient();

  if (!client) {
     // Fallback for demo without key
     return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                title: platform === Platform.REDDIT ? "Update: " + context : undefined,
                content: `[NO API KEY]\n\nAdd your Gemini API key in Settings → AI Engine to enable AI drafts.\n\nContext: ${context}`
            })
        }, 500);
     });
  }

  try {
    const prompt = `
      You are BRICK, an AI assistant for a developer.
      Task: Write a social media post for ${platform} based on the following recent coding activity.
      
      Activity Context: ${context}
      ${codeSnippet ? `Related Code:\n${codeSnippet}` : ''}

      ${toneContext ? `
      IMPORTANT - USER TONE/STYLE:
      Emulate the writing style, vocabulary, and sentence structure found in these examples provided by the user:
      """
      ${toneContext}
      """
      ` : ''}

      Style Guide (if not overridden by User Tone above):
      - Brutalist, concise, technical but accessible.
      - Lowercase aesthetics preferred but use proper nouns.
      - Use 1-2 emojis max.
      - For X: If it's long, format it as a thread separated by double newlines.
      - For Reddit: Provide a strong title and a markdown formatted body.
      - For Discord: Use Discord-flavored markdown (code blocks, bolding). Keep it community-focused. Imagine it's for a #changelog or #dev-log channel.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return {
      title: "Error Generating Draft",
      content: "Could not generate draft. Please check your API Key in Settings → AI Engine."
    };
  }
};
