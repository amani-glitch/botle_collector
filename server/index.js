import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { appendInterviewRow } from './sheets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Gemini client (server-side only — key never sent to browser) ──
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ── In-memory chat sessions ──
const chatSessions = new Map();
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of chatSessions) {
    if (now - session.createdAt > SESSION_TTL) {
      chatSessions.delete(id);
    }
  }
}, 15 * 60 * 1000);

// ── Security ──
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: isProd ? true : (process.env.CORS_ORIGIN || 'http://localhost:8009'),
  methods: ['POST', 'GET'],
}));
app.use(express.json({ limit: '2mb' }));

// Rate limiting — 60 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ── Gemini guard middleware ──
function requireGemini(req, res, next) {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API not configured. Set GEMINI_API_KEY on the server.' });
  }
  next();
}

// ═══════════════════════════════════════
// Chat proxy endpoints
// ═══════════════════════════════════════

// POST /api/chat/start — create a new chat session
app.post('/api/chat/start', requireGemini, async (req, res) => {
  try {
    const { systemInstruction, triggerMessage } = req.body;
    if (!systemInstruction || !triggerMessage) {
      return res.status(400).json({ error: 'systemInstruction and triggerMessage are required' });
    }

    const chatId = uuidv4();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
    });

    const response = await chat.sendMessage({ message: triggerMessage });
    chatSessions.set(chatId, { chat, createdAt: Date.now() });

    res.json({ chatId, response: response.text });
  } catch (err) {
    console.error('Chat start error:', err.message);
    res.status(500).json({ error: 'Failed to start chat session' });
  }
});

// POST /api/chat/message — send a message to an existing chat
app.post('/api/chat/message', requireGemini, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ error: 'chatId and message are required' });
    }

    const session = chatSessions.get(chatId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found or expired' });
    }

    const response = await session.chat.sendMessage({ message });
    session.createdAt = Date.now(); // refresh TTL

    res.json({ response: response.text });
  } catch (err) {
    console.error('Chat message error:', err.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ═══════════════════════════════════════
// Summary proxy endpoint
// ═══════════════════════════════════════

app.post('/api/summary', requireGemini, async (req, res) => {
  try {
    const { transcript, summaryPrompt } = req.body;
    if (!transcript || !summaryPrompt) {
      return res.status(400).json({ error: 'transcript and summaryPrompt are required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `TRANSCRIPT:\n${transcript}\n\n${summaryPrompt}`,
      config: { responseMimeType: 'application/json' },
    });

    res.json({ summary: response.text });
  } catch (err) {
    console.error('Summary error:', err.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ═══════════════════════════════════════
// WebSocket proxy for Gemini Live Voice
// ═══════════════════════════════════════

const wss = new WebSocketServer({ server: httpServer, path: '/api/live' });

wss.on('connection', (ws) => {
  let geminiSession = null;

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'config') {
        if (!ai) {
          ws.send(JSON.stringify({ type: 'error', message: 'Gemini API not configured' }));
          return;
        }

        geminiSession = await ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: msg.speechConfig,
            systemInstruction: msg.systemInstruction,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              ws.send(JSON.stringify({ type: 'connected' }));
            },
            onmessage: (message) => {
              // Extract only serialisable fields
              const payload = { type: 'message', data: { serverContent: message.serverContent } };
              ws.send(JSON.stringify(payload));
            },
            onerror: (e) => {
              ws.send(JSON.stringify({ type: 'error', message: String(e) }));
            },
            onclose: () => {
              ws.send(JSON.stringify({ type: 'closed' }));
            },
          },
        });
      } else if (msg.type === 'audio' && geminiSession) {
        geminiSession.sendRealtimeInput({ media: msg.media });
      } else if (msg.type === 'close' && geminiSession) {
        geminiSession.close();
      }
    } catch (err) {
      console.error('Live proxy error:', err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    if (geminiSession) {
      try { geminiSession.close(); } catch {}
    }
  });
});

// ═══════════════════════════════════════
// Sheets export (existing)
// ═══════════════════════════════════════

function validateExportPayload(body) {
  const errors = [];

  if (!body.employee_name || typeof body.employee_name !== 'string' || body.employee_name.trim().length < 1) {
    errors.push('employee_name is required');
  }
  if (!body.employee_role || typeof body.employee_role !== 'string') {
    errors.push('employee_role is required');
  }
  if (!body.department || typeof body.department !== 'string') {
    errors.push('department is required');
  }
  const validDepts = ['Operations', 'Sales', 'Marketing', 'Finance', 'IT', 'Management'];
  if (body.department && !validDepts.includes(body.department)) {
    errors.push(`department must be one of: ${validDepts.join(', ')}`);
  }
  if (!body.session_id || typeof body.session_id !== 'string') {
    errors.push('session_id is required');
  }
  if (!body.completion_status || !['started', 'in_progress', 'completed', 'abandoned'].includes(body.completion_status)) {
    errors.push('completion_status must be one of: started, in_progress, completed, abandoned');
  }

  const sanitize = (val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/[<>]/g, '');
  };

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    data: {
      timestamp: new Date().toISOString(),
      employee_name: sanitize(body.employee_name.trim()),
      employee_role: sanitize(body.employee_role.trim()),
      department: body.department,
      session_id: body.session_id,
      raw_transcript: sanitize(body.raw_transcript || ''),
      interview_transcript: body.interview_transcript || [],
      process_map: body.process_map || [],
      pain_points: body.pain_points || [],
      tools_used: body.tools_used || [],
      automation_opportunities: body.automation_opportunities || [],
      time_estimates: body.time_estimates || {},
      interaction_style: body.interaction_style || {},
      completion_status: body.completion_status,
    },
  };
}

app.post('/api/export-to-sheet', async (req, res) => {
  if (!SHEET_ID) {
    return res.status(503).json({
      error: 'Google Sheets integration is not configured. Set GOOGLE_SHEET_ID in .env',
    });
  }

  const validation = validateExportPayload(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  try {
    const result = await appendInterviewRow(SHEET_ID, validation.data);
    return res.json({
      success: true,
      message: 'Interview data exported to Google Sheets',
      updatedRange: result.updates?.updatedRange,
    });
  } catch (err) {
    console.error('Sheets export error:', err.message);
    return res.status(500).json({
      error: 'Failed to export to Google Sheets',
      details: err.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    gemini_configured: !!GEMINI_API_KEY,
    sheets_configured: !!SHEET_ID,
    timestamp: new Date().toISOString(),
  });
});

// In production, serve the built frontend
if (isProd) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Botler API server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  console.log(`Gemini API: ${GEMINI_API_KEY ? 'configured' : 'NOT configured — set GEMINI_API_KEY'}`);
  console.log(`Google Sheets: ${SHEET_ID ? 'configured' : 'NOT configured — set GOOGLE_SHEET_ID'}`);
});
