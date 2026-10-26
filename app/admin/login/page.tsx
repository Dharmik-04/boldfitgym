'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/apiConfig';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Field-specific validation errors from the backend API
  const [fieldErrors, setFieldErrors] = useState<{ usernameOrEmail?: string; password?: string }>({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/admin/dashboard');
    }
    
    // Check if rememberMe username is saved
    const savedUser = localStorage.getItem('rememberedAdminUser');
    if (savedUser) {
      setUsernameOrEmail(savedUser);
      setRememberMe(true);
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setFieldErrors({});
    setErrorMsg(null);

    if (!usernameOrEmail || !password) {
      const localErrors: { usernameOrEmail?: string; password?: string } = {};
      if (!usernameOrEmail) localErrors.usernameOrEmail = 'Username or Email is required.';
      if (!password) localErrors.password = 'Password is required.';
      setFieldErrors(localErrors);
      setErrorMsg('Please enter both your credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // If API returned structural validation errors, capture them
        if (data.errors && Array.isArray(data.errors)) {
          const errorsMap: typeof fieldErrors = {};
          data.errors.forEach((err: any) => {
            if (err.field === 'usernameOrEmail' || err.field === 'password') {
              errorsMap[err.field as keyof typeof fieldErrors] = err.message;
            }
          });
          setFieldErrors(errorsMap);
          throw new Error('Please correct the validation errors below.');
        }
        throw new Error(data.message || 'Login credentials invalid.');
      }

      // Save token and user details
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('adminUser', data.data.admin.username);
      
      // Store complete admin information object
      localStorage.setItem('admin', JSON.stringify(data.data.admin));

      // Handle Remember Me preservation
      if (rememberMe) {
        localStorage.setItem('rememberedAdminUser', usernameOrEmail);
      } else {
        localStorage.removeItem('rememberedAdminUser');
      }
      
      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 font-sans text-zinc-100">
      <div className="w-full max-w-md bg-[#0c0c0e]/80 border border-zinc-800 p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6">
        
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#FFE600]/10 border border-[#FFE600]/25 items-center justify-center text-[#FFE600] mb-2 shadow-lg shadow-[#FFE600]/5 animate-pulse">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">
            Admin Login
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Gym Management System Portal</p>
        </div>

        {/* Error Message Area */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-950/20 border border-red-900/50 p-4 rounded-xl text-xs text-red-400 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Form Block */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-650" />
              <input
                type="text"
                disabled={isLoading}
                value={usernameOrEmail}
                onChange={(e) => {
                  setUsernameOrEmail(e.target.value);
                  if (fieldErrors.usernameOrEmail) {
                    setFieldErrors(prev => ({ ...prev, usernameOrEmail: undefined }));
                  }
                }}
                placeholder="admin or admin@gym.com"
                className={`w-full bg-zinc-950 border ${fieldErrors.usernameOrEmail ? 'border-red-900 focus:border-red-500' : 'border-zinc-800 focus:border-[#FFE600]'} rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none transition-colors focus:ring-1 focus:ring-[#FFE600]/20`}
              />
            </div>
            {fieldErrors.usernameOrEmail && (
              <p className="text-red-450 text-[10px] font-bold uppercase tracking-wider mt-1">{fieldErrors.usernameOrEmail}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Password</label>
              <Link href="#" onClick={(e) => { e.preventDefault(); alert('Please contact the system administrator to reset password.'); }} className="text-[10px] font-bold uppercase tracking-wider text-[#FFE600]/80 hover:text-[#FFE600] transition-colors">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4.5 h-4.5 text-zinc-650" />
              <input
                type={showPassword ? 'text' : 'password'}
                disabled={isLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="••••••••"
                className={`w-full bg-zinc-950 border ${fieldErrors.password ? 'border-red-900 focus:border-red-500' : 'border-zinc-800 focus:border-[#FFE600]'} rounded-xl pl-11 pr-11 py-3 text-sm text-white focus:outline-none transition-colors focus:ring-1 focus:ring-[#FFE600]/20`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-450 text-[10px] font-bold uppercase tracking-wider mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-[#FFE600] w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-black cursor-pointer focus:ring-0"
            />
            <label htmlFor="remember" className="text-xs text-zinc-450 select-none cursor-pointer font-medium">
              Remember me on this device
            </label>
          </div>

          {/* Login Button & Loading indicator */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#FFE600] hover:bg-[#e0ca00] text-black font-extrabold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#FFE600]/10 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                <span>Logging In...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
