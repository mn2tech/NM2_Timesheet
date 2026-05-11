'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import NM2TechLogo from '@/components/NM2TechLogo';

export const dynamic = 'force-dynamic';

function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.startsWith('/nm2timesheet') ? '/nm2timesheet' : '';
}

function normalizeNextPath(nextPath: string | null): string {
  if (!nextPath) return '/dashboard';
  try {
    const decoded = decodeURIComponent(nextPath);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/dashboard';
    return decoded;
  } catch {
    if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return '/dashboard';
    return nextPath;
  }
}

function readPostLoginTarget(searchParams: ReturnType<typeof useSearchParams>): string {
  const rawNext = searchParams.get('next');
  if (rawNext) {
    return normalizeNextPath(rawNext);
  }
  try {
    const stored = sessionStorage.getItem('timesheet_oauth_post_login');
    if (stored && stored.startsWith('/') && !stored.startsWith('//')) {
      sessionStorage.removeItem('timesheet_oauth_post_login');
      return stored;
    }
  } catch (_) {
    // ignore
  }
  return '/dashboard';
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  const nextPath = useMemo(() => readPostLoginTarget(searchParams), [searchParams]);

  useEffect(() => {
    let alive = true;

    const completeSignIn = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const code = searchParams.get('code');
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            typeof window !== 'undefined' ? window.location.href : code
          );
          if (exchangeError) throw exchangeError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const accessToken = data.session?.access_token;
        if (!accessToken) throw new Error('No Supabase session found');

        const basePath = getBasePath();
        const res = await fetch(`${basePath}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || 'Unable to complete Google sign-in');
        }

        const payload = await res.json();
        const cookiePath =
          typeof window !== 'undefined' && window.location.pathname.startsWith('/nm2timesheet')
            ? '/nm2timesheet'
            : '/';
        document.cookie = `token=${payload.token}; path=${cookiePath}; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        if (alive) router.replace(nextPath);
      } catch (err) {
        console.error('OAuth callback error:', err);
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Google sign-in failed');
      }
    };

    completeSignIn();
    return () => {
      alive = false;
    };
  }, [router, searchParams, nextPath]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <NM2TechLogo size="lg" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Finishing sign-in...</h1>
        {!error ? (
          <p className="mt-2 text-sm text-gray-600">Please wait while we complete your Google login.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="mt-4 bg-primary-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <NM2TechLogo size="lg" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Finishing sign-in...</h1>
            <p className="mt-2 text-sm text-gray-600">Please wait while we complete your Google login.</p>
          </div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
