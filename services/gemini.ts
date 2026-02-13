
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { BOTLER_SYSTEM_INSTRUCTION, SUMMARY_PROMPT } from "../constants";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateSummary = async (transcript: string): Promise<any> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `TRANSCRIPT:\n${transcript}\n\n${SUMMARY_PROMPT}`,
    config: {
      responseMimeType: 'application/json'
    }
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse summary JSON", e);
    return null;
  }
};

// Utility for audio encoding/decoding as requested
export const encodeAudio = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeAudio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};
