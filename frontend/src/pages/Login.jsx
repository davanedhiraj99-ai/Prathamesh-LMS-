import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [mode, setMode] = useState('student'); // 'student' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);

      if (mode === 'admin' && user.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      if (mode === 'student' && user.role !== 'student') {
        setError('This account is not a student account.');
        return;
      }

      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      if (err?.response?.data?.code === 'IP_LIMIT_EXCEEDED') {
        setError('Maximum devices reached. Please contact support to reset your device slots.');
      } else {
        const base = err?.response?.data?.error || err.message || 'Login failed';
        const details = err?.response?.data?.details;
        setError(details ? `${base}: ${details}` : base);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg relative min-h-screen overflow-hidden">
      <div className="auth-blob pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-400/25" />
      <div className="auth-blob pointer-events-none absolute top-32 -right-24 h-96 w-96 rounded-full bg-indigo-400/20" />
      <div className="auth-blob pointer-events-none absolute -bottom-40 left-1/3 h-[520px] w-[520px] rounded-full bg-sky-300/25" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              Official Learning Portal
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Sign in to continue
            </h1>
            <p className="mt-3 text-slate-600">Choose your role and use your registered email and password.</p>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Account Login</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {mode === 'admin' ? 'Administrative access for course management.' : 'Student access for learning.'}
                    </p>
                  </div>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setMode('student')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        mode === 'student' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('admin')}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        mode === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      {mode === 'admin' ? 'Admin Email' : 'Student Email'}
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      placeholder={mode === 'admin' ? 'admin@example.com' : 'student@example.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`auth-button ${
                      mode === 'admin'
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Secure access</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1">2-device limit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-sm text-slate-700 hover:text-slate-900 transition">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
