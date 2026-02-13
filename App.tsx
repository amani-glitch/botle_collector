
import React, { useState } from 'react';
import { InterviewDay, InterviewSummary } from './types';
import ChatInterface from './components/ChatInterface';
import LiveVoiceInterface from './components/LiveVoiceInterface';
import ReportDocument from './components/ReportDocument';
import { generateSummary } from './services/gemini';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [selectedDay, setSelectedDay] = useState<InterviewDay>(InterviewDay.DAY_1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<InterviewSummary | null>(null);

  const handleFinishSession = async (transcript: string) => {
    setIsSummarizing(true);
    try {
      const summary = await generateSummary(transcript);
      setCurrentSummary(summary);
    } catch (error) {
      console.error("Summary failed", error);
      alert("Analysis encountered an error. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFinalSubmit = (finalData: InterviewSummary) => {
    console.log("Transmission initialized:", finalData);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      {/* Centered App Container */}
      <div className="max-w-4xl w-full mx-auto space-y-8 flex-1 flex flex-col">
        
        {/* Header Branding */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl animate-float">
              <i className="fas fa-robot text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Botler™ <span className="text-sky-600">Assistant</span></h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Holiday Moments Operations</p>
            </div>
          </div>

          {/* New Pill Style Tab Navigation */}
          <nav className="flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md shadow-inner border border-white/50">
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-[0.85rem] text-sm font-bold transition-all ${
                activeTab === 'text' 
                ? 'bg-white text-slate-900 shadow-xl' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas fa-keyboard transition-transform ${activeTab === 'text' ? 'scale-110 text-sky-500' : 'opacity-60'}`}></i>
              Chat
            </button>
            <button 
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-[0.85rem] text-sm font-bold transition-all ${
                activeTab === 'voice' 
                ? 'bg-white text-slate-900 shadow-xl' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas fa-microphone transition-transform ${activeTab === 'voice' ? 'scale-110 text-sky-500' : 'opacity-60'}`}></i>
              Voice
            </button>
          </nav>
        </header>

        {/* Configuration Step / Friendly Intro */}
        <section className="glass-card p-8 rounded-[2rem] border-white/80 shadow-xl relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-100 rounded-full blur-3xl opacity-50"></div>
          
          <div className="flex flex-col md:flex-row items-start gap-10 relative z-10">
             <div className="md:flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4">
                  <i className="fas fa-heart text-[10px]"></i>
                  <span className="text-[10px] font-black uppercase tracking-wider">Our Commitment</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Making your job more efficient</h2>
                <div className="space-y-4 text-slate-600 text-sm leading-relaxed max-w-lg">
                  <p>
                    We want to understand your daily tasks and any obstacles you face. Our goal is to see how we can better support you and modernize our workflows.
                  </p>
                  <p className="font-medium bg-white/40 p-3 rounded-xl border border-white/50 italic">
                    "Kindly share your honest feedback so we can build a better Holiday Moments together."
                  </p>
                </div>
             </div>
             
             <div className="w-full md:w-auto flex flex-col gap-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block px-2">Select Today's Topic</label>
                <div className="flex flex-col gap-2">
                  {Object.values(InterviewDay).map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center justify-between gap-4 ${
                        selectedDay === day 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                          : 'bg-white/50 border-slate-100 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate max-w-[200px]">{day.split(': ')[1]}</span>
                      <i className={`fas fa-chevron-right text-[10px] transition-transform ${selectedDay === day ? 'translate-x-1' : 'opacity-30'}`}></i>
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </section>

        {/* Active Session Area */}
        <section className="relative flex-1 flex flex-col min-h-[500px]">
          {activeTab === 'text' ? (
            <ChatInterface day={selectedDay} onFinish={handleFinishSession} />
          ) : (
            <LiveVoiceInterface day={selectedDay} onFinish={handleFinishSession} />
          )}

          {isSummarizing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-[2.5rem] animate-in fade-in duration-500">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-brain text-sky-500 text-xl animate-pulse"></i>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Compiling Report</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Gemini Neural Engine Processing</p>
            </div>
          )}
        </section>

        {/* Footer Brand info */}
        <footer className="py-10 text-center">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em] mb-4">A Botler 360 Experience</p>
           <div className="flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                 <i className="fas fa-shield-alt text-xs"></i>
                 <span className="text-[9px] font-bold">Secure Infrastructure</span>
              </div>
              <div className="flex items-center gap-2">
                 <i className="fas fa-globe-americas text-xs"></i>
                 <span className="text-[9px] font-bold">Holiday Moments Global</span>
              </div>
           </div>
        </footer>
      </div>

      {/* Report Interface */}
      {currentSummary && (
        <ReportDocument 
          initialSummary={currentSummary} 
          onClose={() => setCurrentSummary(null)} 
          onFinalSubmit={handleFinalSubmit}
        />
      )}
    </div>
  );
};

export default App;
