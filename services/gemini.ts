/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const GEMINI_MODEL = 'gemini-3-pro-preview';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are the "Self-Speak Engine", an advanced linguistic AI.

YOUR GOAL:
Generate a personalized "Day 1" language profile.

INPUT:
User profile data including: Target Language, Gender, Name, Profession, Passion, Travel, Family, Routine, Environment, Diet, Essentials, Goals, Stories, Motivation, and Personality.

OUTPUT FORMAT:
Return strictly a JSON object matching this schema:

{
  "targetLanguage": "string",
  "gender": "string (Male or Female)",
  "identityTitle": "string (Creative title based on their persona)",
  "scriptSegments": [
    {
      "target": "string (The native script. Kanji/Kana for Japanese, Hanzi for Chinese, Ge'ez for Amharic, etc.)",
      "transliteration": "string (REQUIRED for non-Latin scripts: Romanized text e.g. Romaji, Pinyin, or Amharic transliteration)",
      "phonetic": "string (Phonetic pronunciation guide)",
      "native": "string (English translation of this specific segment)"
    }
  ],
  "vocabulary": [
    {
      "term": "string (The target language word in native script)",
      "transliteration": "string (REQUIRED: Romanized version if non-Latin)",
      "native": "string (English meaning)",
      "type": "string (Category e.g., Identity, Action, Object, Dream)"
    }
  ],
  "challenge": "string"
}

IMPORTANT GUIDELINES:
1. **Tone & Sentence Structure**: NATURAL, FLUENT, and ARTICULATE.
   - **Do NOT be robotic**. Use complex sentences with connecting words (while, because, additionally).
   - **Narrative Depth**: The script must be a substantial "Life Story" (approx. 400-600 words).
   - **Integration**: Explicitly weave the user's Name, Travel memories, Family members, Daily quirks, and Goals into a cohesive narrative. It should feel like a biography they would tell a close friend.

2. **Content & Vocabulary**: 
   - **Vocabulary List**: The "vocabulary" array MUST be very comprehensive (20-30 items).
     - **EXTRACT ALL** key nouns and verbs used in the story.
     - **REQUIRED**: Every vocabulary item MUST have a "transliteration" field if the target language is non-Latin (like Amharic or Japanese).

3. **Amharic Specifics**: If the language is Amharic, use the Ge'ez script for "target" and "term", and provide standard Romanization in "transliteration".

4. **Alignment**: Break the script into small, meaningful segments (1-4 words) for perfect alignment.

EXAMPLE INPUT:
Language: Japanese. Gender: Female. Name: Yuki.
EXAMPLE SEGMENTS:
[
  {"target": "私の名前は", "transliteration": "Watashi no namae wa", "phonetic": "wah-tah-shee noh nah-mah-eh wah", "native": "My name is"},
  {"target": "ユキです", "transliteration": "Yuki desu", "phonetic": "yu-kee dess", "native": "Yuki"}
]`;

export interface UserProfile {
  targetLanguage: string;
  gender: 'Male' | 'Female';
  name: string;
  profession: string;
  passion: string;
  travel: string;
  family: string;
  routine: string;
  environment: string;
  diet: string;
  essentials: string;
  goals: string;
  stories: string;
  motivation: string;
  personality: string;
}

export async function generateIdentityProfile(profile: UserProfile): Promise<string> {
  const prompt = `
    Target Language: ${profile.targetLanguage}
    Voice Gender: ${profile.gender}
    User Name: ${profile.name}
    Profession: ${profile.profession}
    Passion: ${profile.passion}
    Travel Experiences/Dreams: ${profile.travel}
    Family & Relationships: ${profile.family}
    Daily Routine: ${profile.routine}
    Living Environment: ${profile.environment}
    Diet/Favorite Foods: ${profile.diet}
    Essential Objects: ${profile.essentials}
    Goals: ${profile.goals}
    Unique Stories/Traits: ${profile.stories}
    Motivation: ${profile.motivation}
    Personality/Traits: ${profile.personality}
    
    TASK:
    Generate a LONG (400-600 words) and detailed self-introduction narrative.
    Ensure every detail provided (Name, Travel, Quirk, etc.) is incorporated naturally.
    Ensure non-Latin scripts (Amharic, Japanese, Chinese) include 'transliteration' in the vocabulary list and segments.
    Extract 20-30 vocabulary words.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    let text = response.text || "{}";
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    
    return text;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}