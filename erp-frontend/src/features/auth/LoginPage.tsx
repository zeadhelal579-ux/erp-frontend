import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FormField } from '@/components/FormField';
import { isMockMode } from '@/lib/api-client';
import { MOCK_ACCOUNTS } from '@/lib/mock/accounts';

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function signIn(user: string, pass: string) {
    setError(null);
    try {
      await login(user, pass);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(username, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1.5 bg-brand-600" />
        <div className="p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
              MES
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Production Management System</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <div className="relative">
              <FormField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          {isMockMode && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <p className="mb-1 text-center text-xs font-semibold text-amber-700">Demo mode — sample data, no backend</p>
              <p className="mb-3 text-center text-xs text-gray-500">Pick a role to sign in (any password works):</p>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_ACCOUNTS.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void signIn(account.username, 'demo')}
                    className="rounded-md border border-gray-200 px-2 py-2 text-left text-xs transition-colors hover:border-brand-200 hover:bg-brand-50 disabled:opacity-60"
                  >
                    <span className="block font-medium text-gray-800">{account.roleLabel}</span>
                    <span className="block text-gray-500">{account.username}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
