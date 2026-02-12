import { Router } from 'express';
import { getSessions as getSheetSessions } from '../services/sheets.js';
import {
  getAllSessions,
  getSessionMessages,
  getSummary,
} from '../services/store.js';

const router = Router();

// ---------------------------------------------------------------------------
// Middleware: verify admin password
// ---------------------------------------------------------------------------
function requireAdmin(req, res, next) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(503).json({ error: 'Admin access is not configured.' });
  }

  const supplied = req.headers['x-admin-password'];
  if (!supplied || supplied !== adminPassword) {
    return res.status(403).json({ error: 'Forbidden. Invalid admin password.' });
  }

  next();
}

router.use(requireAdmin);

// ---------------------------------------------------------------------------
// GET /api/admin/sessions
// ---------------------------------------------------------------------------
router.get('/sessions', async (_req, res) => {
  try {
    // Try Google Sheets first; fall back to in-memory store
    let sessions;
    try {
      sessions = await getSheetSessions();
    } catch {
      sessions = null;
    }

    if (!sessions || sessions.length === 0) {
      sessions = getAllSessions();
    }

    // Flatten user data for the frontend
    const flat = sessions.map((s) => {
      const user = s.user || {};
      return {
        sessionId: s.sessionId,
        firstName: user.firstName || s.firstName || '',
        lastName: user.lastName || s.lastName || '',
        email: user.email || s.email || '',
        role: user.role || s.role || '',
        department: user.department || s.department || '',
        status: s.status || 'active',
        exchanges: s.exchangeCount || 0,
        createdAt: s.startTime || s.createdAt || '',
      };
    });

    return res.json({ sessions: flat });
  } catch (err) {
    console.error('[Admin] Get sessions error:', err);
    return res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/transcript/:sessionId
// ---------------------------------------------------------------------------
router.get('/transcript/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = getSessionMessages(sessionId);

    if (!messages || messages.length === 0) {
      return res.status(404).json({ error: 'No transcript found for this session.' });
    }

    return res.json({ sessionId, transcript: messages });
  } catch (err) {
    console.error('[Admin] Get transcript error:', err);
    return res.status(500).json({ error: 'Failed to retrieve transcript.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/admin/export
// ---------------------------------------------------------------------------
router.get('/export', async (_req, res) => {
  try {
    let sessions;
    try {
      sessions = await getSheetSessions();
    } catch {
      sessions = null;
    }

    if (!sessions || sessions.length === 0) {
      sessions = getAllSessions();
    }

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({ error: 'No session data to export.' });
    }

    // Build CSV
    const headers = [
      'sessionId',
      'firstName',
      'lastName',
      'email',
      'role',
      'department',
      'tenure',
      'startTime',
      'status',
      'exchangeCount',
    ];

    const escapeCSV = (val) => {
      if (val == null) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = sessions.map((s) => {
      const user = s.user || {};
      return [
        s.sessionId,
        user.firstName,
        user.lastName,
        user.email,
        user.role,
        user.department,
        user.tenure,
        s.startTime,
        s.status,
        s.exchangeCount,
      ]
        .map(escapeCSV)
        .join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sessions-export.csv"');
    return res.send(csv);
  } catch (err) {
    console.error('[Admin] Export error:', err);
    return res.status(500).json({ error: 'Failed to export sessions.' });
  }
});

export default router;
