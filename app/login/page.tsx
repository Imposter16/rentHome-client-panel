'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/authApi';
import { Building2, ArrowRight, ShieldCheck, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

import { toast } from '@/components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('tenant.test@renthome.com');
  const [password, setPassword] = useState('Tenant@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser(identifier, password);
      const role = res.user?.userType;

      toast.success(`Welcome back, ${res.user?.name || 'User'}!`);

      if (role === 'LANDLORD') {
        router.push('/landlord/dashboard');
      } else {
        router.push('/properties');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (type: 'TENANT' | 'LANDLORD' | 'ADMIN') => {
    if (type === 'TENANT') {
      setIdentifier('tenant.test@renthome.com');
      setPassword('Tenant@123');
    } else if (type === 'LANDLORD') {
      setIdentifier('landlord.test@renthome.com');
      setPassword('Landlord@123');
    } else {
      setIdentifier('admin.renthome@gmail.com');
      setPassword('Admin@123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to RentHome</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to your rental marketplace account</p>
        </div>

        {/* Demo Quick-Fill Pill Bar */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 mb-5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Demo:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setDemoCredentials('TENANT')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-medium rounded-lg transition-colors shadow-2xs"
            >
              Tenant Demo
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('LANDLORD')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 font-medium rounded-lg transition-colors shadow-2xs"
            >
              Landlord Demo
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('ADMIN')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-purple-700 font-medium rounded-lg transition-colors shadow-2xs"
            >
              Admin Demo
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or +919876543210"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to RentHome</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
