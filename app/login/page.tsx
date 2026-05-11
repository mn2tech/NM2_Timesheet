'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NM2TechLogo from '@/components/NM2TechLogo';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const getBasePath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/nm2timesheet')) {
        return '/nm2timesheet';
      }
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const basePath = getBasePath();
      const apiUrl = `${basePath}/api/auth/login`;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const responseText = await res.text();
      let data: { token?: string; error?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        setError(`Server error: ${res.status} ${res.statusText}. Response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (!res.ok) {
        setError(data.error || `Login failed: ${res.status} ${res.statusText}`);
        return;
      }

      if (!data.token) {
        setError('Login failed: no token received');
        return;
      }

      const cookiePath =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/nm2timesheet')
          ? '/nm2timesheet'
          : '/';
      document.cookie = `token=${data.token}; path=${cookiePath}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
      } else if (err instanceof Error) {
        errorMessage = `Network error: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      const supabase = getSupabaseBrowserClient();
      const basePath = getBasePath();
      const redirectTo = `${window.location.origin}${basePath}/auth/callback?next=${encodeURIComponent('/dashboard')}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4 safe-area-inset">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <NM2TechLogo size="lg" />
          </div>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="my-4 flex items-center" aria-hidden="true">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-xs uppercase tracking-wide text-gray-400">Or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.6S6.9 21.2 12 21.2c6.9 0 9.2-4.9 9.2-7.4 0-.5 0-.9-.1-1.3H12z"
            />
          </svg>
          {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        <div className="mt-6 text-center space-y-2">
          <div>
            <Link href="/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm">
              Forgot your password?
            </Link>
          </div>
          <div>
            <Link href="/register" className="text-primary-600 hover:text-primary-700 text-sm">
              Don't have an account? Register here
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to home
          </Link>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">Designed by nm2tech - mAIchael</p>
        </div>
      </div>
    </div>
  );
}
