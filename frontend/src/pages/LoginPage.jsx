import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Rocket, Eye, EyeOff } from 'lucide-react';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6" data-testid="login-page">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/5 border border-neutral-800 mb-4">
            <Rocket className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-white font-display tracking-tight">Launch Control</h1>
          <p className="text-xs text-neutral-500 mt-1 tracking-widest uppercase">NPD Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h2 className="text-base font-semibold text-white mb-1 font-display">{isRegister ? 'Create account' : 'Sign in'}</h2>
          <p className="text-xs text-neutral-500 mb-5">{isRegister ? 'Join your team on Launch Control' : 'Enter your credentials to continue'}</p>

          {error && (
            <div className="bg-rose-400/10 border border-rose-400/20 text-rose-400 text-xs rounded-md px-3 py-2 mb-4" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-1 block">Name</label>
                <input
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-1 block">Email</label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold tracking-[0.15em] uppercase text-neutral-500 mb-1 block">Password</label>
              <div className="relative">
                <input
                  data-testid="password-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full h-9 rounded-md border border-neutral-800 bg-neutral-950 px-3 pr-9 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-md text-sm font-medium bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              data-testid="toggle-auth-mode"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-neutral-500 hover:text-white transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
