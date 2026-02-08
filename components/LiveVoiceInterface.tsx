
import React, { useState, useEffect, useRef } from 'react';
import { getGeminiClient, encodeAudio, decodeAudio, decodeAudioData } from '../services/gemini';
import { BOTLER_SYSTEM_INSTRUCTION } from '../constants';
import { InterviewDay, Message } from '../types';
import { Modality } from '@google/genai';

interface LiveVoiceInterfaceProps {
  day: InterviewDay;
  onFinish: (transcript: string) => void;
}

const LiveVoiceInterface: React.FC<LiveVoiceInterfaceProps> = ({ day, onFinish }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [statusText, setStatusText] = useState("Tap to start your session");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  const startSession = async () => {
    setIsConnecting(true);
    setStatusText("Establishing secure connection...");
    
    try {
      const ai = getGeminiClient();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `${BOTLER_SYSTEM_INSTRUCTION}\n\nCURRENT FOCUS: ${day}. Begin with a brief, professional greeting.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setStatusText("I'm listening. Please speak naturally.");
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encodeAudio(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
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
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
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
          onerror: (e) => {
            console.error("Live Error", e);
            setStatusText("Connection lost. Please retry.");
          },
          onclose: () => {
            setIsActive(false);
            setStatusText("Session complete.");
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatusText("Unable to access mic.");
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    onFinish(transcriptRef.current);
  };

  return (
    <div className="relative glass-card rounded-[2.5rem] p-12 min-h-[500px] flex flex-col items-center justify-between overflow-hidden shadow-2xl transition-all duration-700">
      {/* Decorative Background Elements */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="w-full flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isActive ? 'Live Interaction' : 'Standby'}</p>
        </div>
        <div className="px-4 py-1.5 bg-sky-50 rounded-full border border-sky-100">
           <p className="text-[10px] font-extrabold text-sky-600 uppercase tracking-wider">{day.split(':')[0]}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-12 z-10 w-full">
        <div className="relative group cursor-pointer" onClick={!isActive && !isConnecting ? startSession : undefined}>
          {/* Main Visual Orb */}
          <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
            isActive ? 'bg-sky-500 scale-100 shadow-[0_0_80px_rgba(14,165,233,0.4)]' : 
            isConnecting ? 'bg-slate-100 animate-pulse' : 'bg-white shadow-xl hover:shadow-2xl hover:scale-105'
          }`}>
            {isActive ? (
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1.5 h-12 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${20 + Math.random() * 40}px` }}></div>
                ))}
              </div>
            ) : isConnecting ? (
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <i className="fas fa-microphone text-5xl text-sky-600"></i>
            )}
          </div>

          {/* Pulsing Rings */}
          {isActive && (
            <>
              <div className="absolute inset-0 voice-ring rounded-full pointer-events-none"></div>
              <div className="absolute -inset-8 voice-ring rounded-full pointer-events-none" style={{ animationDelay: '0.5s' }}></div>
            </>
          )}
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {isActive ? "Botler is listening" : isConnecting ? "Waking up Botler" : "Voice Discovery"}
          </h2>
          <p className={`text-sm font-medium transition-colors duration-500 ${isActive ? 'text-sky-600' : 'text-slate-500'}`}>
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
                          ? 'bg-sky-100 text-sky-700 font-bold border border-sky-200 shadow-sm' 
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
              className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 hover:bg-sky-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
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
