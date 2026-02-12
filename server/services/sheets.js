import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import {
  saveSession as memorySaveSession,
  addMessage as memoryAddMessage,
  saveSummary as memorySaveSummary,
  getAllSessions as memoryGetAllSessions,
  getSessionMessages as memoryGetMessages,
} from './store.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let doc = null;
let offline = false;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Authenticate with Google Sheets and load the spreadsheet.
 * If credentials are missing, enter "offline mode" — all write operations
 * become no-ops that log to the console instead.
 */
export async function initSheets() {
  const credsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEETS_ID;

  if (!credsJson || !sheetId) {
    offline = true;
    console.warn('[Sheets] Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_ID — running in offline mode.');
    return;
  }

  try {
    const creds = JSON.parse(credsJson);

    const auth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    doc = new GoogleSpreadsheet(sheetId, auth);
    await doc.loadInfo();
    console.log(`[Sheets] Connected to "${doc.title}"`);
  } catch (err) {
    offline = true;
    console.warn('[Sheets] Failed to connect — running in offline mode.', err.message);
  }
}

// ---------------------------------------------------------------------------
// Helper: get or create a sheet tab by title
// ---------------------------------------------------------------------------

async function getOrCreateSheet(title, headerValues) {
  if (!doc) return null;

  let sheet = doc.sheetsByTitle[title];
  if (!sheet) {
    sheet = await doc.addSheet({ title, headerValues });
  }
  return sheet;
}

// ---------------------------------------------------------------------------
// Logging functions
// ---------------------------------------------------------------------------

/**
 * Log a new session to the "Sessions" sheet.
 */
export async function logSession(sessionId, user) {
  // Always persist in memory
  memorySaveSession(sessionId, user);

  if (offline) {
    console.log(`[Sheets:offline] logSession ${sessionId}`);
    return;
  }

  try {
    const sheet = await getOrCreateSheet('Sessions', [
      'sessionId',
      'firstName',
      'lastName',
      'email',
      'role',
      'department',
      'tenure',
      'startTime',
    ]);

    if (sheet) {
      await sheet.addRow({
        sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role || '',
        department: user.department || '',
        tenure: user.tenure || '',
        startTime: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Sheets] logSession error:', err.message);
  }
}

/**
 * Log a single message exchange to the "Responses" sheet.
 */
export async function logMessage(sessionId, msgIndex, role, content, phase) {
  // Always persist in memory
  memoryAddMessage(sessionId, role, content);

  if (offline) {
    console.log(`[Sheets:offline] logMessage ${sessionId} #${msgIndex} (${role})`);
    return;
  }

  try {
    const sheet = await getOrCreateSheet('Responses', [
      'sessionId',
      'msgIndex',
      'role',
      'content',
      'phase',
      'timestamp',
    ]);

    if (sheet) {
      await sheet.addRow({
        sessionId,
        msgIndex,
        role,
        content: content.substring(0, 50000), // guard against cell size limits
        phase,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Sheets] logMessage error:', err.message);
  }
}

/**
 * Log an array of tasks to the "TaskInventory" sheet.
 */
export async function logTaskInventory(sessionId, tasks) {
  if (offline) {
    console.log(`[Sheets:offline] logTaskInventory ${sessionId} (${tasks.length} tasks)`);
    return;
  }

  try {
    const sheet = await getOrCreateSheet('TaskInventory', [
      'sessionId',
      'step',
      'durationMin',
      'tools',
      'manual',
      'timestamp',
    ]);

    if (sheet) {
      const rows = tasks.map((task) => ({
        sessionId,
        step: task.step || '',
        durationMin: task.duration_min ?? '',
        tools: Array.isArray(task.tools) ? task.tools.join(', ') : '',
        manual: task.manual ?? '',
        timestamp: new Date().toISOString(),
      }));

      await sheet.addRows(rows);
    }
  } catch (err) {
    console.error('[Sheets] logTaskInventory error:', err.message);
  }
}

/**
 * Log the interview summary to the "Summary" sheet.
 */
export async function logSummary(sessionId, user, summaryJson) {
  // Always persist in memory
  memorySaveSummary(sessionId, summaryJson);

  if (offline) {
    console.log(`[Sheets:offline] logSummary ${sessionId}`);
    return;
  }

  try {
    const sheet = await getOrCreateSheet('Summary', [
      'sessionId',
      'firstName',
      'lastName',
      'role',
      'department',
      'summaryJson',
      'timestamp',
    ]);

    if (sheet) {
      await sheet.addRow({
        sessionId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || '',
        department: user.department || '',
        summaryJson: JSON.stringify(summaryJson),
        timestamp: new Date().toISOString(),
      });
    }

    // Also log process map tasks to TaskInventory if present
    if (summaryJson && Array.isArray(summaryJson.process_map)) {
      await logTaskInventory(sessionId, summaryJson.process_map);
    }
  } catch (err) {
    console.error('[Sheets] logSummary error:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Read functions
// ---------------------------------------------------------------------------

/**
 * Retrieve all sessions. Uses Google Sheets when available, otherwise
 * falls back to the in-memory store.
 */
export async function getSessions() {
  if (offline || !doc) {
    return memoryGetAllSessions();
  }

  try {
    const sheet = doc.sheetsByTitle['Sessions'];
    if (!sheet) return memoryGetAllSessions();

    const rows = await sheet.getRows();
    return rows.map((row) => ({
      sessionId: row.get('sessionId'),
      user: {
        firstName: row.get('firstName'),
        lastName: row.get('lastName'),
        email: row.get('email'),
        role: row.get('role'),
        department: row.get('department'),
        tenure: row.get('tenure'),
      },
      startTime: row.get('startTime'),
    }));
  } catch (err) {
    console.error('[Sheets] getSessions error:', err.message);
    return memoryGetAllSessions();
  }
}

/**
 * Retrieve messages for a session from the in-memory store.
 * (Reading individual message rows from Sheets for a specific session is
 * expensive; we use the in-memory store which is populated on every logMessage call.)
 */
export function getMessages(sessionId) {
  return memoryGetMessages(sessionId);
}
