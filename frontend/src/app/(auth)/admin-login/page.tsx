'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LayoutDashboard, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginSchema, type LoginFormData } from '@/validations/auth.schema';
import { loginUser, logoutUser, resetAuthRequestState } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { APP_NAME } from '@/constants';

export default function AdminLoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authError = useAppSelector((state) => state.auth.error);
  const [showPassword, setShowPassword] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(resetAuthRequestState());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setAccessError(null);
    setIsSubmitting(true);
    try {
      const result = await dispatch(loginUser(data));

      if (!loginUser.fulfilled.match(result)) return;

      const role = result.payload.user.role;
      if (role !== 'admin' && role !== 'super_admin') {
        await dispatch(logoutUser());
        setAccessError('This account does not have permission to access the admin panel.');
        return;
      }

      toast.success(`Welcome to the ${APP_NAME} admin panel`);
      router.replace('/admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#160d09] px-4 py-12">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-playfair text-xl font-bold">
              P
            </span>
            <span className="font-playfair text-2xl font-bold">{APP_NAME}</span>
          </Link>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-secondary">
            <ShieldCheck className="h-4 w-4" /> Secure administration
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
          <div className="mb-7">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-playfair text-3xl font-bold text-foreground">Admin sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter an authorized administrator account to continue.
            </p>
          </div>

          {(accessError || authError) && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {accessError || authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="admin-email"
                  {...register('email')}
                  type="email"
                  autoComplete="username"
                  placeholder="admin@example.com"
                  className="input-field pl-10"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="admin-password" className="text-sm font-semibold text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="admin-password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full gap-2">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verifying access…</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Sign in to admin panel</>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Authorized personnel only. Access attempts may be logged.
        </p>
      </div>
    </div>
  );
}
