import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const PHASE_LABELS = [
  'Warm Up',
  'Daily Operations',
  'Pain Points',
  'Data & Communication',
  'Wishes',
];

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [phase, setPhase] = useState(1);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [summary, setSummary] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  // Check session on mount
  useEffect(() => {
    const session = localStorage.getItem('botler_session');
    if (!session) {
      navigate('/', { replace: true });
      return;
    }

    // Send initial greeting only once
    if (!initializedRef.current) {
      initializedRef.current = true;
      sendToAPI('Hello, I am ready to start the interview.', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on new messages or typing change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  async function sendToAPI(text: string, isGreeting = false) {
    setSending(true);
    setTyping(true);

    // Add user message to chat (skip for the initial hidden greeting)
    if (!isGreeting) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'user', text },
      ]);
    }

    // Create a placeholder for the bot message
    const botId = uid();

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let botText = '';
      let botMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.text) {
              botText += data.text;
              if (!botMessageAdded) {
                botMessageAdded = true;
                setTyping(false);
                setMessages((prev) => [
                  ...prev,
                  { id: botId, role: 'bot', text: botText },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botId ? { ...m, text: botText } : m
                  )
                );
              }
            }

            if (data.done && data.phase) {
              setPhase(data.phase.current || data.phase);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Handle case where full message arrived in one chunk without streaming
      if (!botMessageAdded && botText) {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: botId, role: 'bot', text: botText },
        ]);
      }
    } catch {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          role: 'bot',
          text: 'Sorry, something went wrong. Please try sending your message again.',
        },
      ]);
    } finally {
      setSending(false);
      setTyping(false);
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending || sessionEnded) return;
    setInput('');
    sendToAPI(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleEnd() {
    if (sessionEnded) return;
    setSending(true);

    try {
      const res = await fetch('/api/chat/end', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSummary(
          data.summary ||
            'Thank you for your time. Your insights are valuable and will help improve our processes.'
        );
      } else {
        setSummary(
          'Session ended. Thank you for your participation.'
        );
      }
    } catch {
      setSummary('Session ended. Thank you for your participation.');
    } finally {
      setSessionEnded(true);
      setSending(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('botler_session');
    navigate('/', { replace: true });
  }

  return (
    <div className="h-screen flex flex-col bg-brand-bg">
      {/* Header */}
      <header className="bg-brand-card border-b border-slate-700/50 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-accent rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0">
            B
          </div>
          <div>
            <h1 className="text-sm font-semibold text-brand-text leading-tight">
              Botler 360
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-brand-success rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">
                Process Discovery Assistant
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block">
            Phase {phase}/{PHASE_LABELS.length}
          </span>
          <span className="text-xs font-medium text-brand-accent">
            {PHASE_LABELS[phase - 1] || 'Complete'}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`msg-animate flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'bot' && (
              <div className="w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                B
              </div>
            )}
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-accent text-white rounded-2xl rounded-br-md'
                  : 'bg-brand-card text-brand-text rounded-2xl rounded-bl-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="msg-animate flex justify-start">
            <div className="w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
              B
            </div>
            <div className="bg-brand-card rounded-2xl rounded-bl-md px-5 py-4 flex items-center gap-1.5">
              <span className="dot-1 w-2 h-2 bg-slate-400 rounded-full inline-block" />
              <span className="dot-2 w-2 h-2 bg-slate-400 rounded-full inline-block" />
              <span className="dot-3 w-2 h-2 bg-slate-400 rounded-full inline-block" />
            </div>
          </div>
        )}

        {/* Session ended summary */}
        {sessionEnded && summary && (
          <div className="msg-animate flex justify-center">
            <div className="bg-brand-card border border-slate-700 rounded-2xl px-6 py-5 max-w-md text-center">
              <div className="w-10 h-10 bg-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-brand-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-brand-text mb-4">{summary}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-brand-accent hover:text-blue-400 transition-colors"
              >
                Return to home
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!sessionEnded && (
        <div className="bg-brand-card border-t border-slate-700/50 px-4 py-3 shrink-0">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={sending}
              rows={1}
              className="flex-1 bg-brand-bg border border-slate-700 rounded-xl px-4 py-3 text-sm text-brand-text placeholder-slate-500 resize-none focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="w-10 h-10 bg-brand-accent hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors shrink-0"
            >
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* End session link */}
          <div className="text-center mt-2">
            <button
              onClick={handleEnd}
              disabled={sending}
              className="text-xs text-slate-500 hover:text-slate-400 transition-colors disabled:opacity-40"
            >
              I'm done — wrap up the session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
