
import { SUMMARY_PROMPT } from "../constants";

// ── Chat API (proxied through backend) ──

export const startChat = async (
  systemInstruction: string,
  triggerMessage: string
): Promise<{ chatId: string; response: string }> => {
  const res = await fetch('/api/chat/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemInstruction, triggerMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start chat');
  }
  return res.json();
};

export const sendChatMessage = async (
  chatId: string,
  message: string
): Promise<string> => {
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  const data = await res.json();
  return data.response;
};

// ── Summary API (proxied through backend) ──

export const generateSummary = async (transcript: string): Promise<any> => {
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, summaryPrompt: SUMMARY_PROMPT }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate summary');
  }
  const data = await res.json();
  try {
    return JSON.parse(data.summary || '{}');
  } catch (e) {
    console.error("Failed to parse summary JSON", e);
    return null;
  }
};

// ── Live Voice WebSocket (proxied through backend) ──

export interface LiveProxyCallbacks {
  onconnected: () => void;
  onmessage: (message: any) => void;
  onerror: (error: string) => void;
  onclose: () => void;
}

export const connectLiveProxy = (
  systemInstruction: string,
  speechConfig: any,
  callbacks: LiveProxyCallbacks
): { sendAudio: (media: any) => void; close: () => void } => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'config',
      systemInstruction,
      speechConfig,
    }));
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'connected') {
      callbacks.onconnected();
    } else if (msg.type === 'message') {
      callbacks.onmessage(msg.data);
    } else if (msg.type === 'error') {
      callbacks.onerror(msg.message);
    } else if (msg.type === 'closed') {
      callbacks.onclose();
    }
  };

  ws.onerror = () => {
    callbacks.onerror('WebSocket connection error');
  };

  ws.onclose = () => {
    callbacks.onclose();
  };

  return {
    sendAudio: (media: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'audio', media }));
      }
    },
    close: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'close' }));
      }
      ws.close();
    },
  };
};

// ── Audio utilities (client-side only) ──

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
