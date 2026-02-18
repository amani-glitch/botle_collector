
import React, { useState } from 'react';
import { InterviewSummary } from '../types';

interface ReportDocumentProps {
  initialSummary: InterviewSummary;
  onClose: () => void;
  onFinalSubmit: (finalData: InterviewSummary) => void;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({ initialSummary, onClose, onFinalSubmit }) => {
  const [data, setData] = useState<InterviewSummary>(initialSummary);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof InterviewSummary, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const getArrayItems = (field: keyof InterviewSummary): string[] => {
    const val = data[field];
    if (Array.isArray(val)) {
      return val.map(item => typeof item === 'string' ? item : (item as any).description || (item as any).name || JSON.stringify(item));
    }
    return [];
  };

  const updateArrayItem = (field: keyof InterviewSummary, index: number, value: string) => {
    const current = data[field];
    if (Array.isArray(current)) {
      const arr = [...current];
      if (typeof arr[index] === 'string') {
        arr[index] = value;
      } else if (typeof arr[index] === 'object' && arr[index] !== null) {
        const obj = { ...arr[index] as any };
        if ('description' in obj) obj.description = value;
        else if ('name' in obj) obj.name = value;
        arr[index] = obj;
      }
      setData(prev => ({ ...prev, [field]: arr }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onFinalSubmit(data);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Submitted</h2>
          <p className="text-slate-500 mb-8">Thank you for your input. The findings have been sent to the Botler 360 analysis team.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a365d] text-white rounded-xl font-bold hover:bg-[#122a4d] transition-colors"
          >
            Close Session
          </button>
        </div>
      </div>
    );
  }

  const painPointItems = getArrayItems('pain_points');
  const automationItems = getArrayItems('automation_opportunities');
  const toolItems = getArrayItems('tools_used');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#fdfdfd] rounded-sm shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in slide-in-from-bottom duration-500 border border-slate-200">
        {/* Document Header */}
        <div className="p-10 border-b-4 border-[#1a365d]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-2 text-[#1a365d] font-bold text-xl mb-1">
                <i className="fas fa-file-invoice text-[#E87722]"></i>
                <span>BOTLER 360</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Session Discovery Report</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400 font-medium">Ref: HM-{Math.floor(Math.random() * 10000)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Employee Name</label>
              <input
                className="w-full bg-transparent border-b border-slate-200 focus:border-[#E87722] outline-none py-1 font-semibold text-slate-800"
                value={data.employee_name}
                onChange={(e) => updateField('employee_name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Role</label>
              <input
                className="w-full bg-transparent border-b border-slate-200 focus:border-[#E87722] outline-none py-1 font-semibold text-slate-800"
                value={data.employee_role || ''}
                onChange={(e) => updateField('employee_role', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
              <input
                className="w-full bg-transparent border-b border-slate-200 focus:border-[#E87722] outline-none py-1 font-semibold text-slate-800"
                value={data.department}
                onChange={(e) => updateField('department', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-10 space-y-10 min-h-[400px]">
          <section>
            <h3 className="text-xs font-black text-[#1a365d] uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#E87722] inline-block"></span>
              Role Definition & Primary Tasks
            </h3>
            <textarea
              className="w-full bg-slate-50 p-3 rounded text-sm text-slate-700 border-l-2 border-slate-300 outline-none focus:border-[#E87722]"
              value={data.role_description || ''}
              rows={2}
              onChange={(e) => updateField('role_description', e.target.value)}
            />
            {data.primary_tasks && data.primary_tasks.length > 0 && (
              <div className="mt-4 space-y-2">
                {data.primary_tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-slate-300">&#8226;</span>
                    <input
                      className="flex-1 bg-transparent text-sm text-slate-600 focus:text-slate-900 outline-none"
                      value={task}
                      onChange={(e) => {
                        const arr = [...data.primary_tasks];
                        arr[i] = e.target.value;
                        updateField('primary_tasks', arr);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <section>
              <h3 className="text-xs font-black text-[#1a365d] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-rose-500 inline-block"></span>
                Workflow Bottlenecks
              </h3>
              <div className="space-y-3">
                {painPointItems.map((point, i) => (
                  <textarea
                    key={i}
                    className="w-full bg-transparent text-sm text-rose-700 outline-none border-b border-rose-100 focus:border-rose-300 py-1 resize-y"
                    value={point}
                    rows={3}
                    onChange={(e) => updateArrayItem('pain_points', i, e.target.value)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-black text-[#1a365d] uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 inline-block"></span>
                Optimization Opportunities
              </h3>
              <div className="space-y-3">
                {automationItems.map((opp, i) => (
                  <textarea
                    key={i}
                    className="w-full bg-transparent text-sm text-emerald-700 outline-none border-b border-emerald-100 focus:border-emerald-300 py-1 resize-y"
                    value={opp}
                    rows={3}
                    onChange={(e) => updateArrayItem('automation_opportunities', i, e.target.value)}
                  />
                ))}
              </div>
            </section>
          </div>

          <section className="bg-slate-50 p-6 border border-slate-100 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tech Tools</label>
              <textarea
                className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none resize-y"
                value={toolItems.join(', ')}
                rows={2}
                onChange={(e) => updateField('tools_used', e.target.value.split(',').map(s => s.trim()))}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">AI Sentiment</label>
                <textarea
                  className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none resize-y"
                  value={data.ai_sentiment}
                  rows={2}
                  onChange={(e) => updateField('ai_sentiment', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tech Score (1-5)</label>
                <input
                  type="number"
                  min="1" max="5"
                  className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                  value={data.technical_proficiency_1_5}
                  onChange={(e) => updateField('technical_proficiency_1_5', parseInt(e.target.value))}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Document Footer */}
        <div className="p-10 bg-slate-100 border-t flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-slate-400 max-w-xs text-center md:text-left">
            Confirming this report will transmit the verified session data to the Botler 360 processing queue and export to Google Sheets.
          </p>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3 border border-slate-300 text-slate-600 font-bold text-sm hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-10 py-3 bg-[#1a365d] text-white font-bold text-sm hover:bg-[#122a4d] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Exporting...
                </>
              ) : (
                <>
                  <i className="fas fa-check-double"></i>
                  Confirm & Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDocument;
