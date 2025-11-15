'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NM2TechLogo from '@/components/NM2TechLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'contractor' | 'admin'>('employee');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get basePath from current location
      const basePath = typeof window !== 'undefined' && window.location.pathname.startsWith('/nm2timesheet') 
        ? '/nm2timesheet' 
        : '';
      
      const res = await fetch(`${basePath}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, adminCode: role === 'admin' ? adminCode : undefined }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        // If response is not JSON, show a more helpful error
        setError(`Server error: ${res.status} ${res.statusText}. Please try again.`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto-login after registration
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push('/dashboard');
    } catch (err) {
      // More specific error handling
      console.error('Registration error:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <NM2TechLogo size="lg" />
          </div>
          <p className="text-gray-600">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'employee' | 'contractor' | 'admin')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === 'admin' && (
            <div>
              <label htmlFor="adminCode" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Code
              </label>
              <input
                id="adminCode"
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter admin code"
              />
              <p className="mt-1 text-xs text-gray-500">Admin registration requires a special code</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-primary-600 hover:text-primary-700 text-sm">
            Already have an account? Sign in here
          </Link>
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

