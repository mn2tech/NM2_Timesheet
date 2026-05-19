'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { getApiBasePath } from '@/lib/api-helper';

type GoogleSignInButtonProps = {
  disabled?: boolean;
  onStart?: () => void;
  onError?: (message: string) => void;
};

export default function GoogleSignInButton({
  disabled = false,
  onStart,
  onError,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    onStart?.();
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const basePath = getApiBasePath();

      try {
        sessionStorage.setItem('timesheet_oauth_post_login', '/dashboard');
      } catch {
        // sessionStorage may be unavailable in some embedded browsers
      }

      const redirectTo = `${window.location.origin}${basePath}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Google sign-in error:', err);
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed';
      onError?.(message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.8 2.9 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.6S6.9 21.2 12 21.2c6.9 0 9.2-4.9 9.2-7.4 0-.5 0-.9-.1-1.3H12z"
        />
      </svg>
      {loading ? 'Redirecting...' : 'Continue with Google'}
    </button>
  );
}
