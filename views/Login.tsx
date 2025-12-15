import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PalmTreeIcon, LockIcon, UsersIcon } from '../components/Icons';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  logoUrl?: string;
  companyName?: string;
}

export default function Login({ onLogin, logoUrl, companyName }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Name
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Query users table for matching name OR email AND password
      // Note: This matches the user requirement to login via email OR name using the users table password
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},name.eq.${identifier}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        // Check if user is active (default to true if field is missing to avoid lockout)
        if (data.active === false) {
           setError('Your account has been disabled. Please contact an administrator.');
        } else {
           onLogin(data as User);
        }
      } else {
        setError('Invalid credentials. Please check your name/email and password.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-24 mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" className="h-full w-auto object-contain" />
            ) : (
              <div className="w-16 h-16 bg-sandpix-50 rounded-full flex items-center justify-center">
                 <PalmTreeIcon className="w-8 h-8 text-sandpix-600" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{companyName || 'Sandpix Maldives'}</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage your invoices</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UsersIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-sandpix-500 focus:border-sandpix-500 text-sm transition-colors"
                placeholder="Enter your name or email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-sandpix-500 focus:border-sandpix-500 text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sandpix-600 hover:bg-sandpix-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sandpix-500 disabled:opacity-50 disabled:cursor-wait transition-all"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} {companyName || 'Sandpix Maldives'}. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}