// ---------------------------------------------------------------------------
// In-memory data store — used as primary store or fallback/cache when Google
// Sheets is not configured.
// ---------------------------------------------------------------------------

const sessions = new Map();
const messages = new Map();
const summaries = new Map();

/**
 * Persist a new session record.
 */
export function saveSession(sessionId, user) {
  sessions.set(sessionId, {
    sessionId,
    user,
    startTime: new Date().toISOString(),
    status: 'active',
    exchangeCount: 0,
  });
}

/**
 * Append a message to the conversation history for the given session.
 */
export function addMessage(sessionId, role, content) {
  if (!messages.has(sessionId)) {
    messages.set(sessionId, []);
  }
  messages.get(sessionId).push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  // Increment exchange count on user messages
  if (role === 'user') {
    const sess = sessions.get(sessionId);
    if (sess) {
      sess.exchangeCount = (sess.exchangeCount || 0) + 1;
    }
  }
}

/**
 * Retrieve all messages for a given session.
 */
export function getSessionMessages(sessionId) {
  return messages.get(sessionId) || [];
}

/**
 * Store the generated summary object for a session.
 */
export function saveSummary(sessionId, summary) {
  summaries.set(sessionId, summary);

  // Also mark the session as completed
  const sess = sessions.get(sessionId);
  if (sess) {
    sess.status = 'completed';
  }
}

/**
 * Return every session as an array of objects.
 */
export function getAllSessions() {
  return Array.from(sessions.entries()).map(([id, data]) => ({
    sessionId: id,
    ...data,
  }));
}

/**
 * Return a single session record.
 */
export function getSession(sessionId) {
  return sessions.get(sessionId);
}

/**
 * Retrieve a stored summary.
 */
export function getSummary(sessionId) {
  return summaries.get(sessionId);
}
