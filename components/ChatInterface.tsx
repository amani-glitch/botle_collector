
import React, { useState, useEffect, useRef } from 'react';
import { startChat, sendChatMessage } from '../services/gemini';
import { BOTLER_SYSTEM_INSTRUCTION, GET_DAY_SUGGESTIONS, DAY_INSTRUCTIONS } from '../constants';
import { Message, InterviewDay, UserProfile } from '../types';

interface ChatInterfaceProps {
  day: InterviewDay;
  onFinish: (transcript: string) => void;
  userProfile?: UserProfile | null;
  previousContext?: string;
  isFirstDay?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ day, onFinish, userProfile, previousContext = '', isFirstDay = true }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string | null>(null);
  const suggestions = GET_DAY_SUGGESTIONS(day);

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  useEffect(() => {
    const initChat = async () => {
      const profileContext = userProfile
        ? `\n\nEMPLOYEE CONTEXT (already collected at login — do NOT re-ask these):
- Name: ${userProfile.employee_name}
- Role: ${userProfile.employee_role}
- Department: ${userProfile.department}
- Session ID: ${userProfile.session_id}

Address them by name. Skip Phase 1 (Identity) since you already have their info. Start directly with Phase 2 (Day-in-the-Life).`
        : '';

      const dayInstruction = DAY_INSTRUCTIONS[day] || '';
      const systemInstruction = `${BOTLER_SYSTEM_INSTRUCTION}${dayInstruction}${profileContext}${previousContext}`;

      const triggerMessage = isFirstDay
        ? "Hello! Please introduce yourself and briefly explain the mission."
        : "The employee is returning for a new session. Greet them briefly by name and start today's topic.";

      setIsTyping(true);
      try {
        const { chatId, response } = await startChat(systemInstruction, triggerMessage);
        chatIdRef.current = chatId;

        setMessages([{
          role: 'model',
          text: response || "Hi! I'm Botler, an AI assistant from Botler 360 working with Holiday Moments. I'm here to understand how your day-to-day work flows so we can find ways to make things smoother for you. Shall we get started?",
          timestamp: new Date()
        }]);
      } catch (error) {
        console.error('Failed to init chat:', error);
        setMessages([{
          role: 'model',
          text: "Sorry, I couldn't connect to the server. Please check the configuration and try again.",
          timestamp: new Date()
        }]);
      } finally {
        setIsTyping(false);
      }
    };

    initChat();
  }, [day]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    const finalInput = text.trim();
    if (!finalInput || !chatIdRef.current) return;

    const userMessage: Message = {
      role: 'user',
      text: finalInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await sendChatMessage(chatIdRef.current, finalInput);
      const modelMessage: Message = {
        role: 'model',
        text: responseText || "Understood. Please continue.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndSession = () => {
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    onFinish(transcript);
  };

  return (
    <div className="flex flex-col h-[700px] glass-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/50">
      {/* Header */}
      <div className="px-10 py-7 border-b border-slate-200/50 flex justify-between items-center bg-white/60">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#1a365d] text-white flex items-center justify-center shadow-lg">
            <i className="fas fa-keyboard text-2xl"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-[#1a365d] text-xl tracking-tight leading-none mb-1">Text Documentation</h3>
            <p className="text-[10px] text-[#E87722] font-black uppercase tracking-widest">{day.split(':')[0]}</p>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          className="px-6 py-3 bg-[#1a365d] hover:bg-[#122a4d] text-white text-[11px] font-bold rounded-2xl transition-all shadow-md active:scale-95 uppercase tracking-wider"
        >
          Wrap Up Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] group`}>
              <div className={`px-6 py-4 rounded-[1.75rem] shadow-sm ${
                msg.role === 'user'
                  ? 'bg-[#E87722] text-white rounded-tr-none'
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-200/50'
              }`}>
                <p className="text-[15px] leading-relaxed font-medium">{renderText(msg.text)}</p>
              </div>
              <p className={`text-[10px] mt-2 font-bold uppercase tracking-wider text-slate-400 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions and Input */}
      <div className="p-8 bg-white/80 border-t border-slate-200/50 space-y-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-bold hover:bg-orange-50 hover:border-[#E87722] hover:text-[#E87722] transition-all shadow-sm active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your workflow details here..."
            className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] px-8 py-5 text-[15px] font-medium focus:ring-4 focus:ring-[#E87722]/10 focus:border-[#E87722] outline-none transition-all shadow-inner placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-16 h-16 bg-[#E87722] text-white rounded-2xl flex items-center justify-center hover:bg-[#d06a1a] disabled:opacity-50 transition-all shadow-xl shadow-orange-200 active:scale-95 group"
          >
            <i className="fas fa-paper-plane text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
