import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  'Managing Director',
  'Head of Product',
  'Operations Manager',
  'Sales Manager',
  'Contracting Executive',
  'Reservation Agent',
  'Marketing Manager',
  'IT/Tech',
  'Finance/Accounting',
  'Other',
];

const DEPARTMENTS = [
  'Operations',
  'Sales',
  'Marketing',
  'IT',
  'Management',
  'Finance',
  'HR',
  'Other',
];

const TENURES = [
  'Less than 1 year',
  '1-3 years',
  '3-5 years',
  '5+ years',
];

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    department: '',
    tenure: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      const data = await res.json();
      localStorage.setItem('botler_session', JSON.stringify(data));
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-brand-bg border border-slate-700 rounded-lg px-4 py-3 text-brand-text placeholder-slate-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors';
  const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';
  const selectClass =
    'w-full bg-brand-bg border border-slate-700 rounded-lg px-4 py-3 text-brand-text focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors appearance-none';

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-brand-card rounded-2xl shadow-2xl shadow-black/30 p-8 md:p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-accent rounded-full flex items-center justify-center font-bold text-white text-lg shrink-0">
              B
            </div>
            <h1 className="text-xl font-semibold text-brand-text">
              Botler 360{' '}
              <span className="text-slate-400 font-normal">
                &times; Holiday Moments
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm mb-8 ml-[52px]">
            Process Discovery — Help us understand how you work
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First / Last name row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name *</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="First name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  placeholder="Last name"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>

            {/* Role */}
            <div>
              <label className={labelClass}>Role *</label>
              <div className="relative">
                <select
                  required
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className={labelClass}>Department</label>
              <div className="relative">
                <select
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select department (optional)</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tenure */}
            <div>
              <label className={labelClass}>Tenure</label>
              <div className="relative">
                <select
                  value={form.tenure}
                  onChange={(e) => update('tenure', e.target.value)}
                  className={selectClass}
                >
                  <option value="">How long at the company? (optional)</option>
                  {TENURES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <>
                  Start the conversation
                  <span aria-hidden="true">&rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Your responses are confidential and used only for process
            improvement
          </p>
        </div>
      </div>
    </div>
  );
}
