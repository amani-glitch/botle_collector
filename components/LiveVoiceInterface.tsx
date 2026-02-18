
import React, { useState, useRef } from 'react';
import { connectLiveProxy, encodeAudio, decodeAudio, decodeAudioData } from '../services/gemini';
import { BOTLER_SYSTEM_INSTRUCTION, DAY_INSTRUCTIONS } from '../constants';
import { InterviewDay, UserProfile } from '../types';

interface LiveVoiceInterfaceProps {
  day: InterviewDay;
  onFinish: (transcript: string) => void;
  userProfile?: UserProfile | null;
  previousContext?: string;
  isFirstDay?: boolean;
}

const LiveVoiceInterface: React.FC<LiveVoiceInterfaceProps> = ({ day, onFinish, userProfile, previousContext = '', isFirstDay = true }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [statusText, setStatusText] = useState("Tap to start your session");

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveSessionRef = useRef<{ sendAudio: (media: any) => void; close: () => void } | null>(null);
  const transcriptRef = useRef<string>("");

  const startSession = async () => {
    setIsConnecting(true);
    setStatusText("Establishing secure connection...");

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const profileContext = userProfile
        ? `\n\nEMPLOYEE CONTEXT (already collected at login — do NOT re-ask these):
- Name: ${userProfile.employee_name}
- Role: ${userProfile.employee_role}
- Department: ${userProfile.department}

Address them by name. Skip identity questions. Start with your introduction then move to Phase 2.`
        : '';

      const systemInstruction = `${BOTLER_SYSTEM_INSTRUCTION}${DAY_INSTRUCTIONS[day] || ''}${profileContext}${previousContext}${isFirstDay ? '' : '\nDo NOT re-introduce yourself. The employee already knows who you are.'}`;

      const session = connectLiveProxy(
        systemInstruction,
        { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        {
          onconnected: () => {
            setIsConnecting(false);
            setIsActive(true);
            setStatusText("I'm listening. Please speak naturally.");

            // Start capturing and sending audio
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }

              session.sendAudio({
                data: encodeAudio(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeAudio(base64Audio), ctx, 24000, 1);
              const audioSource = ctx.createBufferSource();
              audioSource.buffer = audioBuffer;
              audioSource.connect(ctx.destination);
              audioSource.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(audioSource);
              audioSource.onended = () => sourcesRef.current.delete(audioSource);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              transcriptRef.current += `BOTLER: ${text}\n`;
              setTranscription(prev => [...prev.slice(-4), `Botler: ${text}`]);
            } else if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptRef.current += `USER: ${text}\n`;
              setTranscription(prev => [...prev.slice(-4), `You: ${text}`]);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (error) => {
            console.error("Live Error", error);
            setStatusText("Connection lost. Please retry.");
          },
          onclose: () => {
            setIsActive(false);
            setStatusText("Session complete.");
          },
        }
      );

      liveSessionRef.current = session;
    } catch (err) {
      console.error(err);
      setStatusText("Unable to access mic.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (liveSessionRef.current) liveSessionRef.current.close();
    onFinish(transcriptRef.current);
  };

  return (
    <div className="relative glass-card rounded-[2.5rem] p-12 min-h-[500px] flex flex-col items-center justify-between overflow-hidden shadow-2xl transition-all duration-700">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a365d] via-[#E87722] to-[#1a365d] transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="w-full flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isActive ? 'Live Interaction' : 'Standby'}</p>
        </div>
        <div className="px-4 py-1.5 bg-orange-50 rounded-full border border-orange-100">
           <p className="text-[10px] font-extrabold text-[#E87722] uppercase tracking-wider">{day.split(':')[0]}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 z-10 w-full">
        <div className="relative group cursor-pointer" onClick={!isActive && !isConnecting ? startSession : undefined}>
          <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
            isActive ? 'bg-[#E87722] scale-100 shadow-[0_0_80px_rgba(232,119,34,0.4)]' :
            isConnecting ? 'bg-slate-100 animate-pulse' : 'bg-white shadow-xl hover:shadow-2xl hover:scale-105'
          }`}>
            {isActive ? (
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-12 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${20 + Math.random() * 40}px` }}></div>
                ))}
              </div>
            ) : isConnecting ? (
              <div className="w-8 h-8 border-2 border-[#E87722] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-microphone text-5xl text-[#1a365d]"></i>
            )}
          </div>

          {isActive && (
            <>
              <div className="absolute inset-0 voice-ring rounded-full pointer-events-none" style={{ boxShadow: '0 0 0 0 rgba(232, 119, 34, 0.7)' }}></div>
              <div className="absolute -inset-8 voice-ring rounded-full pointer-events-none" style={{ animationDelay: '0.5s', boxShadow: '0 0 0 0 rgba(232, 119, 34, 0.7)' }}></div>
            </>
          )}
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {isActive ? "Botler is listening" : isConnecting ? "Waking up Botler" : "Voice Discovery"}
          </h2>
          <p className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-[#E87722]' : 'text-slate-500'}`}>
            {statusText}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md z-10">
        {isActive ? (
          <div className="bg-slate-900/5 rounded-2xl p-6 mb-8 border border-white/50 min-h-[100px] backdrop-blur-sm">
             <div className="space-y-3">
                {transcription.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-4">Waiting for dialogue...</p>
                ) : (
                  transcription.map((line, i) => (
                    <div key={i} className={`flex ${line.startsWith('Botler') ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <p className={`text-[11px] px-3 py-1.5 rounded-lg max-w-[90%] ${
                        line.startsWith('Botler')
                          ? 'bg-[#1a365d]/10 text-[#1a365d] font-bold border border-[#1a365d]/20 shadow-sm'
                          : 'bg-white text-slate-600 font-medium border border-slate-100'
                      }`}>
                        {line.split(': ')[1]}
                      </p>
                    </div>
                  ))
                )}
             </div>
          </div>
        ) : (
          <div className="h-20 mb-8 flex items-center justify-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold">Press the microphone to begin</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!isActive && !isConnecting && (
             <button
              onClick={startSession}
              className="w-full py-4 bg-[#E87722] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#d06a1a] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <i className="fas fa-play"></i>
              Start Session
            </button>
          )}

          {isActive && (
            <button
              onClick={stopSession}
              className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <i className="fas fa-check-circle"></i>
              End & Generate Report
            </button>
          )}
        </div>
      </div>

      <p className="absolute bottom-6 text-[8px] text-slate-300 uppercase tracking-[0.4em] font-black z-10">
        Botler Intelligence Engine
      </p>
    </div>
  );
};

export default LiveVoiceInterface;
