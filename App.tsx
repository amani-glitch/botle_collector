
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InterviewDay, InterviewSummary, UserProfile, AppPage, DayProgress } from './types';
import ChatInterface from './components/ChatInterface';
import LiveVoiceInterface from './components/LiveVoiceInterface';
import ReportDocument from './components/ReportDocument';
import LandingPage from './components/LandingPage';
import LoginForm from './components/LoginForm';
import { generateSummary } from './services/gemini';

const PROGRESS_KEY = 'botler_day_progress';
const DAY_ORDER = [InterviewDay.DAY_1, InterviewDay.DAY_2, InterviewDay.DAY_3, InterviewDay.DAY_4, InterviewDay.DAY_5];

function loadProgress(sessionId: string): DayProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const all = JSON.parse(raw);
      return all[sessionId] || { completedDays: [], daySummaries: {} };
    }
  } catch { /* ignore */ }
  return { completedDays: [], daySummaries: {} };
}

function saveProgress(sessionId: string, progress: DayProgress) {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[sessionId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

const App: React.FC = () => {
  const [page, setPage] = useState<AppPage>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'voice'>('text');
  const [selectedDay, setSelectedDay] = useState<InterviewDay>(InterviewDay.DAY_1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<InterviewSummary | null>(null);
  const rawTranscriptRef = useRef<string>('');
  const [dayProgress, setDayProgress] = useState<DayProgress>({ completedDays: [], daySummaries: {} });

  // Load progress when user logs in
  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    const progress = loadProgress(profile.session_id);
    setDayProgress(progress);
    // Auto-select the next uncompleted day
    const nextDay = DAY_ORDER.find(d => !progress.completedDays.includes(d)) || InterviewDay.DAY_1;
    setSelectedDay(nextDay);
    setPage('interview');
  };

  const isDayUnlocked = useCallback((day: InterviewDay): boolean => {
    const idx = DAY_ORDER.indexOf(day);
    if (idx === 0) return true; // Day 1 always unlocked
    return dayProgress.completedDays.includes(DAY_ORDER[idx - 1]);
  }, [dayProgress]);

  const isDayCompleted = useCallback((day: InterviewDay): boolean => {
    return dayProgress.completedDays.includes(day);
  }, [dayProgress]);

  // Build context from previous days for the current session
  const getPreviousContext = useCallback((): string => {
    const currentIdx = DAY_ORDER.indexOf(selectedDay);
    if (currentIdx === 0) return '';

    const summaries: string[] = [];
    for (let i = 0; i < currentIdx; i++) {
      const dayKey = DAY_ORDER[i];
      const summary = dayProgress.daySummaries[dayKey];
      if (summary) {
        summaries.push(`${dayKey}: ${summary}`);
      }
    }
    if (summaries.length === 0) return '';
    return `\n\nPREVIOUS SESSIONS SUMMARY (use this context, do NOT re-ask about things already covered):\n${summaries.join('\n')}`;
  }, [selectedDay, dayProgress]);

  const handleFinishSession = async (transcript: string) => {
    setIsSummarizing(true);
    rawTranscriptRef.current = transcript;
    try {
      const summary = await generateSummary(transcript);
      // Merge user profile info into the summary
      if (summary && userProfile) {
        summary.employee_name = summary.employee_name || userProfile.employee_name;
        summary.employee_role = summary.employee_role || userProfile.employee_role;
        summary.department = summary.department || userProfile.department;
      }
      setCurrentSummary(summary);

      // Mark day as completed and save a short context summary
      if (userProfile) {
        const shortSummary = transcript
          .split('\n')
          .filter(l => l.startsWith('USER:'))
          .map(l => l.replace('USER: ', ''))
          .join(' ')
          .substring(0, 500);

        const newProgress: DayProgress = {
          completedDays: [...new Set([...dayProgress.completedDays, selectedDay])],
          daySummaries: {
            ...dayProgress.daySummaries,
            [selectedDay]: shortSummary || 'Session completed.',
          },
        };
        setDayProgress(newProgress);
        saveProgress(userProfile.session_id, newProgress);

        // Auto-advance to next day
        const nextIdx = DAY_ORDER.indexOf(selectedDay) + 1;
        if (nextIdx < DAY_ORDER.length) {
          setSelectedDay(DAY_ORDER[nextIdx]);
        }
      }
    } catch (error) {
      console.error("Summary failed", error);
      alert("Analysis encountered an error. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleFinalSubmit = async (finalData: InterviewSummary) => {
    if (!userProfile) return;

    const payload = {
      employee_name: finalData.employee_name || userProfile.employee_name,
      employee_role: finalData.employee_role || userProfile.employee_role,
      department: finalData.department || userProfile.department,
      session_id: userProfile.session_id,
      interview_transcript: finalData,
      raw_transcript: rawTranscriptRef.current,
      process_map: finalData.process_map || [],
      pain_points: finalData.pain_points || [],
      tools_used: finalData.tools_used || [],
      automation_opportunities: finalData.automation_opportunities || [],
      time_estimates: finalData.time_estimates || {},
      interaction_style: finalData.interaction_style || {},
      completion_status: 'completed',
    };

    try {
      const res = await fetch('/api/export-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        console.warn('Sheet export warning:', result);
      } else {
        console.log('Sheet export success:', result);
      }
    } catch (err) {
      console.warn('Sheet export unavailable (server may not be running):', err);
    }
  };

  // Landing page
  if (page === 'landing') {
    return <LandingPage onStart={() => setPage('login')} />;
  }

  // Login page
  if (page === 'login') {
    return <LoginForm onLogin={handleLogin} onBack={() => setPage('landing')} />;
  }

  // Interview page (existing UI with improvements)
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-8 flex-1 flex flex-col">

        {/* Header Branding */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#1a365d] text-white rounded-[1.25rem] flex items-center justify-center shadow-2xl animate-float">
              <i className="fas fa-robot text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1a365d] tracking-tight">Botler™ <span className="text-[#E87722]">Assistant</span></h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
                {userProfile ? `${userProfile.employee_name} — ${userProfile.department}` : 'Holiday Moments Operations'}
              </p>
            </div>
          </div>

          <nav className="flex bg-slate-200/50 p-1.5 rounded-2xl backdrop-blur-md shadow-inner border border-white/50">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-[0.85rem] text-sm font-bold transition-all ${
                activeTab === 'text'
                ? 'bg-white text-[#1a365d] shadow-xl'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas fa-keyboard transition-transform ${activeTab === 'text' ? 'scale-110 text-[#E87722]' : 'opacity-60'}`}></i>
              Chat
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-[0.85rem] text-sm font-bold transition-all ${
                activeTab === 'voice'
                ? 'bg-white text-[#1a365d] shadow-xl'
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className={`fas fa-microphone transition-transform ${activeTab === 'voice' ? 'scale-110 text-[#E87722]' : 'opacity-60'}`}></i>
              Voice
            </button>
          </nav>
        </header>

        {/* Configuration Step */}
        <section className="glass-card p-8 rounded-[2rem] border-white/80 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

          <div className="flex flex-col md:flex-row items-start gap-10 relative z-10">
             <div className="md:flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4">
                  <i className="fas fa-heart text-[10px]"></i>
                  <span className="text-[10px] font-black uppercase tracking-wider">Our Commitment</span>
                </div>
                <h2 className="text-2xl font-black text-[#1a365d] mb-4 tracking-tight">Making your job more efficient</h2>
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
                  {Object.values(InterviewDay).map((day) => {
                    const unlocked = isDayUnlocked(day);
                    const completed = isDayCompleted(day);
                    return (
                      <button
                        key={day}
                        onClick={() => unlocked && setSelectedDay(day)}
                        disabled={!unlocked}
                        className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all border-2 flex items-center justify-between gap-4 ${
                          !unlocked
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            : selectedDay === day
                              ? 'bg-[#1a365d] border-[#1a365d] text-white shadow-lg'
                              : completed
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400'
                                : 'bg-white/50 border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate max-w-[200px]">{day.split(': ')[1]}</span>
                        {!unlocked ? (
                          <i className="fas fa-lock text-[10px] text-slate-300"></i>
                        ) : completed ? (
                          <i className="fas fa-check-circle text-[10px] text-emerald-500"></i>
                        ) : (
                          <i className={`fas fa-chevron-right text-[10px] transition-transform ${selectedDay === day ? 'translate-x-1' : 'opacity-30'}`}></i>
                        )}
                      </button>
                    );
                  })}
                </div>
             </div>
          </div>
        </section>

        {/* Active Session Area */}
        <section className="relative flex-1 flex flex-col min-h-[500px]">
          {activeTab === 'text' ? (
            <ChatInterface day={selectedDay} onFinish={handleFinishSession} userProfile={userProfile} previousContext={getPreviousContext()} isFirstDay={selectedDay === InterviewDay.DAY_1} />
          ) : (
            <LiveVoiceInterface day={selectedDay} onFinish={handleFinishSession} userProfile={userProfile} previousContext={getPreviousContext()} isFirstDay={selectedDay === InterviewDay.DAY_1} />
          )}

          {isSummarizing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-[2.5rem] animate-in fade-in duration-500">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-[#E87722]/20 border-t-[#E87722] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-brain text-[#E87722] text-xl animate-pulse"></i>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Compiling Report</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Botler Intelligence Engine</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="py-10 text-center">
           <div className="flex items-center justify-center gap-2 mb-4">
             <span className="text-[10px] text-slate-400 font-medium">Powered by</span>
             <span className="text-xs font-bold text-[#E87722]">Botler 360</span>
           </div>
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
