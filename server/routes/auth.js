import { Router } from 'express';
import { logSession } from '../services/sheets.js';
import { saveSession } from '../services/store.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post('/login', (req, res) => {
  try {
    const { firstName, lastName, email, role, department, tenure } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'firstName, lastName, and email are required.' });
    }

    // Generate a unique session ID: HM_YYYYMMDD_HHMMSS_firstname
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const sessionId = `HM_${datePart}_${timePart}_${firstName.toLowerCase()}`;

    const user = { firstName, lastName, email, role, department, tenure };

    // Store in express-session
    req.session.sessionId = sessionId;
    req.session.user = user;
    req.session.messages = [];
    req.session.exchangeCount = 0;
    req.session.phase = 1;

    // Persist to in-memory store
    saveSession(sessionId, user);

    // Fire-and-forget: log to Google Sheets
    logSession(sessionId, user).catch((err) => {
      console.warn('[Sheets] logSession failed:', err.message);
    });

    return res.json({ sessionId, user });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

export default router;
