
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient } from '../services/gemini';
import { BOTLER_SYSTEM_INSTRUCTION, GET_DAY_SUGGESTIONS } from '../constants';
import { Message, InterviewDay } from '../types';

interface ChatInterfaceProps {
  day: InterviewDay;
  onFinish: (transcript: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ day, onFinish }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<any>(null);
  const suggestions = GET_DAY_SUGGESTIONS(day);

  // Helper to render basic bold formatting from markdown-like syntax
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
      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction: `${BOTLER_SYSTEM_INSTRUCTION}\n\nCURRENT FOCUS: ${day}`,
        },
      });
      chatInstanceRef.current = chat;
      
      setIsTyping(true);
      const greeting = await chat.sendMessage({ message: "Hello! Please introduce yourself and briefly explain the mission." });
      setIsTyping(false);
      
      setMessages([{
        role: 'model',
        text: greeting.text || "Hello. I'm Botler. I'm here to understand your workflow so we can make your job more efficient. How are things going today?",
        timestamp: new Date()
      }]);
    };

    initChat();
  }, [day]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    const finalInput = text.trim();
    if (!finalInput || !chatInstanceRef.current) return;

    const userMessage: Message = {
      role: 'user',
      text: finalInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await chatInstanceRef.current.sendMessage({ message: finalInput });
      const modelMessage: Message = {
        role: 'model',
        text: response.text || "Understood. Please continue.",
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
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
            <i className="fas fa-keyboard text-2xl"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight leading-none mb-1">Text Documentation</h3>
            <p className="text-[10px] text-sky-600 font-black uppercase tracking-widest">{day.split(':')[0]}</p>
          </div>
        </div>
        <button 
          onClick={handleEndSession}
          className="px-6 py-3 bg-[#1e293b] hover:bg-slate-900 text-white text-[11px] font-bold rounded-2xl transition-all shadow-md active:scale-95 uppercase tracking-wider"
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
                  ? 'bg-[#0ea5e9] text-white rounded-tr-none' 
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
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-xs font-bold hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all shadow-sm active:scale-95"
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
            className="flex-1 bg-white border border-slate-200 rounded-[1.25rem] px-8 py-5 text-[15px] font-medium focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-16 h-16 bg-[#0ea5e9] text-white rounded-2xl flex items-center justify-center hover:bg-sky-600 disabled:opacity-50 transition-all shadow-xl shadow-sky-900/20 active:scale-95 group"
          >
            <i className="fas fa-paper-plane text-xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
