import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../prompts/system.js';
import { logMessage, logSummary } from '../services/sheets.js';
import { addMessage as storeMessage } from '../services/store.js';

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PHASE_LABELS = {
  1: 'Warm Up',
  2: 'Daily Operations',
  3: 'Pain Points',
  4: 'Data & Communication',
  5: 'Wishes',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the current interview phase based on exchange count.
 */
function computePhase(exchangeCount) {
  if (exchangeCount <= 3) return 1;
  if (exchangeCount <= 10) return 2;
  if (exchangeCount <= 16) return 3;
  if (exchangeCount <= 21) return 4;
  return 5;
}

/**
 * Require an active session. Returns true if the check passed; sends 401 otherwise.
 */
function requireSession(req, res) {
  if (!req.session || !req.session.user) {
    res.status(401).json({ error: 'Not authenticated. Please log in first.' });
    return false;
  }
  return true;
}

/**
 * Generate a structured summary via a non-streaming Claude call.
 */
async function generateSummary(sessionMessages, user) {
  const summaryInstruction = `Based on the entire conversation above, produce ONLY the structured JSON summary as described in your system prompt. No additional text — just valid JSON.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: getSystemPrompt(user),
    messages: [
      ...sessionMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: summaryInstruction },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Attempt to parse as JSON; if it fails, return the raw text wrapped in an object
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat/message
// ---------------------------------------------------------------------------
router.post('/message', async (req, res) => {
  if (!requireSession(req, res)) return;

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A non-empty message string is required.' });
  }

  try {
    const { user, sessionId } = req.session;

    // Record user message
    req.session.messages.push({ role: 'user', content: message });
    storeMessage(sessionId, 'user', message);

    // Update exchange count and phase
    req.session.exchangeCount += 1;
    const previousPhase = req.session.phase;
    req.session.phase = computePhase(req.session.exchangeCount);
    const currentPhase = req.session.phase;

    // Build the message list for Claude
    const systemPrompt = getSystemPrompt(user);
    const claudeMessages = req.session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Stream the response from Anthropic
    let fullResponse = '';

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: claudeMessages,
    });

    stream.on('text', (text) => {
      fullResponse += text;
      const chunk = JSON.stringify({ text });
      res.write(`data: ${chunk}\n\n`);
    });

    stream.on('error', (err) => {
      console.error('[Chat] Stream error:', err);
      const errorPayload = JSON.stringify({ error: 'Stream interrupted.' });
      res.write(`data: ${errorPayload}\n\n`);
      res.end();
    });

    stream.on('end', async () => {
      // Store assistant response
      req.session.messages.push({ role: 'assistant', content: fullResponse });
      storeMessage(sessionId, 'assistant', fullResponse);

      // Send phase metadata
      const donePayload = JSON.stringify({
        done: true,
        phase: {
          current: currentPhase,
          total: 5,
          label: PHASE_LABELS[currentPhase],
        },
      });
      res.write(`data: ${donePayload}\n\n`);

      // Fire-and-forget: log message to Sheets
      const msgIndex = req.session.messages.length;
      logMessage(sessionId, msgIndex - 1, 'user', message, currentPhase).catch((err) => {
        console.warn('[Sheets] logMessage (user) failed:', err.message);
      });
      logMessage(sessionId, msgIndex, 'assistant', fullResponse, currentPhase).catch((err) => {
        console.warn('[Sheets] logMessage (assistant) failed:', err.message);
      });

      // If phase reaches 5 or exchange count exceeds 25, generate summary
      if (
        (currentPhase === 5 && previousPhase !== 5) ||
        req.session.exchangeCount > 25
      ) {
        try {
          const summary = await generateSummary(req.session.messages, user);
          logSummary(sessionId, user, summary).catch((err) => {
            console.warn('[Sheets] logSummary failed:', err.message);
          });
        } catch (err) {
          console.error('[Chat] Summary generation failed:', err.message);
        }
      }

      // Save session to persist updated messages array
      req.session.save((err) => {
        if (err) console.warn('[Session] Save warning:', err.message);
      });

      res.end();
    });
  } catch (err) {
    console.error('[Chat] Message error:', err);
    // If headers are already sent we cannot send JSON
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to process message.' });
    }
    res.end();
  }
});

// ---------------------------------------------------------------------------
// POST /api/chat/end
// ---------------------------------------------------------------------------
router.post('/end', async (req, res) => {
  if (!requireSession(req, res)) return;

  try {
    const { user, sessionId, messages: sessionMessages } = req.session;

    // Generate the final summary
    const summary = await generateSummary(sessionMessages, user);

    // Log to Sheets (fire-and-forget)
    logSummary(sessionId, user, summary).catch((err) => {
      console.warn('[Sheets] logSummary failed:', err.message);
    });

    // Clear the session
    req.session.destroy((err) => {
      if (err) console.warn('[Session] Destroy warning:', err.message);
    });

    return res.json({ summary });
  } catch (err) {
    console.error('[Chat] End session error:', err);
    return res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

export default router;
