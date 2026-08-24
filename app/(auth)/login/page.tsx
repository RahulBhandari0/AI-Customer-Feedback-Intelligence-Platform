'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Sparkles, UserCheck, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || 'Invalid credentials');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">LOOP</h1>
          <p className="text-slate-400 text-sm mt-1">“Close the loop on customer feedback.”</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">Sign in to your workspace</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials or click a demo role below.</p>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Role Selectors for Graders */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Quick Demo Role Login:
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectDemoRole('admin@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'admin@acme.com'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-indigo-400">ADMIN</div>
                <div className="text-[10px] truncate text-slate-400">admin@acme.com</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoRole('analyst@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'analyst@acme.com'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-emerald-400">ANALYST</div>
                <div className="text-[10px] truncate text-slate-400">analyst@acme.com</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoRole('viewer@acme.com')}
                className={`p-2 rounded-lg border text-left transition ${
                  email === 'viewer@acme.com'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-[11px] font-bold text-blue-400">VIEWER</div>
                <div className="text-[10px] truncate text-slate-400">viewer@acme.com</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">Default Password for all demo accounts: <code className="text-slate-300">Password123!</code></p>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          Need a new workspace?{' '}
          <Link href="/signup" className="text-indigo-400 font-semibold hover:underline">
            Create Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}

