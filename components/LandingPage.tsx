
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center space-y-10">
          {/* Logo area */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#1a365d] text-white rounded-2xl flex items-center justify-center shadow-2xl">
                <i className="fas fa-robot text-3xl"></i>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1a365d] tracking-tight leading-tight">
              Botler Process Discovery
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium max-w-lg mx-auto">
              Understanding your workflow to build better tools
            </p>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-5 text-left">
            {/* What */}
            <div className="glass-card rounded-2xl p-6 border border-white/80 shadow-lg">
              <div className="w-10 h-10 bg-[#1a365d] text-white rounded-xl flex items-center justify-center mb-4">
                <i className="fas fa-compass text-lg"></i>
              </div>
              <h3 className="font-bold text-[#1a365d] mb-2">What is this?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                A short, guided conversation with an AI assistant that helps us map your daily workflows and identify improvement opportunities.
              </p>
            </div>

            {/* Why */}
            <div className="glass-card rounded-2xl p-6 border border-white/80 shadow-lg">
              <div className="w-10 h-10 bg-[#E87722] text-white rounded-xl flex items-center justify-center mb-4">
                <i className="fas fa-lightbulb text-lg"></i>
              </div>
              <h3 className="font-bold text-[#1a365d] mb-2">Why are we doing this?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Holiday Moments is exploring AI-powered improvements. This tool helps us understand your daily work to identify the best opportunities.
              </p>
            </div>

            {/* How */}
            <div className="glass-card rounded-2xl p-6 border border-white/80 shadow-lg">
              <div className="w-10 h-10 bg-[#1a365d] text-white rounded-xl flex items-center justify-center mb-4">
                <i className="fas fa-clock text-lg"></i>
              </div>
              <h3 className="font-bold text-[#1a365d] mb-2">How does it work?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                You'll have a 10-15 minute conversation with our AI assistant. Just describe your typical workday, the tools you use, and any frustrations you encounter.
              </p>
            </div>
          </div>

          {/* Confidentiality */}
          <div className="glass-card rounded-2xl p-6 border border-white/80 shadow-lg text-left flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="fas fa-shield-alt text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-[#1a365d] mb-1">Your data is safe</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your responses are confidential and used only for internal process improvement.
                Data is stored on Google Cloud, encrypted, and never shared with third parties.
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full md:w-auto px-12 py-5 bg-[#E87722] hover:bg-[#d06a1a] text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-orange-200 active:scale-[0.98] flex items-center justify-center gap-3 mx-auto"
          >
            <i className="fas fa-play"></i>
            Start My Interview
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Powered by</span>
          <span className="text-sm font-bold text-[#E87722]">Botler 360</span>
        </div>
        <div className="flex justify-center gap-6 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <i className="fas fa-lock text-[8px]"></i>
            Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <i className="fas fa-cloud text-[8px]"></i>
            Google Cloud
          </span>
          <span className="flex items-center gap-1.5">
            <i className="fas fa-globe-americas text-[8px]"></i>
            Holiday Moments
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
