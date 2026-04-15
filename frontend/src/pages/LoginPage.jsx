import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Rocket, Eye, EyeOff } from 'lucide-react';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).filter(Boolean).join(" ");
  return String(detail);
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegister) await register(email, password, name); else await login(email, password);
      navigate('/', { replace: true });
    } catch (err) { setError(formatApiErrorDetail(err.response?.data?.detail) || err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/20">
            <Rocket className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 font-display tracking-tight">Launch Control</h1>
          <p className="text-xs text-slate-500 mt-1 tracking-widest uppercase">NPD Tracker</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-1 font-display">{isRegister ? 'Create account' : 'Sign in'}</h2>
          <p className="text-xs text-slate-500 mb-5">{isRegister ? 'Join your team' : 'Enter your credentials'}</p>
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg px-3 py-2 mb-4" data-testid="auth-error">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-1 block">Name</label>
                <input data-testid="name-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-1 block">Email</label>
              <input data-testid="email-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-1 block">Password</label>
              <div className="relative">
                <input data-testid="password-input" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button data-testid="auth-submit-btn" type="submit" disabled={loading}
              className="w-full h-9 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm mt-1">
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button data-testid="toggle-auth-mode" onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors">
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
