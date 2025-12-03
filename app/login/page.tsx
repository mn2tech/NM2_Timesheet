'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NM2TechLogo from '@/components/NM2TechLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to get basePath (same as dashboard)
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
      // Get basePath and construct API URL (same pattern as dashboard)
      const basePath = getBasePath();
      const apiUrl = `${basePath}/api/auth/login`;
      
      console.log('Attempting login with API URL:', apiUrl);
      console.log('Current location:', typeof window !== 'undefined' ? window.location.href : 'server');
      console.log('Detected basePath:', basePath);
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Include cookies for CORS
      });

      console.log('Login response status:', res.status, res.statusText);

      // Read response as text first (can only read body once)
      const responseText = await res.text();
      console.log('Login response text:', responseText.substring(0, 200));

      let data;
      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
        console.log('Login response data:', data);
      } catch (parseError) {
        // If response is not JSON, show the raw text
        console.error('Failed to parse JSON response:', responseText);
        setError(`Server error: ${res.status} ${res.statusText}. Response: ${responseText.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        console.error('Login failed:', data);
        setError(data.error || `Login failed: ${res.status} ${res.statusText}`);
        setLoading(false);
        return;
      }

      // Set cookie with correct path (works with or without basePath)
      const cookiePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/nm2timesheet')
        ? '/nm2timesheet'
        : '/';
      document.cookie = `token=${data.token}; path=${cookiePath}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Redirect to dashboard (Next.js router handles basePath automatically)
      router.push('/dashboard');
    } catch (err) {
      // More specific error handling
      console.error('Login error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = `Network error: ${err.message}`;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = `Error: ${String(err.message)}`;
      } else if (err) {
        errorMessage = `Error: ${String(err)}`;
      }
      
      setError(errorMessage);
      setLoading(false);
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


