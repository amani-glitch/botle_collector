import { useState, useEffect } from 'react';

interface Session {
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: string;
  exchanges: number;
  createdAt: string;
}

interface TranscriptEntry {
  role: string;
  content: string;
  timestamp: string;
}

export default function Admin() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });

  const [transcript, setTranscript] = useState<TranscriptEntry[] | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const headers = { 'X-Admin-Password': password };

  async function handleLogin() {
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/sessions', { headers });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Invalid password');
        }
        throw new Error('Failed to fetch sessions');
      }

      const data = await res.json();
      setSessions(data.sessions || []);
      setStats(
        data.stats || {
          total: (data.sessions || []).length,
          completed: (data.sessions || []).filter(
            (s: Session) => s.status === 'completed'
          ).length,
          inProgress: (data.sessions || []).filter(
            (s: Session) => s.status === 'active' || s.status === 'in_progress'
          ).length,
        }
      );
      setAuthenticated(true);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function refreshSessions() {
    try {
      const res = await fetch('/api/admin/sessions', { headers });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setStats(
          data.stats || {
            total: (data.sessions || []).length,
            completed: (data.sessions || []).filter(
              (s: Session) => s.status === 'completed'
            ).length,
            inProgress: (data.sessions || []).filter(
              (s: Session) => s.status === 'active' || s.status === 'in_progress'
            ).length,
          }
        );
      }
    } catch {
      // Silent refresh failure
    }
  }

  async function viewTranscript(session: Session) {
    setSelectedSession(session);
    setTranscriptLoading(true);
    setTranscript(null);

    try {
      const res = await fetch(
        `/api/admin/transcript/${session.sessionId}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setTranscript(data.transcript || data || []);
      } else {
        setTranscript([]);
      }
    } catch {
      setTranscript([]);
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function exportCSV() {
    try {
      const res = await fetch('/api/admin/export', { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `botler-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Export failed
    }
  }

  function closeModal() {
    setSelectedSession(null);
    setTranscript(null);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  // Login gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-brand-card rounded-2xl shadow-2xl shadow-black/30 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center font-bold text-white text-lg">
              B
            </div>
            <div>
              <h1 className="text-lg font-semibold text-brand-text">Admin Panel</h1>
              <p className="text-xs text-slate-400">Botler 360 Process Discovery</p>
            </div>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {authError}
            </div>
          )}

          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter admin password"
            className="w-full bg-brand-bg border border-slate-700 rounded-lg px-4 py-3 text-brand-text placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors mb-4"
          />
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full bg-brand-accent hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              'Sign In'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Top bar */}
      <header className="bg-brand-card border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-accent rounded-full flex items-center justify-center font-bold text-white text-sm">
            B
          </div>
          <div>
            <h1 className="text-sm font-semibold text-brand-text">
              Botler 360 Admin
            </h1>
            <p className="text-xs text-slate-400">Process Discovery Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshSessions}
            className="text-sm text-slate-400 hover:text-brand-text transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600"
          >
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="text-sm text-white bg-brand-accent hover:bg-blue-500 transition-colors px-4 py-1.5 rounded-lg"
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-card rounded-xl p-5 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Total Sessions
            </p>
            <p className="text-2xl font-bold text-brand-text">{stats.total}</p>
          </div>
          <div className="bg-brand-card rounded-xl p-5 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Completed
            </p>
            <p className="text-2xl font-bold text-brand-success">
              {stats.completed}
            </p>
          </div>
          <div className="bg-brand-card rounded-xl p-5 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              In Progress
            </p>
            <p className="text-2xl font-bold text-brand-accent">
              {stats.inProgress}
            </p>
          </div>
        </div>

        {/* Sessions table */}
        <div className="bg-brand-card rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-brand-text">Sessions</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500 text-sm">
              No sessions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      Department
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                      Exchanges
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                      Date
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {sessions.map((s) => (
                    <tr
                      key={s.sessionId}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 text-brand-text whitespace-nowrap">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-5 py-3 text-slate-300 whitespace-nowrap">
                        {s.role}
                      </td>
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap hidden md:table-cell">
                        {s.department || '-'}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            s.status === 'completed'
                              ? 'bg-brand-success/20 text-brand-success'
                              : 'bg-brand-accent/20 text-brand-accent'
                          }`}
                        >
                          {s.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">
                        {s.exchanges ?? '-'}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs hidden lg:table-cell">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => viewTranscript(s)}
                          className="text-brand-accent hover:text-blue-400 text-xs font-medium transition-colors"
                        >
                          View transcript
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transcript Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-brand-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">
                  Transcript: {selectedSession.firstName}{' '}
                  {selectedSession.lastName}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedSession.role}
                  {selectedSession.department
                    ? ` - ${selectedSession.department}`
                    : ''}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-brand-text transition-colors p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto chat-scroll px-6 py-4 space-y-4">
              {transcriptLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg
                    className="animate-spin h-6 w-6 text-brand-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              ) : transcript && transcript.length > 0 ? (
                (Array.isArray(transcript) ? transcript : []).map(
                  (entry, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        entry.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                          entry.role === 'user'
                            ? 'bg-brand-accent/20 text-blue-200 rounded-2xl rounded-br-md'
                            : 'bg-brand-bg text-brand-text rounded-2xl rounded-bl-md'
                        }`}
                      >
                        <p className="text-xs text-slate-500 mb-1">
                          {entry.role === 'user' ? 'Participant' : 'Botler'}
                          {entry.timestamp
                            ? ` - ${formatDate(entry.timestamp)}`
                            : ''}
                        </p>
                        {entry.content}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center text-slate-500 py-12 text-sm">
                  No transcript data available
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-slate-700/50 shrink-0 flex justify-end">
              <button
                onClick={closeModal}
                className="text-sm text-slate-400 hover:text-brand-text transition-colors px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
