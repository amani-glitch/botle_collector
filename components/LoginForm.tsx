
import React, { useState } from 'react';
import { UserProfile, Department, DEPARTMENTS } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface LoginFormProps {
  onLogin: (profile: UserProfile) => void;
  onBack: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onBack }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<Department | ''>('');

  const canSubmit = name.trim().length > 0 && role.trim().length > 0 && department !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onLogin({
      employee_name: name.trim(),
      employee_role: role.trim(),
      department: department as Department,
      session_id: uuidv4(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-8 transition-colors"
        >
          <i className="fas fa-arrow-left text-xs"></i>
          Back
        </button>

        <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/80 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#1a365d] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-user text-2xl"></i>
            </div>
            <h2 className="text-2xl font-black text-[#1a365d] tracking-tight">Before we start</h2>
            <p className="text-sm text-slate-500 mt-2">Tell us a bit about yourself so we can tailor the conversation.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Ahmed"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-[#1a365d]/10 focus:border-[#1a365d] outline-none transition-all placeholder:text-slate-300"
                autoFocus
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
                Your Role / Job Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Contracting Executive, Marketing Director"
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-800 focus:ring-4 focus:ring-[#1a365d]/10 focus:border-[#1a365d] outline-none transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
                Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setDepartment(dept)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border-2 text-left ${
                      department === dept
                        ? 'bg-[#1a365d] border-[#1a365d] text-white shadow-lg'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <i className={`fas ${getDeptIcon(dept)} mr-2 text-[10px] ${department === dept ? 'text-white/70' : 'text-slate-400'}`}></i>
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 bg-[#E87722] hover:bg-[#d06a1a] text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 mt-2"
            >
              <i className="fas fa-comments"></i>
              Begin Interview
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
          No password required. Your identity is used only to label your session.
        </p>
      </div>
    </div>
  );
};

function getDeptIcon(dept: string): string {
  const icons: Record<string, string> = {
    Operations: 'fa-cogs',
    Sales: 'fa-chart-line',
    Marketing: 'fa-bullhorn',
    Finance: 'fa-calculator',
    IT: 'fa-laptop-code',
    Management: 'fa-sitemap',
  };
  return icons[dept] || 'fa-building';
}

export default LoginForm;
